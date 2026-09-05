import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Flame,
  Star,
  Zap,
  ClipboardList,
  Layers,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
  Trophy,
  BarChart3,
  Timer,
  GraduationCap,
} from "lucide-react";
import { auth } from "../../../firebase";

interface GamificationData {
  xp: number;
  level: number;
  streakDays: number;
  totalChaptersRead: number;
  totalEbooksCompleted: number;
  badges: { id: string; name: string; icon: string }[];
}

interface StudentAssignment {
  assignment: {
    id: string;
    ebookId: string;
    ebookTitle: string;
    title: string;
    dueDate: string | null;
  };
  completionPercent: number;
  status: "not_started" | "in_progress" | "completed";
  overdue: boolean;
}

interface EbookStat {
  ebookId: string;
  title: string;
  progress: number;
  lastReadAt: string | null;
}

interface StudentStats {
  studentId?: string;
  totalEnrolled: number;
  totalCompleted: number;
  inProgress: number;
  totalReadingTimeMin?: number;
  averageQuizScore?: number;
  currentCefr?: string;
  recentActivity: EbookStat[];
}

interface Recommendation {
  ebookId: string;
  title: string;
  cefrLevel: string;
  coverColor: string;
  reason: string;
}

async function apiFetch<T>(url: string): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function xpForLevel(level: number): number { return ((level - 1) * (level - 1)) * 50; }
function xpToNextLevel(level: number): number { return (level * level) * 50; }

