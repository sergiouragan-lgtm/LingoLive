import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Flame,
  Trophy,
  TrendingUp,
  Calendar,
  Target,
  Zap,
  BookOpen,
  MessageSquare,
  Award,
  BarChart3,
} from "lucide-react";
import { useToast } from "../../../context/ToastContext";
import { AgeGroup } from "../../../types";
import { auth, db } from "../../../firebase";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { useMonitoring } from "../../../hooks/useMonitoring";

interface TeensDashboardProps {
  selectedAgeGroup: AgeGroup;
  onNavigate?: (view: string) => void;
  onStartActivity?: (type: string) => void;
}

export const TeensDashboard: React.FC<TeensDashboardProps> = ({
  selectedAgeGroup,
  onNavigate,
  onStartActivity,
}) => {
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  const [streak, setStreak] = useState(0);
  const [ranking, setRanking] = useState("Top 15%");
  const [dailyGoalProgress, setDailyGoalProgress] = useState(65);
  const [xpEarned, setXpEarned] = useState(2450);
  const [level, setLevel] = useState(24);
  const [weeklyMinutes, setWeeklyMinutes] = useState(320);
  const { showToast } = useToast();

  // Lifecycle tracking
  useEffect(() => {
    if (userId) {
      trackEvent('teens_dashboard_accessed', {
        selectedAgeGroup,
        level,
        weeklyMinutes,
      });
    }
  }, [userId, trackEvent, selectedAgeGroup, level, weeklyMinutes]);

  useEffect(() => {
    if (!auth.currentUser) return;

    try {
      const q = query(
        collection(db, "users", auth.currentUser.uid, "achievements"),
        orderBy("unlockedAt", "desc"),
        limit(5)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            // Update based on achievements
            setLevel(20 + snapshot.size);
          }
        },
        (error) => console.error("Error fetching achievements:", error)
      );

      return unsubscribe;
    } catch (error) {
      console.error("Error setting up listener:", error);
    }
  }, []);

  const handleStartChallenge = () => {
    if (userId) {
      trackEvent('teens_daily_challenge_started', {
        currentLevel: level,
        currentStreak: streak,
      });
    }
    onStartActivity?.("daily-challenge");
    showToast("🔥 Desafio diário iniciado!", "success");
  };

  const handleStartConversation = () => {
    if (userId) {
      trackEvent('teens_ai_conversation_started', {
        currentLevel: level,
      });
    }
    onNavigate?.("live-chat");
    showToast("💬 Iniciando conversa com IA...", "success");
  };

  const handleViewRanking = () => {
    if (userId) {
      trackEvent('teens_ranking_viewed', {
        currentRanking: ranking,
      });
    }
    onNavigate?.("ranking");
  };

  const challenges = [
    {
      id: 1,
      title: "Sequência de 18 Dias",
      description: "Mantém a tua sequência de treino",
      icon: "🔥",
      status: "active",
      progress: 14,
      total: 18,
    },
    {
      id: 2,
      title: "Domina 50 Palavras",
      description: "Aprende 50 novas palavras esta semana",
      icon: "📚",
      status: "active",
      progress: 32,
      total: 50,
    },
    {
      id: 3,
      title: "Fala por 10 Minutos",
      description: "Pratica conversação contínua",
      icon: "🎤",
      status: "available",
      progress: 0,
      total: 10,
    },
  ];

  const recentAchievements = [
    { icon: "🏆", title: "Semana Incrível", description: "Ganhou 1500 XP em 7 dias" },
    { icon: "🎯", title: "Vocabulário Dominado", description: "Aprendeu 100 palavras" },
    { icon: "⚡", title: "Ritmo Acelerado", description: "Completou 10 atividades seguidas" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950 p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* Hero Banner */}
        <motion.div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 rounded-2xl shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-3xl">🔥</span>
                <h1 className="text-2xl sm:text-3xl font-extrabold">Modo Adolescente</h1>
              </div>
              <p className="text-indigo-100 text-sm sm:text-base max-w-2xl">
                Desafios diários, competições de ranking e conversações com IA. Eleva o teu nível ao máximo!
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl sm:text-4xl font-bold">{level}</div>
              <div className="text-indigo-200 text-xs sm:text-sm">Nível Atual</div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Sequência</p>
                <p className="text-2xl font-bold text-orange-600">{streak}</p>
              </div>
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Ranking</p>
                <p className="text-lg font-bold text-purple-600">{ranking}</p>
              </div>
              <Trophy className="w-5 h-5 text-purple-500" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Esta Semana</p>
                <p className="text-2xl font-bold text-blue-600">{weeklyMinutes}m</p>
              </div>
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">XP Ganho</p>
                <p className="text-2xl font-bold text-indigo-600">{xpEarned}</p>
              </div>
              <Zap className="w-5 h-5 text-indigo-500" />
            </div>
          </motion.div>
        </div>

        {/* Daily Goal Progress */}
        <motion.div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              Meta do Dia
            </h2>
            <span className="text-sm font-semibold text-indigo-600">{dailyGoalProgress}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dailyGoalProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"
            />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-3">
            Completa 10 minutos de prática para atingires 100%
          </p>
        </motion.div>

        {/* Active Challenges */}
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-600" />
            Desafios Ativos
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <AnimatePresence>
              {challenges.map((challenge, idx) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-2xl">{challenge.icon}</div>
                    {challenge.status === "active" && (
                      <span className="text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-full">
                        Em Progresso
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm mb-1">{challenge.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                    {challenge.description}
                  </p>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="h-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"
                      style={{ width: `${(challenge.progress / challenge.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                    {challenge.progress}/{challenge.total}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartChallenge}
            className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-3"
          >
            <Flame className="w-6 h-6" />
            <span>Iniciar Desafio Diário</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartConversation}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-3"
          >
            <MessageSquare className="w-6 h-6" />
            <span>Conversar com IA</span>
          </motion.button>
        </div>

        {/* Recent Achievements */}
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" />
            Conquistas Recentes
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {recentAchievements.map((achievement, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <h3 className="font-bold text-sm mb-1">{achievement.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {achievement.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA to Ranking */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={handleViewRanking}
          className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold py-3 px-6 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center gap-2"
        >
          <TrendingUp className="w-5 h-5" />
          <span>Ver Rankings Globais</span>
        </motion.button>
      </motion.div>
    </div>
  );
};
