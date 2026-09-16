import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Flame, Zap, BookOpen, Mic, Trophy, TrendingUp, Play, ChevronRight, BarChart2 } from 'lucide-react';
import { auth, db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface TeenDashboardProps {
  setView: (v: string) => void;
  userId?: string;
}

interface TeenStats {
  xp: number;
  level: number;
  streak: number;
  wordsLearned: number;
  weeklyGoal: number;
  weeklyProgress: number;
}

const challenges = [
  { id: 1, emoji: '🎯', title: 'Falar 5 minutos', desc: 'Pratica com o assistente IA', xp: 50, done: false },
  { id: 2, emoji: '📖', title: 'Ler um capítulo', desc: 'Abre o leitor de ebooks', xp: 75, done: false },
  { id: 3, emoji: '🃏', title: '20 flashcards', desc: 'Revê o teu vocabulário', xp: 40, done: true },
];

export const TeenDashboard: React.FC<TeenDashboardProps> = ({ setView, userId }) => {
  const [stats, setStats] = useState<TeenStats>({
    xp: 0, level: 1, streak: 0, wordsLearned: 0, weeklyGoal: 500, weeklyProgress: 0,
  });
  const [displayName, setDisplayName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) { setLoading(false); return; }

    const name = auth.currentUser?.displayName || '';
    setDisplayName(name.split(' ')[0] || '');

    getDoc(doc(db, 'user_gamification', uid))
      .then(snap => {
        if (snap.exists()) {
          const d = snap.data();
          setStats(prev => ({
            ...prev,
            xp: d.xp ?? 0,
            level: d.level ?? 1,
            streak: d.streak ?? 0,
            wordsLearned: d.wordsLearned ?? 0,
            weeklyProgress: d.weeklyXP ?? 0,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const levelProgress = ((stats.xp % 1000) / 1000) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 overflow-y-auto">
      <style>{`
        .teen-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(12px); }
        .teen-glow { box-shadow: 0 0 40px rgba(99,102,241,0.25); }
      `}</style>

      {/* Top banner */}
      <div className="relative overflow-hidden px-4 pt-6 pb-4 lg:px-8 lg:pt-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-violet-600/20 blur-3xl" />
        </div>

        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10"
        >
          <p className="text-indigo-300 text-sm font-semibold tracking-widest uppercase mb-1">
            LingoLive — Zona Teen
          </p>
          <h1 className="font-display font-extrabold text-white text-2xl lg:text-3xl leading-tight">
            {loading ? 'Bem-vindo!' : displayName ? `Olá, ${displayName}! 👋` : 'Bem-vindo de volta!'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">Continua a tua jornada linguística</p>
        </motion.div>
      </div>

      <div className="px-4 pb-10 lg:px-8 max-w-4xl mx-auto space-y-4">

        {/* Stats row */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { icon: <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />, value: loading ? '—' : `${stats.xp}`, label: 'XP Total', color: '#FBBF24' },
            { icon: <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />, value: loading ? '—' : `${stats.streak}d`, label: 'Sequência', color: '#FB923C' },
            { icon: <Zap className="w-4 h-4 text-indigo-400 fill-indigo-300" />, value: loading ? '—' : `Nv ${stats.level}`, label: 'Nível', color: '#818CF8' },
          ].map(s => (
            <motion.div
              key={s.label}
              whileHover={{ scale: 1.03 }}
              className="teen-card rounded-2xl p-3 flex flex-col items-center gap-1.5 teen-glow"
            >
              {s.icon}
              <span className="font-display font-extrabold text-white text-lg leading-none">{s.value}</span>
              <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wide">{s.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Level progress */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="teen-card rounded-2xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span className="font-display font-bold text-white text-sm">Progresso — Nível {stats.level}</span>
            </div>
            <span className="text-indigo-300 text-xs font-semibold">{stats.xp % 1000}/1000 XP</span>
          </div>
          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelProgress}%` }}
              transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #6366F1, #A78BFA)' }}
            />
          </div>
          <p className="text-slate-500 text-xs mt-1.5">
            {Math.round(1000 - (stats.xp % 1000))} XP para o próximo nível
          </p>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setView('practice')}
            className="rounded-2xl p-4 flex items-center gap-3 text-left"
            style={{ background: 'linear-gradient(135deg, #6366F1, #7C3AED)', boxShadow: '0 6px 0 #4338CA, 0 10px 30px rgba(99,102,241,0.4)' }}
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-display font-extrabold text-white text-sm leading-tight">Praticar</p>
              <p className="text-indigo-200 text-xs">Falar com IA</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setView('ebook-student-dashboard')}
            className="rounded-2xl p-4 flex items-center gap-3 text-left"
            style={{ background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', boxShadow: '0 6px 0 #0369A1, 0 10px 30px rgba(14,165,233,0.35)' }}
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-display font-extrabold text-white text-sm leading-tight">Os Meus</p>
              <p className="text-sky-200 text-xs">Livros & E-books</p>
            </div>
          </motion.button>
        </motion.div>

        {/* Daily challenges */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="teen-card rounded-2xl overflow-hidden"
        >
          <div className="px-4 pt-4 pb-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <span className="font-display font-bold text-white text-sm">Desafios de hoje</span>
            </div>
            <span className="text-indigo-300 text-xs font-semibold">
              {challenges.filter(c => c.done).length}/{challenges.length} feitos
            </span>
          </div>
          <AnimatePresence>
            {challenges.map((ch, i) => (
              <motion.div
                key={ch.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.06 }}
                className={`flex items-center gap-3 px-4 py-3.5 border-b border-white/5 last:border-0 ${ch.done ? 'opacity-50' : 'cursor-pointer'}`}
                onClick={() => !ch.done && setView(ch.id === 1 ? 'practice' : ch.id === 2 ? 'ebook-student-dashboard' : 'ebook-flashcards')}
              >
                <span className="text-2xl">{ch.emoji}</span>
                <div className="flex-1">
                  <p className={`font-display font-bold text-sm ${ch.done ? 'line-through text-slate-500' : 'text-white'}`}>
                    {ch.title}
                  </p>
                  <p className="text-slate-400 text-xs">{ch.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 text-xs font-bold">+{ch.xp} XP</span>
                  {ch.done
                    ? <span className="text-emerald-400 text-sm">✓</span>
                    : <Play className="w-4 h-4 text-indigo-400" />
                  }
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Weekly goal */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="teen-card rounded-2xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-violet-400" />
              <span className="font-display font-bold text-white text-sm">Objetivo semanal</span>
            </div>
            <span className="text-violet-300 text-xs font-semibold">
              {stats.weeklyProgress}/{stats.weeklyGoal} XP
            </span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (stats.weeklyProgress / stats.weeklyGoal) * 100)}%` }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #8B5CF6, #C4B5FD)' }}
            />
          </div>
        </motion.div>

        {/* Bottom nav row */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { emoji: '🏆', label: 'Ranking', view: 'ranking' },
            { emoji: '⭐', label: 'Conquistas', view: 'ebook-achievements' },
            { emoji: '🗺️', label: 'Caminho', view: 'learning-path' },
          ].map(item => (
            <motion.button
              key={item.label}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView(item.view)}
              className="teen-card rounded-2xl py-4 flex flex-col items-center gap-2"
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="font-display font-bold text-slate-300 text-xs">{item.label}</span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
            </motion.button>
          ))}
        </motion.div>

      </div>
    </div>
  );
};