function XpMiniBar({ xp, level }: { xp: number; level: number }) {
  const current = xp - xpForLevel(level);
  const needed = xpToNextLevel(level) - xpForLevel(level);
  const pct = Math.min(100, Math.round((current / needed) * 100));
  return (
    <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
      <div className="h-full bg-white rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}

const CEFR_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  A2: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  B1: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  B2: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  C1: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  C2: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
};

function StreakDots({ streakDays }: { streakDays: number }) {
  const days = ["S", "T", "Q", "Q", "S", "S", "D"];
  const today = new Date().getDay(); // 0 = Sunday
  const ordered = [...days.slice(today + 1), ...days.slice(0, today + 1)];
  return (
    <div className="flex items-center gap-1 mt-2">
      {ordered.map((d, i) => {
        const daysAgo = 6 - i;
        const active = daysAgo < streakDays;
        return (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                active
                  ? i === 6
                    ? "bg-orange-400 text-white"
                    : "bg-white/40 text-white"
                  : "bg-white/10 text-white/30"
              }`}
            >
              {d}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SectionHeader({ icon, title, action }: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h4 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 text-sm">
        {icon}
        {title}
      </h4>
      {action}
    </div>
  );
}

export function EbookStudentDashboard({
  onNavigate,
  onOpenReader,
}: {
  onNavigate?: (view: string) => void;
  onOpenReader?: (ebookId: string) => void;
}) {
  const [gamification, setGamification] = useState<GamificationData | null>(null);
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    setErrors([]);

    const errs: string[] = [];

    const results = await Promise.allSettled([
      apiFetch<GamificationData>("/api/ebook/gamification/me"),
      apiFetch<{ assignments: StudentAssignment[] }>("/api/ebook/assignments/student/me"),
      apiFetch<{ success: boolean; stats: StudentStats }>("/api/ebook/analytics/me"),
      apiFetch<{ recommendations: Recommendation[] }>("/api/ebook/recommendations?limit=3"),
    ]);

    if (results[0].status === "fulfilled") setGamification(results[0].value);
    else errs.push("Não foi possível carregar dados de gamificação.");

    if (results[1].status === "fulfilled") setAssignments(results[1].value.assignments ?? []);
    else errs.push("Não foi possível carregar tarefas.");

    if (results[2].status === "fulfilled") setStats(results[2].value.stats ?? null);
    else errs.push("Não foi possível carregar estatísticas de leitura.");

    if (results[3].status === "fulfilled") setRecommendations(results[3].value.recommendations ?? []);
    // Recommendations failure is silent

    setErrors(errs);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const activeAssignments = assignments.filter((a) => a.status !== "completed");
  const overdueAssignments = activeAssignments.filter((a) => a.overdue);
  const recentEbooks = stats?.recentActivity
    ?.filter((e) => e.lastReadAt)
    .sort((a, b) => new Date(b.lastReadAt!).getTime() - new Date(a.lastReadAt!).getTime())
    .slice(0, 3) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 dark:text-white text-lg">
          O Meu Painel
        </h3>
        <button
          onClick={load}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((e) => (
            <div key={e} className="flex items-center gap-2 text-amber-600 text-xs bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              {e}
            </div>
          ))}
        </div>
      )}

      {/* ── XP Hero Card ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
      ) : gamification ? (
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider">Nível {gamification.level}</p>
              <p className="text-2xl font-bold">{gamification.xp.toLocaleString("pt-PT")} XP</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <Flame className="w-4 h-4 text-orange-300" />
                  <span className="font-bold text-lg">{gamification.streakDays}</span>
                </div>
                <p className="text-indigo-200 text-[10px]">dias</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-yellow-300" />
                  <span className="font-bold text-lg">{gamification.badges.length}</span>
                </div>
                <p className="text-indigo-200 text-[10px]">medalhas</p>
              </div>
            </div>
          </div>
          <XpMiniBar xp={gamification.xp} level={gamification.level} />
          <div className="flex justify-between text-indigo-200 text-[10px] mt-1">
            <span>Nível {gamification.level}</span>
            <span>Nível {gamification.level + 1}</span>
          </div>

          <div className="flex gap-4 mt-3 pt-3 border-t border-white/20 text-xs text-indigo-200">
            <span>{gamification.totalChaptersRead} cap. lidos</span>
            <span>·</span>
            <span>{gamification.totalEbooksCompleted} concluídos</span>
          </div>
          {gamification.streakDays > 0 && (
            <StreakDots streakDays={gamification.streakDays} />
          )}
        </div>
      ) : null}

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      {!loading && stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 text-center">
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
            <p className="text-xs text-gray-500 mt-0.5">Em curso</p>
          </div>
          {stats.totalReadingTimeMin != null && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <Timer className="w-3.5 h-3.5 text-teal-500" />
                <p className="text-lg font-bold text-teal-600 dark:text-teal-400">
                  {stats.totalReadingTimeMin < 60
                    ? `${stats.totalReadingTimeMin}m`
                    : `${Math.floor(stats.totalReadingTimeMin / 60)}h`}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Leitura total</p>
            </div>
          )}
          {stats.averageQuizScore != null ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {stats.averageQuizScore.toFixed(0)}%
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Quiz médio</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 text-center">
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{stats.totalCompleted}</p>
              <p className="text-xs text-gray-500 mt-0.5">Concluídos</p>
            </div>
          )}
        </div>
      )}

      {/* ── Overdue alert ─────────────────────────────────────────────────── */}
      {overdueAssignments.length > 0 && (
        <div
          className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          onClick={() => onNavigate?.("ebook-assignments-student")}
        >
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              {overdueAssignments.length} tarefa{overdueAssignments.length > 1 ? "s" : ""} em atraso
            </p>
            <p className="text-xs text-red-500">Clique para ver as tarefas</p>
          </div>
          <ChevronRight className="w-4 h-4 text-red-400" />
        </div>
      )}

      {/* ── Active assignments ────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
          {[...Array(2)].map((_, i) => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : activeAssignments.length > 0 ? (
        <div>
          <SectionHeader
            icon={<ClipboardList className="w-4 h-4 text-indigo-400" />}
            title="Tarefas Ativas"
            action={
              <button
                onClick={() => onNavigate?.("ebook-assignments-student")}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
              >
                Ver todas <ChevronRight className="w-3 h-3" />
              </button>
            }
          />
          <div className="space-y-2">
            {activeAssignments.slice(0, 3).map(({ assignment, completionPercent, status, overdue }) => (
              <div
                key={assignment.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{assignment.title}</p>
                  <p className="text-xs text-gray-500 truncate">{assignment.ebookTitle}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {assignment.dueDate && (() => {
                    const diff = Math.ceil((new Date(assignment.dueDate).getTime() - Date.now()) / 86400000);
                    if (diff < 0) return <span className="text-xs text-red-500 font-medium">Atrasado {Math.abs(diff)}d</span>;
                    if (diff === 0) return <span className="text-xs text-orange-500 font-semibold">Hoje!</span>;
                    if (diff === 1) return <span className="text-xs text-amber-500 font-medium">Amanhã</span>;
                    if (diff <= 3) return <span className="text-xs text-amber-500 font-medium">{diff} dias</span>;
                    return <span className="text-xs text-gray-400">{diff}d</span>;
                  })()}
                  {status === "in_progress" ? (
                    <Clock className="w-4 h-4 text-blue-400" />
                  ) : (
                    <span className="text-xs tabular-nums text-gray-400">{completionPercent}%</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── Recent reading ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl" />)}
        </div>
      ) : recentEbooks.length > 0 ? (
        <div>
          <SectionHeader
            icon={<BookOpen className="w-4 h-4 text-teal-400" />}
            title="Leitura Recente"
            action={
              <button
                onClick={() => onNavigate?.("ebook-analytics")}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
              >
                Ver tudo <ChevronRight className="w-3 h-3" />
              </button>
            }
          />
          <div className="space-y-2">
            {recentEbooks.map((e) => (
              <button
                key={e.ebookId}
                onClick={() => onOpenReader ? onOpenReader(e.ebookId) : onNavigate?.("ebook-curation")}
                className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center gap-3 text-left hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{e.title}</p>
                  {e.lastReadAt && (
                    <p className="text-xs text-gray-400">
                      {new Date(e.lastReadAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${e.progress >= 100 ? "bg-green-500" : "bg-indigo-500"}`}
                      style={{ width: `${Math.min(100, e.progress)}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-gray-400 w-8 text-right">{e.progress}%</span>
                  {e.progress >= 100 && <CheckCircle className="w-4 h-4 text-green-400" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── Empty-state onboarding ───────────────────────────────────────── */}
      {!loading && stats?.totalEnrolled === 0 && recentEbooks.length === 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-5 text-center">
          <BookOpen className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
          <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-1">Comece a sua jornada</h4>
          <p className="text-sm text-indigo-600 dark:text-indigo-300 mb-4">
            Ainda não está inscrito em nenhum e-book. Explore o catálogo e escolha o seu primeiro livro.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => onNavigate?.("ebook-curation")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Ver catálogo
            </button>
            <button
              onClick={() => onNavigate?.("ebook-recommendations")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-800/40 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Recomendações IA
            </button>
          </div>
        </div>
      )}

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <div>
        <SectionHeader
          icon={<Zap className="w-4 h-4 text-yellow-400" />}
          title="Atalhos Rápidos"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Flashcards", icon: <Layers className="w-5 h-5" />, view: "ebook-flashcards", color: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300" },
            { label: "Conquistas", icon: <Trophy className="w-5 h-5" />, view: "ebook-achievements", color: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300" },
            { label: "Biblioteca", icon: <BookOpen className="w-5 h-5" />, view: "ebook-curation", color: "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300" },
            { label: "Tarefas", icon: <ClipboardList className="w-5 h-5" />, view: "ebook-assignments-student", color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300" },
            { label: "Recomendações", icon: <Sparkles className="w-5 h-5" />, view: "ebook-recommendations", color: "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300" },
            { label: "Progresso", icon: <BarChart3 className="w-5 h-5" />, view: "ebook-analytics", color: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" },
          ].map(({ label, icon, view, color }) => (
            <button
              key={view}
              onClick={() => onNavigate?.(view)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${color} hover:opacity-80 transition-opacity text-sm font-medium`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Recommendations ───────────────────────────────────────────────── */}
      {recommendations.length > 0 && (
        <div>
          <SectionHeader
            icon={<Sparkles className="w-4 h-4 text-indigo-400" />}
            title="Recomendados para Si"
            action={
              <button
                onClick={() => onNavigate?.("ebook-recommendations")}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
              >
                Ver mais <ChevronRight className="w-3 h-3" />
              </button>
            }
          />
          <div className="space-y-2">
            {recommendations.map((r) => (
              <div key={r.ebookId} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: r.coverColor }}
                >
                  <BookOpen className="w-4 h-4 text-white/80" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{r.title}</p>
                  <p className="text-xs text-indigo-500 dark:text-indigo-400 italic truncate">{r.reason}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${CEFR_COLORS[r.cefrLevel] ?? "bg-gray-100 text-gray-600"}`}>
                  {r.cefrLevel}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
