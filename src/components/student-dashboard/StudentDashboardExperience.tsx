import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Flame,
  Home,
  Library,
  Menu,
  MessageCircle,
  Mic2,
  Play,
  Route,
  Settings,
  Sparkles,
  Trophy,
  UserRound,
  Video,
  X,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import type { Achievement, Language, Proficiency, SavedWord, StreakData } from "../../types";

export interface StudentDashboardExperienceProps {
  studentName: string;
  selectedLanguage: Language;
  selectedProficiency: Proficiency;
  streakData: StreakData;
  savedWords: SavedWord[];
  achievements: Achievement[];
  userProfile?: Record<string, unknown>;
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

const proficiencyLabel: Record<Proficiency, string> = {
  Beginner: "A1",
  Intermediate: "B2",
  Advanced: "C1",
};

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function getRecentPractice(history: string[]) {
  const today = startOfDay(new Date());
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const active = history.some((entry) => startOfDay(new Date(entry)).getTime() === date.getTime());
    return { label: new Intl.DateTimeFormat("pt-PT", { weekday: "short" }).format(date).replace(".", ""), active };
  });
}

function getLearningGaps(profile?: Record<string, unknown>) {
  const raw = profile?.learningGaps ?? profile?.learning_gaps ?? profile?.weaknesses;
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 2).map((gap, index) => {
    if (typeof gap === "string") return { id: `${index}-${gap}`, label: gap };
    if (gap && typeof gap === "object") {
      const item = gap as Record<string, unknown>;
      const label = item.grammar_or_vocab_item ?? item.target_item ?? item.item ?? item.label;
      if (typeof label === "string") return { id: `${index}-${label}`, label };
    }
    return null;
  }).filter((gap): gap is { id: string; label: string } => Boolean(gap));
}

function Panel({ title, action, children, className = "" }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-ui-lg border border-ui-border bg-ui-surface p-5 shadow-ui-sm ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold text-ui-text">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 place-items-center rounded-ui-lg bg-brand-primary text-white shadow-ui-md" aria-hidden="true">
        <MessageCircle className="size-6 fill-current" />
      </div>
      <span className="font-heading text-xl font-extrabold tracking-tight text-brand-primary">LingoLIVE</span>
    </div>
  );
}

