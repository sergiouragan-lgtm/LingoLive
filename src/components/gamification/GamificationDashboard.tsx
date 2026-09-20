import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Zap,
  Target,
  TrendingUp,
  Gift,
  Calendar,
  Star,
  Flame,
  Badge,
  Crown,
  Lock,
} from 'lucide-react';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useNotifications } from '@/hooks/useNotifications';
import { usePersonalization } from '@/hooks/usePersonalization';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  xpReward: number;
  unlockedAt?: number;
  progress?: number;
  maxProgress?: number;
}

interface Streak {
  id: string;
  type: 'daily' | 'weekly' | 'lesson-complete';
  currentCount: number;
  bestCount: number;
  lastActivityDate: number;
  xpMultiplier: number;
}

interface Leaderboard {
  rank: number;
  userId: string;
  userName: string;
  xp: number;
  badges: number;
  level: number;
  avatar?: string;
}

interface UserGamification {
  userId: string;
  totalXp: number;
  level: number;
  achievements: Achievement[];
  streaks: Streak[];
  leaderboardRank: number;
  nextLevelXp: number;
  xpProgress: number;
  rewards: { id: string; name: string; claimedAt: number }[];
}

interface GamificationDashboardProps {
  userId: string;
  userName: string;
}

const ACHIEVEMENT_TEMPLATES: Achievement[] = [
  {
    id: 'first-lesson',
    name: 'Primeiro Passo',
    description: 'Complete sua primeira lição',
    icon: '🎯',
    difficulty: 'easy',
    xpReward: 50,
  },
  {
    id: 'week-warrior',
    name: 'Guerreiro da Semana',
    description: 'Mantenha um sequência de 7 dias',
    icon: '🔥',
    difficulty: 'medium',
    xpReward: 250,
  },
  {
    id: 'reading-master',
    name: 'Mestre Leitor',
    description: 'Leia 10 eBooks',
    icon: '📚',
    difficulty: 'hard',
    xpReward: 500,
  },
  {
    id: 'perfect-score',
    name: 'Pontuação Perfeita',
    description: 'Obtenha 100% em um teste',
    icon: '⭐',
    difficulty: 'medium',
    xpReward: 200,
  },
  {
    id: 'speech-champion',
    name: 'Campeão de Fala',
    description: 'Complete 50 lições de pronúncia',
    icon: '🎤',
    difficulty: 'hard',
    xpReward: 400,
  },
  {
    id: 'legendary-streak',
    name: 'Sequência Lendária',
    description: 'Mantenha um sequência de 100 dias',
    icon: '👑',
    difficulty: 'legendary',
    xpReward: 2000,
  },
];

const DIFFICULTY_COLORS = {
  easy: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  medium: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  hard: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  legendary: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
};

