import React from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, Brain, Check, CheckCircle2, ChevronRight,
  Clock3, Headphones, Languages, Loader2, MessageSquare, Moon, RefreshCw,
  Save, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Sun, Target, Trash2,
} from "lucide-react";
import { auth } from "../../firebase";
import { useAppTheme } from "../../context/ThemeContext";

export interface LearningMemory {
  enabled: boolean;
  vocabularyMastered: string[];
  grammarWeaknesses: string[];
  preferredStyle: string;
  learningGoals: string[];
  motivation: string;
  studyFrequency: string;
  cefrLevel: string;
  totalTutorTurns: number;
  lastSessionAt: string | null;
  recentQuizEvidence: string[];
  lastQuizAt: string | null;
}

type MemoryScreen = "overview" | "competencies" | "journey" | "control";
type CompetencyTab = "vocabulary" | "grammar" | "pronunciation";

const EMPTY_MEMORY: LearningMemory = {
  enabled: true, vocabularyMastered: [], grammarWeaknesses: [], preferredStyle: "balanced",
  learningGoals: [], motivation: "", studyFrequency: "", cefrLevel: "A1",
  totalTutorTurns: 0, lastSessionAt: null, recentQuizEvidence: [], lastQuizAt: null,
};

const CORRECTION_STYLES: Record<string, string> = {
  balanced: "Equilibrado", gentle: "Suave e encorajador", direct: "Direto e objetivo",
  delayed: "Correções no final",
};

export function parseMemoryList(value: string): string[] {
  return [...new Set(value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean))];
}

const formatDate = (value: string | null) => {
  if (!value) return "Ainda sem sessões registadas";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data indisponível" : date.toLocaleString("pt-PT");
};

async function authenticatedRequest(path: string, init?: RequestInit) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sessão expirada. Entre novamente para gerir a memória.");
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init?.headers || {}) },
  });
  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Não foi possível concluir a operação.");
  }
  return response;
}

const Surface: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>{children}</div>
);

const EmptyState: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center px-5 py-10 text-center sm:py-14">
    <div className="relative mb-6 grid h-24 w-24 place-items-center rounded-full border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300">
      <Sparkles className="absolute -right-1 top-1 h-5 w-5" />{icon}
    </div>
    <h4 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">{title}</h4>
    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
  </div>
);

