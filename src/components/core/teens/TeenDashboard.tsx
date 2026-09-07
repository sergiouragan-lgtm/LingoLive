import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Flame, BookOpen, Mic, Brain, Trophy, ChevronRight, Home, Target, User, Music, Globe, Zap, TrendingUp, Clock, Check, Lock } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
interface TeenDashboardProps {
  studentName?: string;
  setView?: (view: string) => void;
  streakDays?: number;
  xpTotal?: number;
  stars?: number;
}

// ── Data ───────────────────────────────────────────────────────────────────
const TEEN_ACTIVITIES = [
  { id: 1, title: 'Vocabulário', subtitle: 'Aprende novas palavras', emoji: '🔤', color: '#ede9fe', accent: '#7c3aed', view: 'vocab', xp: '+15 XP' },
  { id: 2, title: 'Pronúncia', subtitle: 'Treina o teu sotaque', emoji: '🎙️', color: '#dbeafe', accent: '#2563eb', view: 'pronunciation', xp: '+20 XP' },
  { id: 3, title: 'IA Tutor', subtitle: 'Conversa em inglês', emoji: '🤖', color: '#dcfce7', accent: '#16a34a', view: 'practice', xp: '+30 XP' },
  { id: 4, title: 'Quiz Rápido', subtitle: 'Testa o teu nível', emoji: '⚡', color: '#fef3c7', accent: '#d97706', view: 'quiz', xp: '+25 XP' },
];

const CHALLENGES = [
  { id: 1, title: 'Vocabulário diário', desc: '10 palavras novas', icon: '📝', xp: 20, done: false },
  { id: 2, title: 'Sessão de prática', desc: '15 min de conversação', icon: '💬', xp: 30, done: true },
  { id: 3, title: 'Quiz relâmpago', desc: '5 perguntas sem erros', icon: '⚡', xp: 25, done: false },
];

const LEADERBOARD = [
  { rank: 1, name: 'Sofia M.', xp: 3200, avatar: '👩‍🎤' },
  { rank: 2, name: 'João R.', xp: 2950, avatar: '🧑‍💻' },
  { rank: 3, name: 'Tu', xp: 1250, avatar: '⭐', isMe: true },
  { rank: 4, name: 'Lara K.', xp: 980, avatar: '👧' },
];

const LEVELS = [
  { name: 'A1 Iniciante', min: 0, max: 500, color: '#94a3b8' },
  { name: 'A2 Básico', min: 500, max: 1200, color: '#60a5fa' },
  { name: 'B1 Intermédio', min: 1200, max: 2500, color: '#a78bfa' },
  { name: 'B2 Avançado', min: 2500, max: 5000, color: '#f59e0b' },
  { name: 'C1 Expert', min: 5000, max: 10000, color: '#f43f5e' },
];

// ── Study Time Selector ────────────────────────────────────────────────────
const studyTimeOptions = [
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
];

