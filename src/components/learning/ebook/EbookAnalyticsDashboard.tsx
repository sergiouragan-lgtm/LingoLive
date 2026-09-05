import React, { useEffect, useState, useCallback } from "react";
import {
  BarChart2,
  TrendingUp,
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  Star,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { auth } from "../../../firebase";
import { useUserRole } from "../../../context/UserRoleContext";

const STUDENT_ROLES = new Set(["Student", "STUDENT", "LEARNER", "BUSINESS_USER"]);
function isStudentRole(role: string) {
  return STUDENT_ROLES.has(role);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface OverviewStats {
  totalEbooks: number;
  totalEnrollments: number;
  totalCompletions: number;
  averageCompletionRate: number;
  topEbooks: { ebookId: string; title: string; enrollments: number; completionRate: number }[];
}

interface EbookDetailStats {
  ebookId: string;
  title: string;
  totalEnrollments: number;
  completions: number;
  completionRate: number;
  averageProgress: number;
  chapterDropoff: { chapterId: string; order: number; dropoffRate: number }[];
  quizAverageScore: number;
  cefrBreakdown: Record<string, number>;
}

interface StudentStats {
  studentId: string;
  totalEnrolled: number;
  totalCompleted: number;
  inProgress: number;
  totalReadingTimeMin: number;
  averageQuizScore: number;
  currentCefr: string;
  recentActivity: { ebookId: string; title: string; progress: number; lastReadAt: string }[];
}

// ─── API helpers ─────────────────────────────────────────────────────────────

async function apiFetch(path: string) {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(`/api/ebook/analytics${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color = "bg-indigo-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function EbookRow({
  stat,
  onSelect,
}: {
  stat: OverviewStats["topEbooks"][0];
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(stat.ebookId)}
      className="w-full text-left flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
    >
      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
        <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{stat.title}</p>
        <div className="mt-1">
          <ProgressBar value={stat.completionRate} max={100} />
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{stat.enrollments}</p>
        <p className="text-xs text-gray-400">{stat.completionRate.toFixed(0)}% concl.</p>
      </div>
    </button>
  );
}

function ChapterDropoffChart({
  chapters,
}: {
  chapters: EbookDetailStats["chapterDropoff"];
}) {
  if (!chapters.length) return null;
  const maxDrop = Math.max(...chapters.map((c) => c.dropoffRate));

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">Abandono por Capítulo</h4>
      <div className="space-y-2">
        {chapters.map((ch, i) => (
          <div key={ch.chapterId} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-6 flex-shrink-0">{ch.order}</span>
            <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
              <div
                className="h-full rounded transition-all duration-500"
                style={{
                  width: `${(ch.dropoffRate / 100) * 100}%`,
                  backgroundColor: ch.dropoffRate > 50 ? "#ef4444" : ch.dropoffRate > 25 ? "#f97316" : "#22c55e",
                }}
              />
            </div>
            <span className="text-xs font-medium w-10 text-right text-gray-600 dark:text-gray-300">
              {ch.dropoffRate.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CefrPills({ breakdown }: { breakdown: Record<string, number> }) {
  const CEFR_COLORS: Record<string, string> = {
    A1: "bg-green-100 text-green-700",
    A2: "bg-teal-100 text-teal-700",
    B1: "bg-blue-100 text-blue-700",
    B2: "bg-indigo-100 text-indigo-700",
    C1: "bg-purple-100 text-purple-700",
    C2: "bg-pink-100 text-pink-700",
    unknown: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {Object.entries(breakdown).map(([level, count]) => (
        <span key={level} className={`text-xs px-2.5 py-1 rounded-full font-medium ${CEFR_COLORS[level] ?? "bg-gray-100 text-gray-600"}`}>
          {level} · {count}
        </span>
      ))}
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function EbookDetailPanel({
  ebookId,
  onClose,
}: {
  ebookId: string;
  onClose: () => void;
}) {
  const [stats, setStats] = useState<EbookDetailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiFetch(`/ebook/${ebookId}`)
      .then((d) => setStats(d.stats))
      .catch(() => setError("Erro ao carregar detalhes"))
      .finally(() => setLoading(false));
  }, [ebookId]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 dark:text-white">
          {stats?.title ?? "Carregando..."}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm">
          Fechar
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" />
          A carregar estatísticas...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {stats && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Inscritos", value: stats.totalEnrollments },
              { label: "Concluídos", value: stats.completions },
              { label: "Taxa de conclusão", value: `${stats.completionRate.toFixed(1)}%` },
              { label: "Média de progresso", value: `${stats.averageProgress.toFixed(1)}%` },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{item.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Distribuição CEFR</p>
            <CefrPills breakdown={stats.cefrBreakdown} />
          </div>

          {stats.quizAverageScore > 0 && (
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Pontuação média nos quizzes: <strong>{stats.quizAverageScore.toFixed(1)}%</strong>
              </span>
            </div>
          )}

          <ChapterDropoffChart chapters={stats.chapterDropoff} />
        </div>
      )}
    </div>
  );
}

// ─── My Stats Panel ───────────────────────────────────────────────────────────

function MyStatsPanel() {
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/me")
      .then((d) => setStats(d.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center gap-2 text-gray-400 text-sm p-4">
      <RefreshCw className="w-4 h-4 animate-spin" />
      A carregar as suas estatísticas...
    </div>
  );

  if (!stats) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-indigo-500" />
        O Meu Progresso
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Inscritos", value: stats.totalEnrolled, icon: BookOpen, color: "text-blue-500" },
          { label: "Concluídos", value: stats.totalCompleted, icon: CheckCircle, color: "text-green-500" },
          { label: "Em progresso", value: stats.inProgress, icon: TrendingUp, color: "text-orange-500" },
          { label: "Minutos lidos", value: stats.totalReadingTimeMin, icon: Clock, color: "text-purple-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
            <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
            <p className="text-lg font-bold text-gray-800 dark:text-white">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-600 dark:text-gray-300">Nível CEFR atual:</span>
        <span className="px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-bold rounded-full">
          {stats.currentCefr}
        </span>
        {stats.averageQuizScore > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
            · Média quiz: <strong>{stats.averageQuizScore.toFixed(0)}%</strong>
          </span>
        )}
      </div>

      {stats.recentActivity.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">Actividade Recente</h4>
          <div className="space-y-3">
            {stats.recentActivity.slice(0, 5).map((item) => (
              <div key={item.ebookId} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-200 truncate">{item.title}</p>
                  <ProgressBar
                    value={item.progress}
                    max={100}
                    color={item.progress >= 100 ? "bg-green-500" : "bg-indigo-500"}
                  />
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{item.progress.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function EbookAnalyticsDashboard() {
  const { role } = useUserRole();
  const canViewOverview = !isStudentRole(role);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [selectedEbookId, setSelectedEbookId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "mine">("mine");

  const fetchOverview = useCallback(() => {
    setLoadingOverview(true);
    setOverviewError(null);
    apiFetch("/overview")
      .then((d) => setOverview(d.stats))
      .catch(() => setOverviewError("Não foi possível carregar a visão geral."))
      .finally(() => setLoadingOverview(false));
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <BarChart2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Analytics — E-books</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Progresso e desempenho da plataforma</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-xl p-1.5 shadow-sm border border-gray-100 dark:border-gray-700 w-fit">
          <button
            onClick={() => setActiveTab("mine")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "mine"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            O Meu Progresso
          </button>
          {canViewOverview && (
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "overview"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Plataforma (Admin)
            </button>
          )}
        </div>

        {/* Tab: My Stats */}
        {activeTab === "mine" && <MyStatsPanel />}

        {/* Tab: Overview (Admin) */}
        {activeTab === "overview" && (
          <>
            {loadingOverview && (
              <div className="flex items-center gap-2 text-gray-400 text-sm p-4">
                <RefreshCw className="w-4 h-4 animate-spin" />
                A carregar dados da plataforma...
              </div>
            )}

            {overviewError && (
              <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {overviewError}
                </div>
                <button onClick={fetchOverview} className="text-xs text-red-500 hover:text-red-700 underline">
                  Tentar novamente
                </button>
              </div>
            )}

            {overview && !loadingOverview && (
              <>
                {/* KPI cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={BookOpen} label="E-books" value={overview.totalEbooks} color="bg-indigo-500" />
                  <StatCard icon={Users} label="Inscrições" value={overview.totalEnrollments} color="bg-blue-500" />
                  <StatCard icon={CheckCircle} label="Concluídos" value={overview.totalCompletions} color="bg-green-500" />
                  <StatCard
                    icon={TrendingUp}
                    label="Taxa de conclusão"
                    value={`${overview.averageCompletionRate.toFixed(1)}%`}
                    color="bg-orange-500"
                  />
                </div>

                {/* Top ebooks */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    E-books Mais Populares
                  </h3>
                  <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {overview.topEbooks.map((stat) => (
                      <React.Fragment key={stat.ebookId}>
                        <EbookRow stat={stat} onSelect={setSelectedEbookId} />
                      </React.Fragment>
                    ))}
                  </div>
                  {overview.topEbooks.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">Ainda não há dados suficientes.</p>
                  )}
                </div>

                {/* Detail panel */}
                {selectedEbookId && (
                  <EbookDetailPanel
                    ebookId={selectedEbookId}
                    onClose={() => setSelectedEbookId(null)}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