export const LearningMemoryPanel: React.FC<{ userId?: string }> = ({ userId }) => {
  const { colorScheme, setColorScheme } = useAppTheme();
  const [screen, setScreen] = React.useState<MemoryScreen>("overview");
  const [competencyTab, setCompetencyTab] = React.useState<CompetencyTab>("vocabulary");
  const [memory, setMemory] = React.useState<LearningMemory>(EMPTY_MEMORY);
  const [goals, setGoals] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [status, setStatus] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const applyMemory = React.useCallback((next: LearningMemory) => {
    const normalized = { ...EMPTY_MEMORY, ...next };
    setMemory(normalized);
    setGoals(normalized.learningGoals.join("\n"));
  }, []);

  const loadMemory = React.useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true); setStatus(null);
    try {
      const response = await authenticatedRequest("/api/tutor-memory");
      applyMemory((await response.json()).memory);
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Erro ao carregar a memória." });
    } finally { setLoading(false); }
  }, [applyMemory, userId]);

  React.useEffect(() => { void loadMemory(); }, [loadMemory]);

  const saveMemory = async (overrides: Partial<LearningMemory> = {}) => {
    setSaving(true); setStatus(null);
    try {
      const response = await authenticatedRequest("/api/tutor-memory", {
        method: "PATCH",
        body: JSON.stringify({
          enabled: memory.enabled,
          learningGoals: parseMemoryList(goals),
          grammarWeaknesses: memory.grammarWeaknesses,
          vocabularyMastered: memory.vocabularyMastered,
          preferredStyle: memory.preferredStyle,
          motivation: memory.motivation,
          studyFrequency: memory.studyFrequency,
          ...overrides,
        }),
      });
      applyMemory((await response.json()).memory);
      setStatus({ type: "success", text: "Memória de aprendizagem atualizada." });
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Erro ao guardar." });
    } finally { setSaving(false); }
  };

  const deleteMemory = async () => {
    setSaving(true); setStatus(null);
    try {
      await authenticatedRequest("/api/tutor-memory", { method: "DELETE" });
      applyMemory(EMPTY_MEMORY); setConfirmDelete(false); setScreen("overview");
      setStatus({ type: "success", text: "Memória apagada definitivamente. Uma nova memória vazia será criada apenas quando voltar a usar o tutor." });
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Erro ao apagar." });
    } finally { setSaving(false); }
  };

  const changeScreen = (next: MemoryScreen) => { setConfirmDelete(false); setStatus(null); setScreen(next); };
  const screenTitle = { overview: "Minha Memória", competencies: "Competências", journey: "Percurso", control: "Controlo da memória" }[screen];
  const systemDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const isDark = colorScheme === "dark" || (colorScheme === "system" && systemDark);

  const toggleMemory = () => {
    const enabled = !memory.enabled;
    setMemory((current) => ({ ...current, enabled }));
    void saveMemory({ enabled });
  };

  return (
    <section id="learning-memory-panel" className="col-span-1 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm md:col-span-2 dark:border-slate-800 dark:bg-[#07101f]">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 dark:border-slate-800 dark:bg-[#081323]">
        <div className="flex min-w-0 items-center gap-3">
          {screen !== "overview" ? (
            <button type="button" onClick={() => changeScreen("overview")} aria-label="Voltar à memória" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-slate-300 dark:hover:bg-slate-800"><ArrowLeft className="h-5 w-5" /></button>
          ) : <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"><Brain className="h-5 w-5" /></div>}
          <div className="min-w-0"><h3 className="whitespace-nowrap text-base font-black tracking-tight text-slate-950 sm:text-lg dark:text-white">{screenTitle}</h3><p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">Dados privados associados à sua conta.</p></div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setColorScheme(isDark ? "light" : "dark")} aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-violet-700 focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
          {screen === "overview" && <button type="button" onClick={() => void loadMemory()} disabled={loading || saving} aria-label="Atualizar memória" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>}
          <button type="button" onClick={() => changeScreen("control")} aria-label="Abrir controlo da memória" className="grid h-10 w-10 place-items-center rounded-xl text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"><ShieldCheck className="h-5 w-5" /></button>
        </div>
      </header>

      {loading ? <div className="flex min-h-[420px] items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400"><Loader2 className="h-5 w-5 animate-spin text-violet-600" /> A carregar memória…</div> : (
        <div className="p-4 sm:p-6">
          {screen === "overview" && <Overview memory={memory} saving={saving} onToggle={toggleMemory} onScreen={changeScreen} />}
          {screen === "competencies" && <Competencies memory={memory} tab={competencyTab} setTab={setCompetencyTab} />}
          {screen === "journey" && <Journey memory={memory} />}
          {screen === "control" && <Control memory={memory} setMemory={setMemory} goals={goals} setGoals={setGoals} saving={saving} onToggle={toggleMemory} onSave={() => void saveMemory()} confirmDelete={confirmDelete} setConfirmDelete={setConfirmDelete} onDelete={() => void deleteMemory()} />}
          {status && <div role="status" className={`mt-5 flex items-center gap-2 rounded-xl p-3 text-xs font-semibold ${status.type === "success" ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300"}`}>{status.type === "success" && <CheckCircle2 className="h-4 w-4" />}{status.text}</div>}
        </div>
      )}

      <nav aria-label="Navegação da memória" className="grid grid-cols-4 border-t border-slate-200 bg-white px-2 dark:border-slate-800 dark:bg-[#081323]">
        {([['overview', Brain, 'Resumo'], ['competencies', BookOpen, 'Competências'], ['journey', Clock3, 'Percurso'], ['control', Settings2, 'Controlo']] as const).map(([id, Icon, label]) => {
          const selected = screen === id;
          return <button key={id} type="button" onClick={() => changeScreen(id)} aria-current={selected ? "page" : undefined} className={`flex min-w-0 flex-col items-center gap-1 border-t-2 px-1 py-3 text-[10px] font-bold transition sm:text-xs ${selected ? "border-violet-600 text-violet-700 dark:border-violet-400 dark:text-violet-300" : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}><Icon className="h-5 w-5" /><span className="truncate">{label}</span></button>;
        })}
      </nav>
    </section>
  );
};

const Overview: React.FC<{ memory: LearningMemory; saving: boolean; onToggle: () => void; onScreen: (screen: MemoryScreen) => void }> = ({ memory, saving, onToggle, onScreen }) => (
  <div className="space-y-5">
    <div className="relative overflow-hidden rounded-3xl bg-[#0b1324] px-5 py-7 text-white sm:px-7 sm:py-9">
      <div className="pointer-events-none absolute -right-14 -top-16 h-56 w-56 rounded-full border border-violet-400/20 shadow-[0_0_0_28px_rgba(139,92,246,0.04),0_0_0_56px_rgba(139,92,246,0.025)]" />
      <div className="relative max-w-xl"><h4 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">O que o LingoLIVE aprendeu sobre si</h4><p className="mt-3 text-sm leading-6 text-slate-300">A sua memória liga tutor, quizzes, pronúncia e revisões.</p>
        <div className="mt-7 flex items-center justify-between gap-4 border-t border-white/10 pt-5"><div className="flex items-center gap-3"><span className={`grid h-8 w-8 place-items-center rounded-full ${memory.enabled ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-700 text-slate-400"}`}><Check className="h-4 w-4" /></span><div><p className="text-sm font-bold">Personalização {memory.enabled ? "ativa" : "inativa"}</p><p className="text-xs text-slate-400">Controle como o tutor usa os dados.</p></div></div><MemoryToggle enabled={memory.enabled} saving={saving} onToggle={onToggle} /></div>
      </div>
    </div>
    <div><div className="mb-3 flex items-center justify-between"><h4 className="text-lg font-black text-slate-950 dark:text-white">Retrato atual</h4><button type="button" onClick={() => onScreen("competencies")} className="text-xs font-bold text-violet-700 hover:underline dark:text-violet-300">Ver competências</button></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[["Nível observado", memory.cefrLevel || "—"], ["Turnos com tutor", memory.totalTutorTurns ? String(memory.totalTutorTurns) : "—"], ["Vocabulário", memory.vocabularyMastered.length ? String(memory.vocabularyMastered.length) : "—"], ["Pontos a rever", memory.grammarWeaknesses.length ? String(memory.grammarWeaknesses.length) : "—"]].map(([label, value]) => <Surface key={label} className="p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{value}</p></Surface>)}</div>
    </div>
    <Surface className="p-5"><div className="flex items-start gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-violet-200 text-violet-600 dark:border-violet-500/30 dark:text-violet-300"><Clock3 className="h-5 w-5" /></div><div className="min-w-0 flex-1"><h4 className="font-black text-slate-950 dark:text-white">Última evidência</h4>{memory.recentQuizEvidence.length ? <><p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">{memory.recentQuizEvidence.join(" · ")}</p><p className="mt-1 text-xs text-slate-400">{formatDate(memory.lastQuizAt)}</p></> : <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Aguardando atividade autenticada.</p>}</div></div><button type="button" onClick={() => onScreen("journey")} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-violet-300 px-4 py-3 text-sm font-black text-violet-700 hover:bg-violet-50 dark:border-violet-500/50 dark:text-violet-300 dark:hover:bg-violet-500/10">Ver percurso <ArrowRight className="h-4 w-4" /></button></Surface>
  </div>
);

const MemoryToggle: React.FC<{ enabled: boolean; saving: boolean; onToggle: () => void }> = ({ enabled, saving, onToggle }) => <button type="button" role="switch" aria-checked={enabled} aria-label="Ativar memória de aprendizagem" disabled={saving} onClick={onToggle} className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-violet-400 ${enabled ? "bg-emerald-500" : "bg-slate-600"}`}><span className={`mt-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} /></button>;

const Competencies: React.FC<{ memory: LearningMemory; tab: CompetencyTab; setTab: (tab: CompetencyTab) => void }> = ({ memory, tab, setTab }) => {
  const items = tab === "vocabulary" ? memory.vocabularyMastered : tab === "grammar" ? memory.grammarWeaknesses : [];
  const empty = tab === "vocabulary" ? [Languages, "Ainda não há vocabulário consolidado", "Conclua atividades para que o LingoLIVE identifique palavras dominadas."] : tab === "grammar" ? [Target, "Ainda não há pontos a rever", "Os pontos gramaticais aparecem após atividades corrigidas."] : [Headphones, "Ainda não há registos de pronúncia", "Conclua um exercício autenticado para começar a construir este histórico."];
  const EmptyIcon = empty[0] as React.ComponentType<{ className?: string }>;
  return <div className="space-y-5"><div role="tablist" aria-label="Tipo de competência" className="grid grid-cols-3 rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">{([['vocabulary', 'Vocabulário'], ['grammar', 'Gramática'], ['pronunciation', 'Pronúncia']] as const).map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} type="button" onClick={() => setTab(id)} className={`rounded-xl px-2 py-3 text-xs font-black sm:text-sm ${tab === id ? "bg-violet-600 text-white" : "text-slate-500 dark:text-slate-400"}`}>{label}</button>)}</div><p className="text-sm text-slate-500 dark:text-slate-400">Itens registados a partir da sua atividade autenticada.</p>
    {items.length ? <Surface className="divide-y divide-slate-100 dark:divide-slate-800">{items.map((item) => <div key={item} className="flex items-center gap-3 px-5 py-4"><BookOpen className="h-4 w-4 text-violet-500" /><span className="font-semibold text-slate-800 dark:text-slate-200">{item}</span></div>)}</Surface> : <Surface><EmptyState icon={<EmptyIcon className="h-10 w-10" />} title={String(empty[1])} description={String(empty[2])} /></Surface>}
    <Surface className="p-5"><h4 className="font-black text-slate-950 dark:text-white">Como isto é atualizado</h4><div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">{[[CheckCircle2, "Quiz corrigido", memory.recentQuizEvidence.length > 0], [MessageSquare, "Sessão com tutor", memory.totalTutorTurns > 0], [BookOpen, "Flashcards revistos", false]].map(([Icon, label, present]) => { const I = Icon as React.ComponentType<{ className?: string }>; return <div key={String(label)} className="flex items-center gap-3 py-3"><I className="h-4 w-4 text-violet-500" /><span className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-300">{String(label)}</span><span className="text-xs text-slate-400">{present ? "Registado" : "Sem registo"}</span></div>; })}</div></Surface><p className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Só você pode consultar esta memória.</p></div>;
};

const Journey: React.FC<{ memory: LearningMemory }> = ({ memory }) => <div className="space-y-5"><p className="text-center text-sm text-slate-500 dark:text-slate-400">A memória cresce apenas com atividade concluída.</p>{memory.recentQuizEvidence.length || memory.totalTutorTurns ? <Surface className="divide-y divide-slate-100 dark:divide-slate-800">{memory.recentQuizEvidence.length > 0 && <Evidence icon={CheckCircle2} title="Quiz corrigido" text={memory.recentQuizEvidence.join(" · ")} date={formatDate(memory.lastQuizAt)} />}{memory.totalTutorTurns > 0 && <Evidence icon={MessageSquare} title="Sessão com tutor" text={`${memory.totalTutorTurns} turnos autenticados no total.`} date={formatDate(memory.lastSessionAt)} />}</Surface> : <Surface><EmptyState icon={<BookOpen className="h-10 w-10" />} title="Ainda não existem evidências" description="Quando concluir um quiz, uma sessão ou um exercício de pronúncia, o registo aparecerá aqui." /></Surface>}<div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"><ShieldCheck className="h-5 w-5 shrink-0" /> Cada atividade é registada uma única vez.</div></div>;

const Evidence: React.FC<{ icon: React.ComponentType<{ className?: string }>; title: string; text: string; date: string }> = ({ icon: Icon, title, text, date }) => <div className="flex gap-4 p-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"><Icon className="h-5 w-5" /></span><div><p className="font-black text-slate-900 dark:text-white">{title}</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{text}</p><p className="mt-1 text-xs text-slate-400">{date}</p></div></div>;

interface ControlProps { memory: LearningMemory; setMemory: React.Dispatch<React.SetStateAction<LearningMemory>>; goals: string; setGoals: (value: string) => void; saving: boolean; onToggle: () => void; onSave: () => void; confirmDelete: boolean; setConfirmDelete: (value: boolean) => void; onDelete: () => void; }
const Control: React.FC<ControlProps> = ({ memory, setMemory, goals, setGoals, saving, onToggle, onSave, confirmDelete, setConfirmDelete, onDelete }) => <div className="space-y-5"><div className="py-4 text-center"><div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"><ShieldCheck className="h-9 w-9" /></div><h4 className="mx-auto mt-5 max-w-lg text-2xl font-black tracking-tight text-slate-950 dark:text-white">Os seus dados de aprendizagem pertencem-lhe.</h4><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Controle como a sua memória é usada para personalizar a sua experiência.</p></div>
  <Surface className="divide-y divide-slate-100 dark:divide-slate-800"><div className="flex items-center justify-between gap-4 p-5"><div><p className="font-black text-slate-900 dark:text-white">Personalização com memória</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">O tutor pode usar e atualizar a memória.</p></div><MemoryToggle enabled={memory.enabled} saving={saving} onToggle={onToggle} /></div>
    <label className="flex items-center gap-3 p-5"><Settings2 className="h-5 w-5 text-violet-500" /><span className="flex-1 text-sm font-bold text-slate-800 dark:text-slate-200">Estilo de correção</span><select aria-label="Estilo de correção" value={memory.preferredStyle} onChange={(event) => setMemory((current) => ({ ...current, preferredStyle: event.target.value }))} className="max-w-[12rem] rounded-lg border-0 bg-transparent text-right text-sm font-semibold text-slate-500 outline-none focus:ring-2 focus:ring-violet-500 dark:text-slate-300">{Object.entries(CORRECTION_STYLES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label className="flex items-center gap-3 p-5"><Clock3 className="h-5 w-5 text-violet-500" /><span className="flex-1 text-sm font-bold text-slate-800 dark:text-slate-200">Frequência de estudo</span><input aria-label="Frequência de estudo" value={memory.studyFrequency} onChange={(event) => setMemory((current) => ({ ...current, studyFrequency: event.target.value }))} placeholder="Por definir" className="w-36 bg-transparent text-right text-sm font-semibold text-slate-500 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 dark:text-slate-300" /></label>
    <label className="block p-5"><span className="flex items-center gap-3 text-sm font-bold text-slate-800 dark:text-slate-200"><Target className="h-5 w-5 text-violet-500" /> Objetivos pessoais</span><textarea aria-label="Objetivos pessoais" value={goals} onChange={(event) => setGoals(event.target.value)} rows={3} placeholder="Um objetivo por linha" className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" /></label>
    <label className="block p-5"><span className="flex items-center gap-3 text-sm font-bold text-slate-800 dark:text-slate-200"><SlidersHorizontal className="h-5 w-5 text-violet-500" /> Motivação pessoal</span><input aria-label="Motivação pessoal" value={memory.motivation} onChange={(event) => setMemory((current) => ({ ...current, motivation: event.target.value }))} placeholder="Por definir" className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" /></label></Surface>
  <button type="button" onClick={onSave} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-black text-white hover:bg-violet-700 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar alterações</button><div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"><ShieldCheck className="h-5 w-5 shrink-0" /> Desativar preserva os dados e impede o uso.</div>
  <Surface className="border-rose-200 p-4 dark:border-rose-500/20"><button type="button" onClick={() => setConfirmDelete(true)} disabled={saving} className="flex w-full items-center gap-3 text-left text-rose-700 dark:text-rose-400"><Trash2 className="h-5 w-5" /><span className="flex-1"><span className="block text-sm font-black">Apagar toda a memória</span><span className="mt-1 block text-xs font-medium text-slate-500 dark:text-slate-400">A eliminação é definitiva e exige confirmação.</span></span><ChevronRight className="h-5 w-5" /></button>{confirmDelete && <div className="mt-4 border-t border-rose-100 pt-4 dark:border-rose-500/20"><p className="text-xs font-black text-rose-800 dark:text-rose-300">Esta ação é definitiva.</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => setConfirmDelete(false)} className="flex-1 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancelar</button><button type="button" onClick={onDelete} disabled={saving} className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white">Confirmar eliminação</button></div></div>}</Surface></div>;