export const GamificationDashboard: React.FC<GamificationDashboardProps> = ({
  userId,
  userName,
}) => {
  // Phase 38-45 Hook Integration
  const { trackEvent } = useAnalytics(userId);
  const { notifications } = useNotifications(userId);
  const { profile: personalizationProfile } = usePersonalization(userId);

  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const { data: gamification, isLoading } = useRealtimeSync<UserGamification>(
    `user_gamification/${userId}`,
    (data) =>
      data || {
        userId,
        totalXp: 0,
        level: 1,
        achievements: [],
        streaks: [],
        leaderboardRank: 0,
        nextLevelXp: 1000,
        xpProgress: 0,
        rewards: [],
      }
  );

  const { data: leaderboard } = useRealtimeSync<Leaderboard[]>(
    'leaderboards/global',
    (data) => data || []
  );

  // Track gamification dashboard access (Phase 38-45 Analytics)
  useEffect(() => {
    if (userId && gamification) {
      trackEvent('gamification_dashboard_accessed', {
        userName,
        totalXp: gamification.totalXp,
        level: gamification.level,
        achievements: gamification.achievements?.length || 0,
        leaderboardRank: gamification.leaderboardRank,
      });
    }
  }, [userId, userName, gamification, trackEvent]);

  const unlockedAchievements = useMemo(
    () => gamification?.achievements.filter((a) => a.unlockedAt) || [],
    [gamification?.achievements]
  );

  const lockedAchievements = useMemo(
    () => gamification?.achievements.filter((a) => !a.unlockedAt) || [],
    [gamification?.achievements]
  );

  const userRank = leaderboard?.find((u) => u.userId === userId);

  const handleClaimReward = async (rewardId: string) => {
    try {
      const token = await (window as any).auth?.currentUser?.getIdToken?.();
      await fetch(`/api/gamification/claim-reward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, rewardId }),
      });
    } catch (error) {
      console.error('Reward claim failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Carregando seu progresso...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Gamificação
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {userName} • Nível {gamification?.level || 1}
              </p>
            </div>
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              Ranking
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* XP and Level Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {/* Level Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Crown className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">NÍVEL</p>
            </div>
            <p className="text-4xl font-bold text-indigo-900 dark:text-indigo-100">
              {gamification?.level || 1}
            </p>
            <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-2">
              {gamification?.xpProgress || 0} / {gamification?.nextLevelXp || 1000} XP
            </p>
            <div className="mt-3 bg-indigo-200 dark:bg-indigo-800 h-2 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${((gamification?.xpProgress || 0) / (gamification?.nextLevelXp || 1000)) * 100}%`,
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-indigo-600 dark:bg-indigo-400"
              ></motion.div>
            </div>
          </div>

          {/* Total XP Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">XP TOTAL</p>
            </div>
            <p className="text-4xl font-bold text-purple-900 dark:text-purple-100">
              {(gamification?.totalXp || 0).toLocaleString()}
            </p>
            <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">
              Experiência acumulada
            </p>
          </div>

          {/* Badges Card */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Badge className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">CONQUISTAS</p>
            </div>
            <p className="text-4xl font-bold text-amber-900 dark:text-amber-100">
              {unlockedAchievements.length}
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
              {lockedAchievements.length} ainda disponíveis
            </p>
          </div>
        </motion.div>

        {/* Streaks Section */}
        {gamification?.streaks && gamification.streaks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {gamification.streaks.map((streak) => (
              <div
                key={streak.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {streak.type === 'daily'
                        ? 'Sequência Diária'
                        : streak.type === 'weekly'
                          ? 'Sequência Semanal'
                          : 'Aulas Completas'}
                    </h3>
                  </div>
                  <span className="text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full">
                    x{streak.xpMultiplier}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Atual</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {streak.currentCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Melhor</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {streak.bestCount}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Achievements Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Conquistas Desbloqueadas ({unlockedAchievements.length})
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
            <AnimatePresence>
              {unlockedAchievements.map((achievement, idx) => (
                <motion.button
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedAchievement(achievement)}
                  className="group p-4 bg-white dark:bg-gray-800 border-2 border-amber-300 dark:border-amber-700 rounded-lg hover:shadow-lg transition-all"
                >
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {achievement.name}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    +{achievement.xpReward} XP
                  </p>
                  <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">Desbloqueado</div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Conquistas Disponíveis ({lockedAchievements.length})
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {lockedAchievements.map((achievement, idx) => (
                <motion.button
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedAchievement(achievement)}
                  className={`group p-4 rounded-lg hover:shadow-lg transition-all opacity-60 border-2 ${DIFFICULTY_COLORS[achievement.difficulty].bg} ${DIFFICULTY_COLORS[achievement.difficulty].border}`}
                >
                  <div className="text-3xl mb-2 opacity-50 group-hover:opacity-75 transition-opacity">
                    {achievement.icon}
                  </div>
                  <p className={`font-semibold text-sm ${DIFFICULTY_COLORS[achievement.difficulty].text}`}>
                    {achievement.name}
                  </p>
                  {achievement.progress !== undefined && (
                    <div className="mt-2 w-full bg-gray-300 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600"
                        style={{
                          width: `${((achievement.progress || 0) / (achievement.maxProgress || 1)) * 100}%`,
                        }}
                      ></div>
                    </div>
                  )}
                  <p className="text-xs mt-1">+{achievement.xpReward} XP</p>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Achievement Detail Modal */}
        <AnimatePresence>
          {selectedAchievement && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAchievement(null)}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-lg max-w-sm w-full p-6"
              >
                <div className="text-5xl mb-4">{selectedAchievement.icon}</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedAchievement.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {selectedAchievement.description}
                </p>

                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Dificuldade</p>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${DIFFICULTY_COLORS[selectedAchievement.difficulty].bg} ${DIFFICULTY_COLORS[selectedAchievement.difficulty].text}`}
                    >
                      {selectedAchievement.difficulty.charAt(0).toUpperCase() +
                        selectedAchievement.difficulty.slice(1)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Recompensa</p>
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      +{selectedAchievement.xpReward} XP
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAchievement(null)}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  Fechar
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Leaderboard Sidebar */}
        {showLeaderboard && leaderboard && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed bottom-8 right-8 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-6 max-h-96 overflow-y-auto"
          >
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-600" />
              Top 10 Ranking Global
            </h3>

            <div className="space-y-2">
              {leaderboard.slice(0, 10).map((user, idx) => (
                <div
                  key={user.userId}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    user.userId === userId
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 border-l-2 border-indigo-600'
                      : ''
                  }`}
                >
                  <span className="font-bold text-gray-700 dark:text-gray-300 w-6">
                    {idx + 1}
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {user.userName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.xp.toLocaleString()} XP
                    </p>
                  </div>
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    Lvl {user.level}
                  </span>
                </div>
              ))}
            </div>

            {userRank && (
              <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-1">Sua Posição</p>
                <p className="font-bold text-indigo-900 dark:text-indigo-100">
                  #{userRank.rank} de {leaderboard.length}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
