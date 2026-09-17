import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Gift,
  Star,
  Heart,
  Zap,
  BookOpen,
  Volume2,
  Gamepad2,
  Award,
} from "lucide-react";
import { useToast } from "../../../context/ToastContext";
import { AgeGroup } from "../../../types";

interface KidsDashboardProps {
  selectedAgeGroup: AgeGroup;
  onNavigate?: (view: string) => void;
  onStartActivity?: (type: string) => void;
}

export const KidsDashboard: React.FC<KidsDashboardProps> = ({
  selectedAgeGroup,
  onNavigate,
  onStartActivity,
}) => {
  const [stars, setStars] = useState(48);
  const [presents, setPresents] = useState(12);
  const [hearts, setHearts] = useState(3);
  const { showToast } = useToast();

  const missions = [
    {
      id: 1,
      title: "Missão: Palavras Mágicas",
      description: "Aprende 5 palavras novas!",
      emoji: "✨",
      reward: "⭐⭐⭐",
      progress: 3,
      total: 5,
    },
    {
      id: 2,
      title: "Pratica a Pronúncia",
      description: "Fala 3 frases para ganhar presentes!",
      emoji: "🎤",
      reward: "🎁🎁",
      progress: 1,
      total: 3,
    },
    {
      id: 3,
      title: "Quiz Divertido",
      description: "Responde 10 perguntas corretamente!",
      emoji: "🎮",
      reward: "⭐⭐⭐⭐",
      progress: 7,
      total: 10,
    },
  ];

  const characters = [
    { name: "Lily", emoji: "🐱", description: "Gato Curioso" },
    { name: "Max", emoji: "🦁", description: "Leão Amigável" },
    { name: "Bella", emoji: "🧜", description: "Sereia Cantora" },
    { name: "Oscar", emoji: "🦊", description: "Raposa Inteligente" },
  ];

  const handleStartMission = (missionId: number) => {
    const mission = missions.find((m) => m.id === missionId);
    onStartActivity?.(`mission-${missionId}`);
    showToast(`🚀 ${mission?.title} iniciada!`, "success");
  };

  const handleTalkToCharacter = (character: string) => {
    onStartActivity?.("talk-to-character");
    showToast(`Conversando com ${character}...`, "success");
  };

  const handlePlayGame = () => {
    onNavigate?.("jogos");
    showToast("🎮 Vamos jogar!", "success");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-200 via-purple-200 to-blue-200 p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Welcome Banner */}
        <motion.div className="bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 rounded-3xl p-6 shadow-lg border-4 border-yellow-400">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-4xl animate-bounce">🌈</span>
                <h1 className="text-2xl sm:text-3xl font-black text-purple-800">
                  Bem-vindo ao Mundo Mágico!
                </h1>
              </div>
              <p className="text-sm sm:text-base text-purple-700 font-semibold">
                Aprende com personagens divertidas, ganha presentes e divirte-te com jogos! 🎉
              </p>
            </div>
          </div>
        </motion.div>

        {/* Resources */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="bg-white rounded-2xl p-4 shadow-lg border-4 border-yellow-400 text-center"
          >
            <div className="text-3xl sm:text-4xl mb-2">⭐</div>
            <p className="text-xs sm:text-sm font-bold text-gray-800">{stars} Estrelas</p>
            <p className="text-xs text-gray-600">Recolhe para trocar</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.1, rotate: -5 }}
            className="bg-white rounded-2xl p-4 shadow-lg border-4 border-pink-400 text-center"
          >
            <div className="text-3xl sm:text-4xl mb-2">🎁</div>
            <p className="text-xs sm:text-sm font-bold text-gray-800">{presents} Presentes</p>
            <p className="text-xs text-gray-600">Desbloqueados!</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="bg-white rounded-2xl p-4 shadow-lg border-4 border-red-400 text-center"
          >
            <div className="text-3xl sm:text-4xl mb-2">❤️</div>
            <p className="text-xs sm:text-sm font-bold text-gray-800">{hearts} Vidas</p>
            <p className="text-xs text-gray-600">Saudável!</p>
          </motion.div>
        </div>

        {/* Characters */}
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-purple-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">👯</span>
            Personagens Mágicas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {characters.map((char, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTalkToCharacter(char.name)}
                className="bg-white rounded-2xl p-4 shadow-lg border-4 border-indigo-400 text-center hover:shadow-xl transition"
              >
                <div className="text-4xl mb-2">{char.emoji}</div>
                <p className="font-bold text-sm text-gray-800">{char.name}</p>
                <p className="text-xs text-gray-600">{char.description}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Missions */}
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-purple-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            Missões do Dia
          </h2>
          <div className="space-y-3">
            {missions.map((mission, idx) => (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-2xl p-4 shadow-lg border-4 border-pink-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{mission.emoji}</span>
                    <div>
                      <h3 className="font-black text-gray-800">{mission.title}</h3>
                      <p className="text-sm text-gray-600">{mission.description}</p>
                    </div>
                  </div>
                  <span className="text-lg sm:text-xl">{mission.reward}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-300 rounded-full h-4 mb-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(mission.progress / mission.total) * 100}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-4 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-700">
                    {mission.progress}/{mission.total}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleStartMission(mission.id)}
                    className="bg-gradient-to-r from-pink-400 to-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm hover:shadow-lg transition"
                  >
                    Começar! 🎯
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Big Play Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePlayGame}
          className="w-full bg-gradient-to-r from-orange-400 via-pink-400 to-red-400 text-white font-black py-5 px-6 rounded-3xl shadow-xl hover:shadow-2xl transition flex items-center justify-center gap-3 border-4 border-orange-500"
        >
          <Gamepad2 className="w-8 h-8" />
          <span className="text-lg sm:text-xl">JOGAR AGORA! 🎮</span>
        </motion.button>

        {/* Learning tip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-blue-100 rounded-2xl p-4 border-4 border-blue-300"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="font-bold text-blue-900 text-sm sm:text-base">Dica Especial:</p>
              <p className="text-xs sm:text-sm text-blue-800">
                Completa as tuas missões todos os dias para ganhar mais presentes mágicos! 🌟
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
