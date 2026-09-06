import React, { useEffect, useState } from "react";
import { Trophy, Flame, Zap, Star, Users, RefreshCw, AlertCircle } from "lucide-react";
import { auth } from "../../../firebase";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  awardedAt?: string;
}

interface StudentGamification {
  studentId: string;
  xp: number;
  level: number;
  streakDays: number;
  lastReadDate: string | null;
  badges: Badge[];
  totalChaptersRead: number;
  totalEbooksCompleted: number;
}

interface LeaderboardEntry {
  studentId: string;
  displayName: string;
  xp: number;
  level: number;
  badges: number;
}

async function apiFetch<T>(path: string): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(`/api/ebook/gamification${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function xpToNextLevel(level: number): number {
  return (level * level) * 50;
}
function xpForLevel(level: number): number {
  return ((level - 1) * (level - 1)) * 50;
}

function XpBar({ xp, level }: { xp: number; level: number }) {
  const current = xp - xpForLevel(level);
  const needed = xpToNextLevel(level) - xpForLevel(level);
  const pct = Math.min(100, Math.round((current / needed) * 100));

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Nível {level}</span>
        <span>{current} / {needed} XP</span>
      </div>
      <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function BadgeCard({ badge, earned }: { badge: Badge; earned: boolean }) {
  return (
    <div
      className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${
        earned
          ? "bg-white dark:bg-gray-800 border-indigo-200 dark:border-indigo-700 shadow-sm"
          : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-40 grayscale"
      }`}
      title={badge.description}
    >
      <span className="text-2xl">{badge.icon}</span>
      <p className="text-xs font-medium text-gray-700 dark:text-gray-200 leading-snug">{badge.name}</p>
      {earned && badge.awardedAt && (
        <p className="text-[10px] text-gray-400">
          {new Date(badge.awardedAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })}
        </p>
      )}
    </div>
  );
}

const ALL_BADGE_DEFS: Badge[] = [
  { id: "first_read", name: "Primeira Leitura", description: "Completou o primeiro capítulo", icon: "📖" },
  { id: "bookworm", name: "Rato de Biblioteca", description: "Completou 10 capítulos", icon: "🐛" },
  { id: "centurion", name: "Centurião", description: "Completou 100 capítulos", icon: "🏛️" },
  { id: "finisher", name: "Finalizador", description: "Concluiu o primeiro e-book", icon: "🎯" },
  { id: "scholar", name: "Académico", description: "Concluiu 5 e-books", icon: "🎓" },
  { id: "polyglot", name: "Políglota", description: "Leu e-books em 3 idiomas", icon: "🌐" },
  { id: "streak_7", name: "Semana Dedicada", description: "7 dias consecutivos", icon: "🔥" },
  { id: "streak_30", name: "Mês Imparável", description: "30 dias consecutivos", icon: "⚡" },
  { id: "speed_reader", name: "Leitor Veloz", description: "E-book concluído em 7 dias", icon: "💨" },
];

export function EbookAchievements() {
  const [tab, setTab] = useState<"badges" | "leaderboard">("badges");
  const [gamification, setGamification] = useState<StudentGamification | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [gData, lData] = await Promise.all([
        apiFetch<StudentGamification>("/me"),
        apiFetch<{ entries: LeaderboardEntry[] }>("/leaderboard?limit=10"),
      ]);
      setGamification(gData);
      setLeaderboard(lData.entries);
    } catch {
      setError("Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const earnedIds = new Set(gamification?.badges.map((b) => b.id) ?? []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Conquistas & Progresso
        </h3>
        <button
          onClick={load}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading && (
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {!loading && gamification && (
        <>
          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-4 h-4 text-indigo-500" />
                <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                  {gamification.xp.toLocaleString("pt-PT")}
                </span>
              </div>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">XP Total</p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-lg font-bold text-orange-700 dark:text-orange-300">
                  {gamification.streakDays}
                </span>
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400">Dias seguidos</p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="w-4 h-4 text-purple-500" />
                <span className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {gamification.level}
                </span>
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400">Nível</p>
            </div>
          </div>

          {/* XP bar */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
            <XpBar xp={gamification.xp} level={gamification.level} />
            <p className="text-xs text-gray-400 mt-2">
              {gamification.totalChaptersRead} capítulos lidos · {gamification.totalEbooksCompleted} e-books concluídos
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setTab("badges")}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === "badges"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <Trophy className="w-4 h-4 inline mr-1.5" />
              Conquistas ({gamification.badges.length}/{ALL_BADGE_DEFS.length})
            </button>
            <button
              onClick={() => setTab("leaderboard")}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === "leaderboard"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <Users className="w-4 h-4 inline mr-1.5" />
              Classificação
            </button>
          </div>

          {tab === "badges" && (
            <div className="grid grid-cols-3 gap-3">
              {ALL_BADGE_DEFS.map((def) => {
                const earned = gamification.badges.find((b) => b.id === def.id);
                return (
                  <React.Fragment key={def.id}>
                    <BadgeCard badge={earned ?? def} earned={earnedIds.has(def.id)} />
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {tab === "leaderboard" && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              {leaderboard.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">Ainda não há dados no leaderboard.</p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {leaderboard.map((entry, i) => (
                    <div
                      key={entry.studentId}
                      className={`flex items-center gap-3 px-4 py-3 ${
                        entry.studentId === gamification.studentId
                          ? "bg-indigo-50 dark:bg-indigo-900/20"
                          : ""
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          i === 0
                            ? "bg-yellow-400 text-white"
                            : i === 1
                              ? "bg-gray-300 dark:bg-gray-500 text-gray-700 dark:text-white"
                              : i === 2
                                ? "bg-orange-400 text-white"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                          {entry.displayName}
                          {entry.studentId === gamification.studentId && (
                            <span className="ml-1 text-xs text-indigo-500">(você)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400">Nível {entry.level} · {entry.badges} conquistas</p>
                      </div>
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                        {entry.xp.toLocaleString("pt-PT")} XP
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