export function StudentDashboardExperience({
  studentName,
  selectedLanguage,
  selectedProficiency,
  streakData,
  savedWords,
  achievements,
  userProfile,
  onStartPractice,
  onNavigate,
}: StudentDashboardExperienceProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const days = useMemo(() => getRecentPractice(streakData.history ?? []), [streakData.history]);
  const activeDays = days.filter((day) => day.active).length;
  const firstName = studentName.trim().split(/\s+/)[0] || "Estudante";
  const level = proficiencyLabel[selectedProficiency] ?? selectedProficiency;
  const learningGaps = getLearningGaps(userProfile);
  const recentAchievements = achievements.slice(0, 3);
  const profileClass = userProfile?.nextClass as Record<string, unknown> | undefined;
  const nextClassTitle = typeof profileClass?.title === "string" ? profileClass.title : undefined;
  const nextClassTime = typeof profileClass?.time === "string" ? profileClass.time : undefined;
  const completedPercent = Math.min(100, Math.max(0, Math.round(((streakData.history?.length ?? 0) / 40) * 100)));

  const navigate = (view: string) => {
    setMobileNavOpen(false);
    if (view === "practice") onStartPractice();
    else onNavigate?.(view);
  };

  const sidebar = (
    <aside className="flex h-full w-64 flex-col border-r border-ui-border bg-white px-4 py-5">
      <div className="flex items-center justify-between px-2">
        <BrandMark />
        <button className="grid size-10 place-items-center rounded-ui-md text-ui-text-muted hover:bg-ui-surface-muted lg:hidden" onClick={() => setMobileNavOpen(false)} aria-label="Fechar navegação">
          <X className="size-5" />
        </button>
      </div>
      <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Navegação do aluno">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.view} onClick={() => navigate(item.view)} aria-current={item.view === "dashboard" ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-ui-md px-3 text-left text-sm font-semibold transition-colors ${item.view === "dashboard" ? "bg-brand-primary/10 text-brand-primary" : "text-ui-text-muted hover:bg-ui-surface-muted hover:text-ui-text"}`}>
              <Icon className="size-5 shrink-0" strokeWidth={2} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <button onClick={() => navigate("settings")} className="flex min-h-11 items-center gap-3 rounded-ui-md px-3 text-sm font-semibold text-ui-text-muted hover:bg-ui-surface-muted hover:text-ui-text">
        <Settings className="size-5" /> Configurações
      </button>
    </aside>
  );

  const shortcuts = [
    { title: "Próxima atividade", detail: `${selectedLanguage.name} ${level} · Conversação`, action: "Ver detalhes", icon: MessageCircle, tone: "border-violet-200 bg-violet-50 text-violet-700", view: "learning-path" },
    { title: "Aula ao vivo", detail: nextClassTitle ? `${nextClassTitle}${nextClassTime ? ` · ${nextClassTime}` : ""}` : "Consulte a próxima sessão", action: nextClassTitle ? "Entrar na aula" : "Ver agenda", icon: CalendarDays, tone: "border-sky-200 bg-sky-50 text-sky-700", view: nextClassTitle ? "live-classes" : "live-calendar" },
    { title: "Praticar agora", detail: "Exercícios e atividades", action: "Começar a praticar", icon: Mic2, tone: "border-emerald-200 bg-emerald-50 text-emerald-700", view: "practice" },
    { title: "Meu progresso", detail: `${savedWords.length} palavras guardadas`, action: "Ver progresso", icon: BarChart3, tone: "border-amber-200 bg-amber-50 text-amber-700", view: "analytics" },
  ];

  return (
    <div className="min-h-screen bg-ui-bg text-ui-text" id="student-dashboard-v2">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex">{sidebar}</div>
      {mobileNavOpen && <div className="fixed inset-0 z-ui-drawer lg:hidden"><button aria-label="Fechar navegação" className="absolute inset-0 bg-ui-overlay" onClick={() => setMobileNavOpen(false)} /><div className="relative h-full w-64">{sidebar}</div></div>}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ui-border bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button onClick={() => setMobileNavOpen(true)} className="grid size-10 place-items-center rounded-ui-md text-ui-text-muted hover:bg-ui-surface-muted lg:hidden" aria-label="Abrir navegação"><Menu className="size-6" /></button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <button className="relative grid size-10 place-items-center rounded-full text-ui-text-muted hover:bg-ui-surface-muted" aria-label="Notificações"><Bell className="size-5" /><span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand-primary" /></button>
            <button onClick={() => navigate("profile")} className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-ui-surface-muted" aria-label="Abrir perfil">
              <span className="grid size-9 place-items-center rounded-full bg-brand-primary/10 text-brand-primary"><UserRound className="size-5" /></span>
              <span className="rounded-full bg-brand-primary px-2 py-0.5 text-xs font-bold text-white">{level}</span>
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <section className="relative isolate min-h-64 overflow-hidden rounded-ui-xl bg-gradient-to-br from-violet-700 via-brand-primary to-indigo-500 px-6 py-8 text-white shadow-ui-lg sm:px-10 lg:flex lg:items-center">
            <div className="relative z-10 max-w-xl">
              <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Bom dia, {firstName}!</h1>
              <p className="mt-3 text-base font-medium text-violet-100 sm:text-lg">Pronta para continuar a sua jornada?</p>
              <button type="button" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-ui-md border border-white bg-white px-5 text-base font-semibold shadow-ui-sm transition-colors hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary" onClick={onStartPractice}>
                <Play className="size-5 fill-current" style={{ color: "#7c3aed" }} aria-hidden="true" />
                <span style={{ color: "#7c3aed" }}>Continuar aprendendo</span>
              </button>
            </div>
            <img src="/assets/dashboard/learning-hero.png" alt="Globo, livros e balões de conversa para aprendizagem de idiomas" className="pointer-events-none absolute -bottom-16 -right-12 hidden h-[330px] w-[520px] object-cover object-center opacity-90 mix-blend-screen [mask-image:linear-gradient(to_right,transparent_0%,black_28%)] md:block" />
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Atalhos de aprendizagem">
            {shortcuts.map(({ title, detail, action, icon: Icon, tone, view }) => (
              <button key={title} onClick={() => navigate(view)} className={`group flex min-h-40 flex-col rounded-ui-lg border p-5 text-left shadow-ui-sm transition duration-ui-normal hover:-translate-y-0.5 hover:shadow-ui-md ${tone}`}>
                <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/80"><Icon className="size-6" /></span><div><h2 className="font-heading text-base font-bold">{title}</h2><p className="mt-1 text-sm text-ui-text-muted">{detail}</p></div></div>
                <span className="mt-auto flex items-center justify-between border-t border-current/15 pt-3 text-sm font-bold">{action}<ChevronRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
              </button>
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.1fr_1fr_1fr]">
            <Panel title="Progresso semanal">
              <div className="flex items-end justify-between gap-4"><div><strong className="text-3xl font-extrabold text-emerald-600">{activeDays} de 5 dias</strong><p className="mt-1 text-sm text-ui-text-muted">{activeDays >= 4 ? "Muito bem! Continue assim." : "Cada sessão conta para a sua meta."}</p></div><span className="rounded-ui-md bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">Meta semanal: 5 dias</span></div>
              <div className="mt-5 grid grid-cols-7 gap-2">{days.map((day, index) => <div key={`${day.label}-${index}`} className="text-center"><span className="text-xs font-semibold capitalize text-ui-text-muted">{day.label}</span><span className={`mx-auto mt-2 grid size-8 place-items-center rounded-full border text-sm font-bold ${day.active ? "border-emerald-500 bg-emerald-500 text-white" : "border-ui-border bg-ui-surface-muted text-ui-text-muted"}`}>{day.active ? "✓" : ""}</span></div>)}</div>
              <div className="mt-6"><div className="mb-2 flex justify-between text-xs font-semibold"><span>{completedPercent}% concluído</span><span>{streakData.count} dias de sequência</span></div><div className="h-2 overflow-hidden rounded-full bg-ui-surface-muted"><div className="h-full rounded-full bg-brand-primary transition-all" style={{ width: `${completedPercent}%` }} /></div></div>
            </Panel>

            <Panel title="Pontos para reforçar" action={<Sparkles className="size-5 text-brand-primary" />}>
              {learningGaps.length ? <div className="space-y-3">{learningGaps.map((gap) => <button key={gap.id} onClick={() => navigate("adaptive-learning")} className="flex w-full items-center gap-3 rounded-ui-md border border-ui-border p-3 text-left hover:border-brand-primary/50 hover:bg-violet-50"><span className="grid size-9 place-items-center rounded-full bg-violet-100 text-violet-700"><BookOpen className="size-5" /></span><span className="flex-1 text-sm font-semibold">{gap.label}</span><ChevronRight className="size-4 text-ui-text-muted" /></button>)}</div> : <div className="rounded-ui-md border border-dashed border-ui-border p-5 text-center"><Sparkles className="mx-auto size-7 text-brand-primary" /><p className="mt-2 text-sm font-semibold">Nenhum ponto prioritário</p><p className="mt-1 text-xs text-ui-text-muted">Pratique para receber recomendações personalizadas.</p></div>}
              <button onClick={() => navigate("adaptive-learning")} className="mt-4 flex items-center gap-1 text-sm font-bold text-brand-primary hover:underline">Ver plano adaptativo <ChevronRight className="size-4" /></button>
            </Panel>

            <Panel title="Conquistas recentes" action={<Trophy className="size-5 text-amber-500" />}>
              {recentAchievements.length ? <div className="space-y-4">{recentAchievements.map((achievement, index) => <div key={achievement.id} className="flex items-start gap-3"><span className={`grid size-10 shrink-0 place-items-center rounded-ui-md text-white ${index === 0 ? "bg-emerald-500" : index === 1 ? "bg-brand-primary" : "bg-sky-500"}`}>{index === 0 ? <Flame className="size-5" /> : <Trophy className="size-5" />}</span><div><p className="text-sm font-bold">{achievement.title}</p><p className="mt-0.5 text-xs text-ui-text-muted">{achievement.description}</p></div></div>)}</div> : <div className="rounded-ui-md border border-dashed border-ui-border p-5 text-center"><Trophy className="mx-auto size-7 text-amber-500" /><p className="mt-2 text-sm font-semibold">A primeira conquista está próxima</p><p className="mt-1 text-xs text-ui-text-muted">Complete uma atividade para começar.</p></div>}
              <button onClick={() => navigate("ebook-achievements")} className="mt-4 flex items-center gap-1 text-sm font-bold text-brand-primary hover:underline">Ver todas as conquistas <ChevronRight className="size-4" /></button>
            </Panel>
          </section>
        </main>
      </div>
    </div>
  );
}