// ── Main Component ─────────────────────────────────────────────────────────
const TeenDashboard: React.FC<TeenDashboardProps> = ({
  studentName = 'Estudante',
  setView,
  streakDays = 7,
  xpTotal = 1250,
  stars = 68,
}) => {
  const [tab, setTab] = useState<'home' | 'progress' | 'ranking'>('home');
  const [studyGoal, setStudyGoal] = useState(15);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState<number[]>([2]);

  const firstName = studentName.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const currentLevel = LEVELS.find(l => xpTotal >= l.min && xpTotal < l.max) || LEVELS[0];
  const xpInLevel = xpTotal - currentLevel.min;
  const xpNeeded = currentLevel.max - currentLevel.min;
  const levelProgress = Math.min((xpInLevel / xpNeeded) * 100, 100);

  const toggleChallenge = (id: number) => {
    setCompletedChallenges(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)' }}>

      {/* ── Header ── */}
      <header className="px-5 pt-8 pb-5 relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10" style={{ background: '#a78bfa' }} />
        <div className="absolute top-16 -left-6 w-20 h-20 rounded-full opacity-10" style={{ background: '#c4b5fd' }} />

        <div className="flex items-start justify-between relative z-10">
          <div>
            <p className="text-purple-300 text-sm font-medium">{greeting} 👋</p>
            <h1 className="text-2xl font-black text-white mt-0.5">{firstName}</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: currentLevel.color + '30', color: currentLevel.color }}>
                {currentLevel.name}
              </span>
            </div>
          </div>
          <button
            onClick={() => setView?.('profile')}
            className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors"
          >
            <User className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* XP + streak bar */}
        <div className="mt-5 bg-white/10 backdrop-blur rounded-2xl p-4 flex items-center gap-4 border border-white/10">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" fill="currentColor" />
            <div>
              <p className="text-white font-black text-lg leading-none">{streakDays}</p>
              <p className="text-purple-300 text-xs">dias</p>
            </div>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="flex-1">
            <div className="flex justify-between mb-1.5">
              <span className="text-purple-300 text-xs">XP {xpInLevel} / {xpNeeded}</span>
              <span className="text-white text-xs font-bold">{Math.round(levelProgress)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${currentLevel.color}, ${currentLevel.color}aa)` }}
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
            <span className="text-white font-black text-sm">{stars}</span>
          </div>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div className="px-5 flex gap-2 mb-4">
        {[
          { id: 'home', label: 'Início', icon: <Home className="w-4 h-4" /> },
          { id: 'progress', label: 'Progresso', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'ranking', label: 'Ranking', icon: <Trophy className="w-4 h-4" /> },
        ].map(t => (
          <motion.button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === t.id
                ? 'bg-white text-purple-700 shadow-lg'
                : 'bg-white/10 text-purple-200 hover:bg-white/20'
            }`}
          >
            {t.icon}{t.label}
          </motion.button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-5 pb-8 flex flex-col gap-4">
        <AnimatePresence mode="wait">

          {/* HOME TAB */}
          {tab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">

              {/* Study goal banner */}
              <motion.div
                className="rounded-2xl p-4 flex items-center justify-between border border-white/10"
                style={{ background: 'rgba(139,92,246,0.2)', backdropFilter: 'blur(8px)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/30 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-300" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Meta de hoje</p>
                    <p className="text-purple-300 text-xs">{studyGoal} min de estudo</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGoalPicker(!showGoalPicker)}
                  className="px-3 py-1.5 bg-purple-500/40 rounded-xl text-purple-200 text-xs font-bold hover:bg-purple-500/60 transition-colors cursor-pointer"
                >
                  Alterar
                </button>
              </motion.div>

              {/* Goal picker */}
              <AnimatePresence>
                {showGoalPicker && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="flex gap-2 overflow-hidden"
                  >
                    {studyTimeOptions.map(opt => (
                      <motion.button
                        key={opt.value}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setStudyGoal(opt.value); setShowGoalPicker(false); }}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                          studyGoal === opt.value ? 'bg-purple-500 text-white' : 'bg-white/10 text-purple-200 hover:bg-white/20'
                        }`}
                      >{opt.label}</motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Activities grid */}
              <div>
                <h3 className="text-white font-black mb-3 text-base">Continua a aprender 🚀</h3>
                <div className="grid grid-cols-2 gap-3">
                  {TEEN_ACTIVITIES.map((act, i) => (
                    <motion.button
                      key={act.id}
                      onClick={() => setView?.(act.view)}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="rounded-2xl p-4 flex flex-col gap-2 text-left shadow-lg cursor-pointer"
                      style={{ background: act.color }}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-3xl">{act.emoji}</span>
                        <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: act.accent + '20', color: act.accent }}>
                          {act.xp}
                        </span>
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm">{act.title}</p>
                        <p className="text-slate-500 text-xs">{act.subtitle}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* E-books */}
              <motion.button
                onClick={() => setView?.('ebook-student-dashboard')}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-2xl p-4 flex items-center gap-4 cursor-pointer border border-white/10"
                style={{ background: 'rgba(255,255,255,0.07)' }}
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-indigo-300" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-bold text-sm">Biblioteca de E-Books</p>
                  <p className="text-purple-300 text-xs">12 livros disponíveis para ti</p>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-400" />
              </motion.button>

              {/* Daily challenges */}
              <div className="rounded-2xl overflow-hidden border border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" fill="currentColor" />
                  <h3 className="text-white font-black text-sm">Desafios diários</h3>
                  <span className="ml-auto text-xs text-purple-300 font-semibold">{completedChallenges.length}/{CHALLENGES.length}</span>
                </div>
                {CHALLENGES.map(c => (
                  <motion.button
                    key={c.id}
                    onClick={() => toggleChallenge(c.id)}
                    whileTap={{ scale: 0.99 }}
                    className="w-full flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${
                      completedChallenges.includes(c.id) ? 'bg-green-500 border-green-500' : 'border-white/20 bg-white/5'
                    }`}>
                      {completedChallenges.includes(c.id)
                        ? <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        : <span className="text-sm">{c.icon}</span>
                      }
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-semibold ${completedChallenges.includes(c.id) ? 'line-through text-white/40' : 'text-white'}`}>{c.title}</p>
                      <p className="text-xs text-purple-300">{c.desc}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${completedChallenges.includes(c.id) ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      +{c.xp} XP
                    </span>
                  </motion.button>
                ))}
              </div>

            </motion.div>
          )}

          {/* PROGRESS TAB */}
          {tab === 'progress' && (
            <motion.div key="progress" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">

              {/* Level path */}
              <div className="rounded-2xl p-5 border border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <h3 className="text-white font-black mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-purple-400" />
                  Caminho de aprendizagem
                </h3>
                {LEVELS.map((l, i) => {
                  const reached = xpTotal >= l.min;
                  const active = xpTotal >= l.min && xpTotal < l.max;
                  return (
                    <div key={i} className="flex items-center gap-3 mb-3 last:mb-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 ${reached ? 'border-transparent' : 'border-white/20'}`}
                        style={reached ? { background: l.color } : { background: 'rgba(255,255,255,0.05)' }}>
                        {reached ? <Check className="w-4 h-4 text-white" strokeWidth={3} /> : <Lock className="w-3 h-3 text-white/30" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-bold ${reached ? 'text-white' : 'text-white/40'}`}>{l.name}</p>
                          <p className={`text-xs ${reached ? 'text-purple-300' : 'text-white/20'}`}>{l.max} XP</p>
                        </div>
                        {active && (
                          <div className="mt-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div className="h-full rounded-full" style={{ background: l.color }}
                              initial={{ width: 0 }} animate={{ width: `${levelProgress}%` }} transition={{ duration: 1 }} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Dias de streak', value: `${streakDays} 🔥`, color: '#f97316' },
                  { label: 'XP total', value: `${xpTotal} ⭐`, color: '#a78bfa' },
                  { label: 'Palavras aprendidas', value: '148 📝', color: '#34d399' },
                  { label: 'Tempo de estudo', value: '4h 20m ⏱️', color: '#60a5fa' },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-2xl p-4 border border-white/10"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <p className="text-white font-black text-xl">{s.value}</p>
                    <p className="text-purple-300 text-xs mt-1">{s.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Weekly activity */}
              <div className="rounded-2xl p-4 border border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  Esta semana
                </h3>
                <div className="flex gap-2 items-end h-20">
                  {[40, 70, 55, 90, 30, 80, 65].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <motion.div
                        className="w-full rounded-t-lg"
                        style={{ background: i === 6 ? '#a78bfa' : 'rgba(167,139,250,0.3)', height: `${h}%` }}
                        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                        transition={{ delay: i * 0.06, origin: 'bottom' }}
                      />
                      <span className="text-xs text-purple-400">{['S','T','Q','Q','S','S','D'][i]}</span>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

          {/* RANKING TAB */}
          {tab === 'ranking' && (
            <motion.div key="ranking" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">

              <div className="text-center mb-2">
                <h2 className="text-white font-black text-xl">Tabela de Líderes 🏆</h2>
                <p className="text-purple-300 text-sm">Semana atual</p>
              </div>

              {/* Top 3 podium */}
              <div className="flex items-end justify-center gap-3 mb-2">
                {[LEADERBOARD[1], LEADERBOARD[0], LEADERBOARD[2]].map((p, i) => {
                  const heights = ['h-24', 'h-32', 'h-20'];
                  const crowns = ['🥈', '🥇', '🥉'];
                  const colors = ['rgba(148,163,184,0.2)', 'rgba(251,191,36,0.2)', 'rgba(180,83,9,0.15)'];
                  return (
                    <motion.div
                      key={p.rank}
                      initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: i * 0.15 }}
                      className={`flex flex-col items-center gap-2 rounded-2xl p-3 ${heights[i]} justify-end`}
                      style={{ background: colors[i], border: '1px solid rgba(255,255,255,0.1)', minWidth: 80 }}
                    >
                      <span className="text-xl">{crowns[i]}</span>
                      <span className="text-2xl">{p.avatar}</span>
                      <p className={`text-xs font-bold text-center ${p.isMe ? 'text-yellow-300' : 'text-white'}`}>{p.name}</p>
                      <p className="text-purple-300 text-xs">{p.xp} XP</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Full list */}
              <div className="rounded-2xl overflow-hidden border border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {LEADERBOARD.map((p, i) => (
                  <motion.div
                    key={p.rank}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 ${p.isMe ? 'bg-purple-500/20' : ''}`}
                  >
                    <span className={`w-6 text-sm font-black text-center ${p.rank <= 3 ? 'text-yellow-400' : 'text-purple-300'}`}>
                      {p.rank <= 3 ? ['🥇','🥈','🥉'][p.rank - 1] : p.rank}
                    </span>
                    <span className="text-xl">{p.avatar}</span>
                    <p className={`flex-1 text-sm font-bold ${p.isMe ? 'text-yellow-300' : 'text-white'}`}>
                      {p.name} {p.isMe && <span className="text-xs text-purple-300">(Tu)</span>}
                    </p>
                    <p className="text-purple-300 text-sm font-semibold">{p.xp} XP</p>
                  </motion.div>
                ))}
              </div>

              {/* Motivational */}
              <motion.div
                className="rounded-2xl p-4 border border-purple-500/30 bg-purple-500/10 text-center"
                animate={{ borderColor: ['rgba(168,85,247,0.3)', 'rgba(168,85,247,0.6)', 'rgba(168,85,247,0.3)'] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                <p className="text-white font-bold text-sm">Estás a 1700 XP do 2.º lugar! 💪</p>
                <p className="text-purple-300 text-xs mt-1">Continua a estudar todos os dias!</p>
              </motion.div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default TeenDashboard;
