import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Lock, Zap, Flame } from 'lucide-react';
import { SceneBackground } from './SceneBackground';

interface KidsDashboardProps {
  setView: (v: string) => void;
}

const mapNodes = [
  { id: 1, emoji: "🌲", label: "Floresta", xp: 50, status: "completed", x: 10, y: 68 },
  { id: 2, emoji: "🌊", label: "Rio", xp: 75, status: "completed", x: 28, y: 42 },
  { id: 3, emoji: "🏔️", label: "Montanha", xp: 100, status: "current", x: 50, y: 58 },
  { id: 4, emoji: "💎", label: "Caverna", xp: 150, status: "locked", x: 72, y: 38 },
  { id: 5, emoji: "🏰", label: "Castelo", xp: 200, status: "locked", x: 88, y: 55 },
];

export const KidsDashboard: React.FC<KidsDashboardProps> = ({ setView }) => {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  return (
    <div className="relative min-h-screen overflow-y-auto">
      <SceneBackground />

      <div className="relative z-10 p-4 lg:p-6 max-w-4xl mx-auto space-y-4 pb-10 pt-14 lg:pt-6">

        {/* Header greeting */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-center"
        >
          <h1
            className="font-display font-extrabold text-white text-3xl lg:text-4xl leading-tight"
            style={{ textShadow: "0 3px 12px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.4)" }}
          >
            Olá, Explorador! 👋
          </h1>
          <p className="text-white/90 font-display font-semibold mt-1 text-sm" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.3)" }}>
            O Leo está à tua espera na aventura!
          </p>
        </motion.div>

        {/* XP + Streak + Level row */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="flex justify-center gap-3"
        >
          <div className="flex items-center gap-2 bg-yellow-400 rounded-full px-5 py-2.5 shadow-lg animate-kids-pulse-glow">
            <Star className="w-5 h-5 text-yellow-900 fill-yellow-900" />
            <span className="font-display font-extrabold text-yellow-900 text-lg">1250 XP</span>
          </div>
          <div className="flex items-center gap-2 bg-orange-500 rounded-full px-5 py-2.5 shadow-lg">
            <Flame className="w-5 h-5 text-white fill-white" />
            <span className="font-display font-extrabold text-white text-lg">7 dias</span>
          </div>
          <div className="flex items-center gap-2 bg-indigo-600 rounded-full px-5 py-2.5 shadow-lg">
            <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
            <span className="font-display font-extrabold text-white text-lg">Nível 5</span>
          </div>
        </motion.div>

        {/* Leo mascot + Mission card */}
        <div className="flex gap-4 items-end">
          <motion.div
            initial={{ x: -60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 150 }}
            className="shrink-0 hidden sm:block"
          >
            <div className="relative animate-kids-float">
              <div className="text-[96px] leading-none select-none" style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.25))" }}>
                🦁
              </div>
              <div
                className="absolute -top-12 -right-4 bg-white rounded-2xl px-3 py-2 shadow-lg border-2 border-yellow-300"
                style={{ minWidth: 120 }}
              >
                <p className="font-display font-bold text-slate-800 text-xs text-center">Vamos lá! 🎯</p>
                <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-r-2 border-b-2 border-yellow-300" style={{ transform: "rotate(45deg)" }} />
              </div>
            </div>
          </motion.div>

          {/* Mission card */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 180 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView("kids-hub")}
            className="flex-1 cursor-pointer rounded-3xl p-5 overflow-hidden relative"
            style={{
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A78BFA 100%)",
              boxShadow: "0 12px 40px rgba(99,102,241,0.5), 0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
            <div className="absolute -bottom-4 -right-2 w-16 h-16 rounded-full bg-white/10" />

            <p className="font-display font-bold text-indigo-200 text-xs uppercase tracking-widest mb-1">
              ⚔️ Missão do Dia
            </p>
            <h2 className="font-display font-extrabold text-white text-xl leading-snug">
              Ajuda o Leo a encontrar o tesouro perdido!
            </h2>
            <p className="font-body text-indigo-200 text-sm mt-1.5">
              Aprende 10 palavras · Completa o desafio
            </p>

            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-3 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "30%" }}
                  transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-yellow-400 rounded-full"
                />
              </div>
              <span className="font-mono text-yellow-300 font-bold text-sm">3/10</span>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-4 w-full font-display font-extrabold text-indigo-700 text-base py-3 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #FDE68A, #FBBF24)",
                boxShadow: "0 4px 0 #D97706, 0 8px 20px rgba(251,191,36,0.4)",
              }}
              onClick={(e) => { e.stopPropagation(); setView("kids-hub"); }}
            >
              CONTINUAR MISSÃO 🚀
            </motion.button>
          </motion.div>
        </div>

        {/* Quick action bubbles */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { emoji: "🎮", label: "Jogos", color: "#EF4444", shadow: "#B91C1C", view: "jogos" },
            { emoji: "🏆", label: "Ranking", color: "#F59E0B", shadow: "#B45309", view: "ranking" },
            { emoji: "⭐", label: "Conquistas", color: "#10B981", shadow: "#065F46", view: "ebook-achievements" },
          ].map((item) => (
            <motion.button
              key={item.label}
              whileHover={{ scale: 1.08, y: -4 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setView(item.view)}
              className="flex flex-col items-center justify-center gap-2 py-4 rounded-3xl font-display font-extrabold text-white text-sm"
              style={{
                background: item.color,
                boxShadow: `0 5px 0 ${item.shadow}, 0 8px 24px ${item.color}60`,
              }}
            >
              <span className="text-3xl">{item.emoji}</span>
              {item.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Adventure Map */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #DBEAFE 0%, #E0F2FE 50%, #CFFAFE 100%)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)",
            border: "3px solid rgba(255,255,255,0.8)",
          }}
        >
          <div className="px-5 pt-4 pb-2 flex items-center justify-between">
            <h3 className="font-display font-extrabold text-sky-900 text-lg">🗺️ Mapa da Aventura</h3>
            <span className="font-display font-bold text-sky-600 text-xs bg-sky-100 px-3 py-1 rounded-full border border-sky-200">
              Mundo 1 — Nível 5
            </span>
          </div>

          <div className="relative mx-4 mb-4" style={{ height: 200 }}>
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path
                d="M 10 68 Q 18 30 28 42 Q 38 55 50 58 Q 60 60 72 38 Q 80 22 88 55"
                stroke="#BAE6FD"
                strokeWidth="3"
                fill="none"
                strokeDasharray="6 3"
                strokeLinecap="round"
              />
              <path
                d="M 10 68 Q 18 30 28 42 Q 38 55 50 58"
                stroke="#22C55E"
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>

            {mapNodes.map((node) => (
              <div
                key={node.id}
                className="absolute"
                style={{ left: `${node.x}%`, top: `${node.y}%`, transform: "translate(-50%, -50%)" }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <AnimatePresence>
                  {hoveredNode === node.id && node.status !== "locked" && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-2xl px-3 py-2 shadow-xl border-2 border-sky-200 whitespace-nowrap z-30"
                    >
                      <p className="font-display font-bold text-slate-800 text-xs">{node.label}</p>
                      <p className="font-mono text-yellow-500 font-bold text-xs">+{node.xp} XP ⚡</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  whileHover={node.status !== "locked" ? { scale: 1.25 } : {}}
                  animate={node.status === "current" ? {
                    boxShadow: ["0 0 0 0px rgba(234,179,8,0.5)", "0 0 0 12px rgba(234,179,8,0)", "0 0 0 0px rgba(234,179,8,0)"],
                  } : {}}
                  transition={{ repeat: Infinity, duration: 1.8 }}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-md"
                  style={{
                    border: node.status === "completed" ? "3px solid #22C55E"
                      : node.status === "current" ? "3px solid #EAB308"
                      : "3px solid #D1D5DB",
                    background: node.status === "completed" ? "#DCFCE7"
                      : node.status === "current" ? "#FEF9C3"
                      : "#F3F4F6",
                    boxShadow: node.status === "current" ? "0 4px 16px rgba(234,179,8,0.4)" : "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  {node.status === "locked" ? <Lock className="w-4 h-4 text-gray-400" /> : node.emoji}
                </motion.div>
                <p className="text-center text-[9px] font-display font-bold mt-1"
                  style={{ color: node.status === "locked" ? "#9CA3AF" : "#1E3A5F" }}>
                  {node.label}
                </p>
              </div>
            ))}

            {/* Leo on current node */}
            <motion.div
              className="absolute text-2xl pointer-events-none z-10 select-none"
              style={{ left: "50%", top: "58%", transform: "translate(-50%, -170%)" }}
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              🦁
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
