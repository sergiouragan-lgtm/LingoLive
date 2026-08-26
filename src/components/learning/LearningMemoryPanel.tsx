import React from "react";
import {
  Brain,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { auth } from "../../firebase";

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
}

const EMPTY_MEMORY: LearningMemory = {
  enabled: true,
  vocabularyMastered: [],
  grammarWeaknesses: [],
  preferredStyle: "balanced",
  learningGoals: [],
  motivation: "",
  studyFrequency: "",
  cefrLevel: "A1",
  totalTutorTurns: 0,
  lastSessionAt: null,
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
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Não foi possível concluir a operação.");
  }
  return response;
}

export const LearningMemoryPanel: React.FC<{ userId?: string }> = ({ userId }) => {
  const [memory, setMemory] = React.useState<LearningMemory>(EMPTY_MEMORY);
  const [goals, setGoals] = React.useState("");
  const [weaknesses, setWeaknesses] = React.useState("");
  const [vocabulary, setVocabulary] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [status, setStatus] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const applyMemory = React.useCallback((next: LearningMemory) => {
    const normalized = { ...EMPTY_MEMORY, ...next };
    setMemory(normalized);
    setGoals(normalized.learningGoals.join("\n"));
    setWeaknesses(normalized.grammarWeaknesses.join("\n"));
    setVocabulary(normalized.vocabularyMastered.join("\n"));
  }, []);

  const loadMemory = React.useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const response = await authenticatedRequest("/api/tutor-memory");
      const body = await response.json();
      applyMemory(body.memory);
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Erro ao carregar a memória." });
    } finally {
      setLoading(false);
    }
  }, [applyMemory, userId]);

  React.useEffect(() => {
    void loadMemory();
  }, [loadMemory]);

  const saveMemory = async (overrides: Partial<LearningMemory> = {}) => {
    setSaving(true);
    setStatus(null);
    try {
      const response = await authenticatedRequest("/api/tutor-memory", {
        method: "PATCH",
        body: JSON.stringify({
          enabled: memory.enabled,
          learningGoals: parseMemoryList(goals),
          grammarWeaknesses: parseMemoryList(weaknesses),
          vocabularyMastered: parseMemoryList(vocabulary),
          preferredStyle: memory.preferredStyle,
          motivation: memory.motivation,
          studyFrequency: memory.studyFrequency,
          ...overrides,
        }),
      });
      const body = await response.json();
      applyMemory(body.memory);
      setStatus({ type: "success", text: "Memória de aprendizagem atualizada." });
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Erro ao guardar." });
    } finally {
      setSaving(false);
    }
  };

  const deleteMemory = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await authenticatedRequest("/api/tutor-memory", { method: "DELETE" });
      applyMemory(EMPTY_MEMORY);
      setConfirmDelete(false);
      setStatus({ type: "success", text: "Memória apagada definitivamente. Uma nova memória vazia será criada apenas quando voltar a usar o tutor." });
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Erro ao apagar." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm col-span-1 md:col-span-2" id="learning-memory-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 pb-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-violet-50 rounded-xl"><Brain className="w-5 h-5 text-violet-600" /></div>
          <div>
            <h3 className="text-lg font-bold text-slate-950">Minha Memória de Aprendizagem</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Veja e controle o que o Tutor IA utiliza para manter continuidade entre sessões. Estes dados são privados e associados à sua conta.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void loadMemory()}
          disabled={loading || saving}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </button>
      </div>

      {loading ? (
        <div className="py-14 flex items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-violet-600" /> A carregar memória…
        </div>
      ) : (
        <div className="space-y-6 pt-5">
          <div className={`flex items-center justify-between gap-4 p-4 rounded-2xl border ${memory.enabled ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-200"}`}>
            <div>
              <p className="text-sm font-bold text-slate-900">Personalização com memória</p>
              <p className="text-[11px] text-slate-500 mt-1">{memory.enabled ? "O tutor pode usar e atualizar esta memória." : "O tutor não lê nem atualiza esta memória."}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={memory.enabled}
              aria-label="Ativar memória de aprendizagem"
              disabled={saving}
              onClick={() => {
                const enabled = !memory.enabled;
                setMemory((current) => ({ ...current, enabled }));
                void saveMemory({ enabled });
              }}
              className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors ${memory.enabled ? "bg-emerald-600" : "bg-slate-300"}`}
            >
              <span className={`mt-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${memory.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              ["Nível observado", memory.cefrLevel],
              ["Turnos com tutor", String(memory.totalTutorTurns)],
              ["Vocabulário", String(memory.vocabularyMastered.length)],
              ["Pontos a rever", String(memory.grammarWeaknesses.length)],
            ].map(([label, value]) => (
              <div key={label} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">{label}</p>
                <p className="text-xl font-black text-slate-900 mt-1">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="space-y-1.5 text-xs font-bold text-slate-700">
              Objetivos de aprendizagem
              <textarea value={goals} onChange={(event) => setGoals(event.target.value)} rows={4} placeholder="Um objetivo por linha" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:ring-2 focus:ring-violet-200 outline-none" />
            </label>
            <label className="space-y-1.5 text-xs font-bold text-slate-700">
              Pontos gramaticais a acompanhar
              <textarea value={weaknesses} onChange={(event) => setWeaknesses(event.target.value)} rows={4} placeholder="Um ponto por linha" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:ring-2 focus:ring-violet-200 outline-none" />
            </label>
            <label className="space-y-1.5 text-xs font-bold text-slate-700">
              Vocabulário já trabalhado
              <textarea value={vocabulary} onChange={(event) => setVocabulary(event.target.value)} rows={4} placeholder="Uma palavra por linha" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:ring-2 focus:ring-violet-200 outline-none" />
            </label>
            <div className="grid grid-cols-1 gap-3">
              <label className="space-y-1.5 text-xs font-bold text-slate-700">
                Estilo de correção
                <select value={memory.preferredStyle} onChange={(event) => setMemory((current) => ({ ...current, preferredStyle: event.target.value }))} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold">
                  <option value="balanced">Equilibrado</option>
                  <option value="gentle">Suave e encorajador</option>
                  <option value="direct">Direto e objetivo</option>
                  <option value="delayed">Correções no final</option>
                </select>
              </label>
              <label className="space-y-1.5 text-xs font-bold text-slate-700">
                Frequência de estudo
                <input value={memory.studyFrequency} onChange={(event) => setMemory((current) => ({ ...current, studyFrequency: event.target.value }))} placeholder="Ex.: 4 vezes por semana" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium" />
              </label>
            </div>
          </div>

          <label className="block space-y-1.5 text-xs font-bold text-slate-700">
            Motivação pessoal
            <input value={memory.motivation} onChange={(event) => setMemory((current) => ({ ...current, motivation: event.target.value }))} placeholder="Ex.: comunicar melhor no trabalho" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium" />
          </label>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-violet-50 border border-violet-100 rounded-xl p-3">
            <ShieldCheck className="w-4 h-4 text-violet-600 shrink-0" />
            Última sessão: {formatDate(memory.lastSessionAt)}. Desativar preserva os dados, mas impede o uso; apagar remove o documento de memória.
          </div>

          {status && (
            <div role="status" className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${status.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
              {status.type === "success" && <CheckCircle2 className="w-4 h-4" />}{status.text}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-between border-t border-slate-100 pt-5">
            <button type="button" onClick={() => void saveMemory()} disabled={saving} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar alterações
            </button>
            {!confirmDelete ? (
              <button type="button" onClick={() => setConfirmDelete(true)} disabled={saving} className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-rose-700 hover:bg-rose-50 text-xs font-bold">
                <Trash2 className="w-4 h-4" /> Apagar toda a memória
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 bg-rose-50 rounded-xl border border-rose-100">
                <span className="text-xs font-bold text-rose-800 px-2">Esta ação é definitiva.</span>
                <button type="button" onClick={() => setConfirmDelete(false)} className="px-3 py-2 text-xs font-bold text-slate-600">Cancelar</button>
                <button type="button" onClick={() => void deleteMemory()} disabled={saving} className="px-3 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold">Confirmar eliminação</button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
