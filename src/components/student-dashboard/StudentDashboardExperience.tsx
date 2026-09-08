import {
  Bell, BookOpen, CalendarDays, ChevronRight, Clock3, Flame, Home, Library,
  Menu, MessageCircle, Mic2, Play, Route, Settings, Sparkles, Target,
  TrendingUp, Trophy, UserRound, Video, X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Alert, EmptyState, ErrorState, Skeleton } from "../../../packages/ui";
import type { Achievement, Language, Proficiency, SavedWord, StreakData } from "../../types";
import { buildStudentDashboardModel, resolveDashboardDataState, type DashboardDataState } from "./studentDashboard.model";

export interface StudentDashboardExperienceProps {
  studentName: string;
  studentPhotoUrl?: string | null;
  selectedLanguage: Language;
  selectedProficiency: Proficiency;
  streakData: StreakData;
  savedWords: SavedWord[];
  achievements: Achievement[];
  userProfile?: Record<string, unknown>;
  dataState?: DashboardDataState;
  onRetry?: () => void;
  onStartPractice: () => void;
  onNavigate?: (view: string) => void;
}

type NavigationItem = { label: string; view: string; icon: typeof Home };
const navigation: NavigationItem[] = [
  { label: "Início", view: "dashboard", icon: Home },
  { label: "Minha jornada", view: "learning-path", icon: Route },
  { label: "Aulas ao vivo", view: "live-classes", icon: Video },
  { label: "Praticar", view: "practice", icon: Mic2 },
  { label: "Biblioteca", view: "biblioteca", icon: Library },
  { label: "Conquistas", view: "ebook-achievements", icon: Trophy },
];
const proficiencyLabel: Record<Proficiency, string> = { Beginner: "A1", Intermediate: "B2", Advanced: "C1" };

function startOfDay(value: Date) { return new Date(value.getFullYear(), value.getMonth(), value.getDate()); }
function getRecentPractice(history: string[]) {
  const today = startOfDay(new Date());
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today); date.setDate(today.getDate() - (6 - index));
    const active = history.some((entry) => startOfDay(new Date(entry)).getTime() === date.getTime());
    return { label: new Intl.DateTimeFormat("pt-PT", { weekday: "short" }).format(date).replace(".", ""), active };
  });
}
function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "short" }).format(date);
}
function Panel({ title, icon, children, className = "" }: { title: string; icon?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`rounded-ui-lg border border-ui-border bg-ui-surface p-5 shadow-ui-sm ${className}`}><div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-heading text-lg font-bold text-ui-text">{title}</h2>{icon}</div>{children}</section>;
}
function CompactEmpty({ children }: { children: ReactNode }) {
  return <div className="rounded-ui-md border border-dashed border-ui-border p-5 text-center text-sm text-ui-text-muted">{children}</div>;
}
function BrandMark() {
  return <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-ui-lg bg-brand-primary text-white shadow-ui-md" aria-hidden="true"><MessageCircle className="size-6 fill-current" /></div><span className="font-heading text-xl font-extrabold tracking-tight text-brand-primary">LingoLIVE</span></div>;
}

