import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, CheckCircle } from 'lucide-react';
import { SceneBackground } from './SceneBackground';

const categories = [
  { label: "Animais", emoji: "🐾" },
  { label: "Família", emoji: "👨‍👩‍👧" },
  { label: "Cores", emoji: "🎨" },
  { label: "Números", emoji: "🔢" },
  { label: "Comida", emoji: "🍎" },
];

const vocabData: Record<string, { emoji: string; word: string; phonetic: string; translation: string; color: string }[]> = {
  Animais: [
    { emoji: "🐶", word: "Dog", phonetic: "/dɒɡ/", translation: "Cão", color: "#FEF3C7" },
    { emoji: "🐱", word: "Cat", phonetic: "/kæt/", translation: "Gato", color: "#FCE7F3" },
    { emoji: "🐘", word: "Elephant", phonetic: "/ˈɛlɪfənt/", translation: "Elefante", color: "#EDE9FE" },
    { emoji: "🦁", word: "Lion", phonetic: "/ˈlaɪən/", translation: "Leão", color: "#FEF3C7" },
    { emoji: "🐠", word: "Fish", phonetic: "/fɪʃ/", translation: "Peixe", color: "#DBEAFE" },
    { emoji: "🐦", word: "Bird", phonetic: "/bɜːd/", translation: "Pássaro", color: "#DCFCE7" },
    { emoji: "🐰", word: "Rabbit", phonetic: "/ˈræbɪt/", translation: "Coelho", color: "#FCE7F3" },
    { emoji: "🐻", word: "Bear", phonetic: "/bɛr/", translation: "Urso", color: "#FEF3C7" },
  ],
  Família: [
    { emoji: "👨", word: "Father", phonetic: "/ˈfɑːðər/", translation: "Pai", color: "#DBEAFE" },
    { emoji: "👩", word: "Mother", phonetic: "/ˈmʌðər/", translation: "Mãe", color: "#FCE7F3" },
    { emoji: "👦", word: "Brother", phonetic: "/ˈbrʌðər/", translation: "Irmão", color: "#DCFCE7" },
    { emoji: "👧", word: "Sister", phonetic: "/ˈsɪstər/", translation: "Irmã", color: "#FEF3C7" },
    { emoji: "👴", word: "Grandfather", phonetic: "/ˈɡrænˌfɑːðər/", translation: "Avô", color: "#EDE9FE" },
    { emoji: "👵", word: "Grandmother", phonetic: "/ˈɡrænˌmʌðər/", translation: "Avó", color: "#FCE7F3" },
  ],
  Cores: [
    { emoji: "🔴", word: "Red", phonetic: "/rɛd/", translation: "Vermelho", color: "#FEE2E2" },
    { emoji: "🔵", word: "Blue", phonetic: "/bluː/", translation: "Azul", color: "#DBEAFE" },
    { emoji: "🟡", word: "Yellow", phonetic: "/ˈjɛloʊ/", translation: "Amarelo", color: "#FEF3C7" },
    { emoji: "🟢", word: "Green", phonetic: "/ɡriːn/", translation: "Verde", color: "#DCFCE7" },
    { emoji: "🟠", word: "Orange", phonetic: "/ˈɒrɪndʒ/", translation: "Laranja", color: "#FFEDD5" },
    { emoji: "🟣", word: "Purple", phonetic: "/ˈpɜːrpəl/", translation: "Roxo", color: "#EDE9FE" },
  ],
  Números: [
    { emoji: "1️⃣", word: "One", phonetic: "/wʌn/", translation: "Um", color: "#FEE2E2" },
    { emoji: "2️⃣", word: "Two", phonetic: "/tuː/", translation: "Dois", color: "#DBEAFE" },
    { emoji: "3️⃣", word: "Three", phonetic: "/θriː/", translation: "Três", color: "#DCFCE7" },
    { emoji: "4️⃣", word: "Four", phonetic: "/fɔːr/", translation: "Quatro", color: "#FEF3C7" },
    { emoji: "5️⃣", word: "Five", phonetic: "/faɪv/", translation: "Cinco", color: "#FFEDD5" },
    { emoji: "6️⃣", word: "Six", phonetic: "/sɪks/", translation: "Seis", color: "#EDE9FE" },
  ],
  Comida: [
    { emoji: "🍎", word: "Apple", phonetic: "/ˈæpəl/", translation: "Maçã", color: "#FEE2E2" },
    { emoji: "🍌", word: "Banana", phonetic: "/bəˈnɑːnə/", translation: "Banana", color: "#FEF3C7" },
    { emoji: "🍕", word: "Pizza", phonetic: "/ˈpiːtsə/", translation: "Pizza", color: "#FFEDD5" },
    { emoji: "🥦", word: "Broccoli", phonetic: "/ˈbrɒkəli/", translation: "Brócolos", color: "#DCFCE7" },
    { emoji: "🍓", word: "Strawberry", phonetic: "/ˈstrɔːbɛri/", translation: "Morango", color: "#FCE7F3" },
    { emoji: "🧀", word: "Cheese", phonetic: "/tʃiːz/", translation: "Queijo", color: "#FEF3C7" },
  ],
};

interface KidsHubProps {
  setView: (v: string) => void;
}