export function StudentDashboardExperience(props: StudentDashboardExperienceProps) {
  const { studentName, studentPhotoUrl, selectedLanguage, selectedProficiency, streakData, savedWords, achievements, userProfile, dataState, onRetry, onStartPractice, onNavigate } = props;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const model = useMemo(() => buildStudentDashboardModel({ studentName, selectedLanguage, selectedProficiency, streakData, savedWords, achievements, profile: userProfile }), [studentName, selectedLanguage, selectedProficiency, streakData, savedWords, achievements, userProfile]);
  const resolvedDataState = resolveDashboardDataState(dataState, userProfile, model);
  const days = useMemo(() => getRecentPractice(streakData.history ?? []), [streakData.history]);
  const activeDays = days.filter((day) => day.active).length;
  const firstName = model.displayName.trim().split(/\s+/)[0] || "Estudante";
  const level = model.cefrLevel || proficiencyLabel[selectedProficiency] || selectedProficiency;
  const dailyPercent = model.dailyGoalMinutes ? Math.min(100, Math.round(((model.dailyProgressMinutes ?? 0) / model.dailyGoalMinutes) * 100)) : 0;
  const navigate = (view: string) => { setMobileNavOpen(false); view === "practice" ? onStartPractice() : onNavigate?.(view); };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const sidebar = <aside className="flex h-full w-64 flex-col border-r border-ui-border bg-white px-4 py-5"><div className="flex items-center justify-between px-2"><BrandMark /><button className="grid size-10 place-items-center rounded-ui-md text-ui-text-muted hover:bg-ui-surface-muted lg:hidden" onClick={() => setMobileNavOpen(false)} aria-label="Fechar navegação"><X className="size-5" /></button></div><nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Navegação do aluno">{navigation.map((item) => { const Icon = item.icon; return <button key={item.view} onClick={() => navigate(item.view)} aria-current={item.view === "dashboard" ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-ui-md px-3 text-left text-sm font-semibold transition-colors ${item.view === "dashboard" ? "bg-brand-primary/10 text-brand-primary" : "text-ui-text-muted hover:bg-ui-surface-muted hover:text-ui-text"}`}><Icon className="size-5 shrink-0" />{item.label}</button>; })}</nav><button onClick={() => navigate("settings")} className="flex min-h-11 items-center gap-3 rounded-ui-md px-3 text-sm font-semibold text-ui-text-muted hover:bg-ui-surface-muted"><Settings className="size-5" /> Configurações</button></aside>;

  const stateContent = resolvedDataState === "loading" ? <div role="status" aria-label="A carregar dashboard" className="space-y-5"><Skeleton lines={3} className="min-h-56 rounded-ui-xl bg-ui-surface p-8" /><div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((item) => <div key={item}><Skeleton lines={4} className="min-h-48 rounded-ui-lg bg-ui-surface p-5" /></div>)}</div></div>
    : resolvedDataState === "empty" ? <EmptyState title="Complete o seu Perfil Inteligente" description="Precisamos do idioma, nível e objetivo diário para preparar um painel realmente personalizado." actionLabel="Completar perfil" onAction={() => navigate("perfil-aprendizagem")} />
    : resolvedDataState === "unavailable" ? <ErrorState title="Dashboard temporariamente indisponível" description="Não foi possível carregar os seus dados agora. Tente novamente dentro de instantes." actionLabel={onRetry ? "Tentar novamente" : undefined} onAction={onRetry} />
    : null;

  return <div className="min-h-screen bg-ui-bg text-ui-text" id="student-dashboard-v2">
    <a href="#student-dashboard-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-ui-modal focus:rounded-ui-md focus:bg-white focus:px-4 focus:py-3 focus:text-brand-primary">Saltar para o conteúdo</a>
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex">{sidebar}</div>
    {mobileNavOpen && <div className="fixed inset-0 z-ui-drawer lg:hidden"><button aria-label="Fechar navegação" className="absolute inset-0 bg-ui-overlay" onClick={() => setMobileNavOpen(false)} /><div className="relative h-full w-64">{sidebar}</div></div>}
    <div className="lg:pl-64"><header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ui-border bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8"><button onClick={() => setMobileNavOpen(true)} className="grid size-10 place-items-center rounded-ui-md text-ui-text-muted hover:bg-ui-surface-muted lg:hidden" aria-label="Abrir navegação"><Menu className="size-6" /></button><div className="hidden lg:block" /><div className="flex items-center gap-3"><button className="relative grid size-10 place-items-center rounded-full text-ui-text-muted hover:bg-ui-surface-muted" aria-label="Notificações"><Bell className="size-5" /><span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand-primary" /></button><button onClick={() => navigate("profile")} className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-ui-surface-muted" aria-label="Abrir perfil"><span className="grid size-9 place-items-center overflow-hidden rounded-full bg-brand-primary/10 text-brand-primary">{studentPhotoUrl ? <img src={studentPhotoUrl} alt="" className="size-full object-cover" /> : <UserRound className="size-5" />}</span><span className="rounded-full bg-brand-primary px-2 py-0.5 text-xs font-bold text-white">{level}</span></button></div></header>
      <main id="student-dashboard-content" tabIndex={-1} className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        {!isOnline && <Alert variant="warning" title="Sem ligação à internet">Pode consultar os dados já carregados. A sincronização será retomada automaticamente quando a ligação voltar.</Alert>}
        {stateContent ?? <>
          {resolvedDataState === "partial" && <Alert variant="warning" title="Alguns dados não foram carregados">O painel continua disponível. Complete no Perfil Inteligente: {model.missingCoreFields.join(", ")}.</Alert>}
          <section data-dashboard-section="continue-learning" className="relative isolate min-h-64 overflow-hidden rounded-ui-xl bg-gradient-to-br from-violet-700 via-brand-primary to-indigo-500 px-6 py-8 text-white shadow-ui-lg sm:px-10 lg:flex lg:items-center"><div className="relative z-10 max-w-2xl"><div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5"><button type="button" onClick={() => navigate("profile")} className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white/90 bg-white/15 shadow-ui-lg sm:size-24" aria-label={`Abrir perfil de ${firstName}`}>{studentPhotoUrl ? <img src={studentPhotoUrl} alt={`Fotografia de ${firstName}`} className="size-full object-cover" /> : <UserRound className="size-11" />}</button><div className="min-w-0"><p className="text-sm font-bold uppercase tracking-wider text-violet-100">Continuar aprendizagem</p><h1 className="mt-1 break-words font-heading text-2xl font-extrabold sm:text-4xl">Bom dia, {firstName}!</h1><p className="mt-2 text-sm font-medium text-violet-100 sm:text-base">{model.targetLanguage} · nível {level}{model.learningGoal ? ` · ${model.learningGoal}` : ""}</p></div></div><button type="button" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-ui-md bg-white px-5 font-semibold text-brand-primary shadow-ui-sm hover:bg-violet-50" onClick={onStartPractice}><Play className="size-5 shrink-0 fill-current" /> Continuar aprendendo</button></div><img src="/assets/dashboard/learning-hero.png" alt="" className="pointer-events-none absolute -bottom-16 -right-12 hidden h-[330px] w-[520px] object-cover opacity-90 mix-blend-screen [mask-image:linear-gradient(to_right,transparent_0%,black_28%)] md:block" /></section>

          <div className="grid gap-5 md:grid-cols-3">
            <Panel title="Objetivo diário" icon={<Target className="size-5 text-brand-primary" />} className="border-violet-200"><div data-dashboard-section="daily-goal"><strong className="text-3xl font-extrabold text-brand-primary">{model.dailyGoalMinutes ? `${model.dailyGoalMinutes} min` : "Por definir"}</strong><p className="mt-1 text-sm text-ui-text-muted">{model.dailyProgressMinutes === undefined ? "Meta criada no Perfil Inteligente" : `${model.dailyProgressMinutes} minutos concluídos hoje`}</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-ui-surface-muted"><div className="h-full rounded-full bg-brand-primary" style={{ width: `${dailyPercent}%` }} /></div></div></Panel>
            <Panel title="Sequência de estudo" icon={<Flame className="size-5 text-orange-500" />}><div data-dashboard-section="study-streak"><strong className="text-3xl font-extrabold text-orange-500">{streakData.count} dias</strong><p className="mt-1 text-sm text-ui-text-muted">{activeDays} sessões nos últimos 7 dias</p><div className="mt-5 grid grid-cols-7 gap-1">{days.map((day, index) => <div key={`${day.label}-${index}`} className="text-center"><span className="text-[10px] font-semibold capitalize text-ui-text-muted">{day.label}</span><span className={`mx-auto mt-1 grid size-7 place-items-center rounded-full text-xs font-bold ${day.active ? "bg-emerald-500 text-white" : "bg-ui-surface-muted text-ui-text-muted"}`}>{day.active ? "✓" : ""}</span></div>)}</div></div></Panel>
            <Panel title="Próxima aula" icon={<CalendarDays className="size-5 text-sky-600" />}><div data-dashboard-section="next-class">{model.nextClass ? <><strong className="text-lg font-bold">{model.nextClass.title}</strong><p className="mt-2 flex items-center gap-2 text-sm text-ui-text-muted"><Clock3 className="size-4" />{model.nextClass.time ?? "Horário a confirmar"}</p><button onClick={() => navigate("live-classes")} className="mt-5 flex items-center gap-1 text-sm font-bold text-sky-700">Ver aula <ChevronRight className="size-4" /></button></> : <CompactEmpty>Nenhuma aula agendada.<button onClick={() => navigate("live-calendar")} className="mt-3 block w-full font-bold text-brand-primary">Ver agenda</button></CompactEmpty>}</div></Panel>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Panel title="Recomendações adaptativas" icon={<Sparkles className="size-5 text-brand-primary" />}><div data-dashboard-section="adaptive-recommendations">{model.recommendations.length ? <div className="space-y-3">{model.recommendations.map((item) => <button key={item.id} onClick={() => navigate("adaptive-learning")} className="flex w-full items-center gap-3 rounded-ui-md border border-ui-border p-3 text-left hover:bg-violet-50"><span className="grid size-9 place-items-center rounded-full bg-violet-100 text-violet-700"><BookOpen className="size-5" /></span><span className="flex-1 text-sm font-semibold capitalize">{item.label}</span><ChevronRight className="size-4" /></button>)}</div> : <CompactEmpty>Pratique para receber recomendações personalizadas.</CompactEmpty>}</div></Panel>
            <Panel title="Progresso recente" icon={<TrendingUp className="size-5 text-emerald-600" />}><div data-dashboard-section="recent-progress">{model.recentPractice.length ? <div className="space-y-3">{model.recentPractice.map((item) => <div key={item.id} className="flex items-center justify-between rounded-ui-md bg-emerald-50 p-3"><span className="text-sm font-semibold">Sessão de aprendizagem</span><time className="text-sm text-ui-text-muted">{formatDate(item.date)}</time></div>)}</div> : <CompactEmpty>Ainda não existem sessões recentes.</CompactEmpty>}</div></Panel>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Panel title="Vocabulário para revisão" icon={<BookOpen className="size-5 text-sky-600" />}><div data-dashboard-section="vocabulary-review">{model.vocabulary.length ? <div className="grid gap-3 sm:grid-cols-2">{model.vocabulary.map((word) => <button key={word.id} onClick={() => navigate("biblioteca")} className="rounded-ui-md border border-ui-border p-3 text-left hover:border-sky-300 hover:bg-sky-50"><strong>{word.word}</strong><p className="mt-1 line-clamp-2 text-sm text-ui-text-muted">{word.meaning}</p></button>)}</div> : <CompactEmpty>Guarde palavras durante a prática para revê-las aqui.</CompactEmpty>}</div></Panel>
            <Panel title="Conquistas" icon={<Trophy className="size-5 text-amber-500" />}><div data-dashboard-section="achievements">{model.achievements.length ? <div className="space-y-3">{model.achievements.map((achievement, index) => <div key={achievement.id} className="flex items-start gap-3"><span className={`grid size-10 shrink-0 place-items-center rounded-ui-md text-white ${index === 0 ? "bg-amber-500" : "bg-brand-primary"}`}><Trophy className="size-5" /></span><div><p className="text-sm font-bold">{achievement.title}</p><p className="text-xs text-ui-text-muted">{achievement.description}</p></div></div>)}</div> : <CompactEmpty>A sua primeira conquista está próxima.</CompactEmpty>}<button onClick={() => navigate("ebook-achievements")} className="mt-4 flex items-center gap-1 text-sm font-bold text-brand-primary">Ver todas <ChevronRight className="size-4" /></button></div></Panel>
          </div>
        </>}
      </main>
    </div>
  </div>;
}