export const KidsHub: React.FC<KidsHubProps> = ({ setView: _setView }) => {
  const [activeCategory, setActiveCategory] = useState("Animais");
  const [learned, setLearned] = useState<Set<string>>(new Set(["Dog", "Cat", "Fish"]));
  const [playing, setPlaying] = useState<string | null>(null);
  const [lastLearned, setLastLearned] = useState<string | null>(null);

  const words = vocabData[activeCategory] || [];
  const total = Object.values(vocabData).flat().length;
  const learnedCount = learned.size;

  const toggleLearned = (word: string) => {
    setLearned((prev) => {
      const next = new Set(prev);
      if (next.has(word)) {
        next.delete(word);
      } else {
        next.add(word);
        setLastLearned(word);
        setTimeout(() => setLastLearned(null), 1200);
      }
      return next;
    });
  };

  const playAudio = (word: string) => {
    setPlaying(word);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
    setTimeout(() => setPlaying(null), 900);
  };

  return (
    <div className="relative min-h-screen overflow-y-auto">
      <SceneBackground />

      <div className="relative z-10 p-4 lg:p-6 max-w-4xl mx-auto space-y-4 pb-10 pt-14 lg:pt-6">

        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center"
        >
          <h1
            className="font-display font-extrabold text-white text-2xl lg:text-3xl"
            style={{ textShadow: "0 3px 12px rgba(0,0,0,0.3)" }}
          >
            📖 Vocabulário Interativo
          </h1>
          <p className="text-white/85 font-display font-semibold text-sm" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.3)" }}>
            Clica nas cartas para aprender palavras novas!
          </p>
        </motion.div>

        {/* Progress panel */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl p-4 overflow-hidden relative"
          style={{
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            boxShadow: "0 8px 32px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-display font-extrabold text-white text-base">
                {learnedCount} palavras aprendidas! 🎉
              </p>
              <p className="font-body text-indigo-200 text-xs">Meta: {total} palavras</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <span className="font-display font-extrabold text-yellow-300 text-xl">
                {Math.round((learnedCount / total) * 100)}%
              </span>
            </div>
          </div>
          <div className="h-4 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(learnedCount / total) * 100}%` }}
              transition={{ type: "spring", stiffness: 100, delay: 0.3 }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #FDE68A, #FBBF24)" }}
            />
          </div>
        </motion.div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat, i) => (
            <motion.button
              key={cat.label}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.label)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl font-display font-bold text-sm transition-all"
              style={activeCategory === cat.label ? {
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                color: "white",
                boxShadow: "0 4px 0 #4338CA, 0 8px 20px rgba(99,102,241,0.4)",
              } : {
                background: "rgba(255,255,255,0.85)",
                color: "#475569",
                boxShadow: "0 3px 0 rgba(0,0,0,0.1)",
              }}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </motion.button>
          ))}
        </div>

        {/* Vocab grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3"
          >
            {words.map((item, i) => {
              const isLearned = learned.has(item.word);
              const isNew = lastLearned === item.word;
              return (
                <motion.div
                  key={item.word}
                  initial={{ opacity: 0, y: 20, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.06, type: "spring", stiffness: 280, damping: 22 }}
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => toggleLearned(item.word)}
                  className="relative rounded-3xl p-4 cursor-pointer overflow-hidden"
                  style={{
                    background: isLearned ? "linear-gradient(135deg, #D1FAE5, #A7F3D0)" : item.color,
                    boxShadow: isLearned
                      ? "0 4px 0 #059669, 0 8px 24px rgba(16,185,129,0.3)"
                      : "0 4px 0 rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.08)",
                    border: isLearned ? "3px solid #10B981" : "3px solid rgba(255,255,255,0.8)",
                  }}
                >
                  <AnimatePresence>
                    {isNew && (
                      <motion.div
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 3, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      >
                        <span className="text-4xl">✨</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isLearned && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute top-2 right-2"
                    >
                      <CheckCircle className="w-5 h-5 text-emerald-500 fill-emerald-100" />
                    </motion.div>
                  )}

                  <motion.div
                    animate={isNew ? { scale: [1, 1.5, 1], rotate: [0, -15, 15, 0] } : {}}
                    className="text-center mb-2"
                  >
                    <span className="text-5xl leading-none">{item.emoji}</span>
                  </motion.div>

                  <p className="font-display font-extrabold text-slate-900 text-base text-center leading-tight">
                    {item.word}
                  </p>
                  <p className="font-body text-slate-500 text-xs italic text-center mt-0.5">
                    {item.phonetic}
                  </p>
                  <p className="font-display font-bold text-slate-600 text-xs text-center mt-0.5">
                    {item.translation}
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={(e) => { e.stopPropagation(); playAudio(item.word); }}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-2xl font-display font-bold text-xs transition-all"
                    style={playing === item.word ? {
                      background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
                      color: "white",
                      boxShadow: "0 3px 0 #0369A1",
                    } : {
                      background: "rgba(255,255,255,0.7)",
                      color: "#0EA5E9",
                      boxShadow: "0 2px 0 rgba(0,0,0,0.06)",
                    }}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    {playing === item.word ? "♪ ♪ ♪" : "OUVIR"}
                  </motion.button>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Leo encouragement */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="flex items-center justify-center gap-3 py-3"
        >
          <span className="text-4xl">🦁</span>
          <div
            className="rounded-2xl px-4 py-2.5"
            style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
          >
            <p className="font-display font-bold text-slate-700 text-sm">
              {learnedCount === 0
                ? "Vamos começar! Clica numa carta 🎯"
                : learnedCount < 5
                ? "Óptimo trabalho! Continua assim! 💪"
                : "Uau! Estás a arrasar! 🔥"}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
