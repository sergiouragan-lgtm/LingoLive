import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Lock, Trophy, BookOpen, Mic, Zap, ChevronRight, Home, Map, Award, Settings, X, Check } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
interface KidsDashboardProps {
  studentName?: string;
  setView?: (view: string) => void;
  streakDays?: number;
  xpTotal?: number;
  stars?: number;
}

interface Mission {
  id: number;
  title: string;
  desc: string;
  icon: string;
  status: 'completed' | 'current' | 'locked';
  xp: number;
  color: string;
}

interface Activity {
  id: number;
  title: string;
  emoji: string;
  color: string;
  view: string;
}

// ── Data ───────────────────────────────────────────────────────────────────
const MISSIONS: Mission[] = [
  { id: 1, title: 'Floresta Mágica', desc: 'Aprende as primeiras palavras!', icon: '🌲', status: 'completed', xp: 50, color: '#4ade80' },
  { id: 2, title: 'Rio da Aventura', desc: 'Descobre sons e letras!', icon: '🌊', status: 'completed', xp: 80, color: '#60a5fa' },
  { id: 3, title: 'Montanha do Saber', desc: 'Conta e aprende números!', icon: '🏔️', status: 'current', xp: 120, color: '#f59e0b' },
  { id: 4, title: 'Caverna dos Tesouros', desc: 'Desbloqueia histórias!', icon: '💎', status: 'locked', xp: 200, color: '#a78bfa' },
  { id: 5, title: 'Castelo das Línguas', desc: 'Torna-te um mestre!', icon: '🏰', status: 'locked', xp: 500, color: '#f43f5e' },
];

const ACTIVITIES: Activity[] = [
  { id: 1, title: 'Histórias', emoji: '📚', color: '#fef3c7', view: 'ebook-student-dashboard' },
  { id: 2, title: 'Jogos', emoji: '🎮', color: '#dbeafe', view: 'jogos' },
  { id: 3, title: 'Pronúncia', emoji: '🎤', color: '#dcfce7', view: 'pronunciation' },
  { id: 4, title: 'Quiz', emoji: '🧠', color: '#fce7f3', view: 'quiz' },
];

const REWARDS = ['⭐', '🏆', '🎖️', '💎', '🦁', '🌟'];

// ── Parent PIN Lock ────────────────────────────────────────────────────────
const ParentPinModal: React.FC<{ onClose: () => void; onSuccess: () => void; onNavigate?: (v: string) => void }> = ({ onClose, onSuccess, onNavigate }) => {
  const [pin, setPin] = useState('');
  const [mode, setMode] = useState<'enter' | 'create' | 'confirm' | 'success'>(() =>
    localStorage.getItem('kids_parent_pin') ? 'enter' : 'create'
  );
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState('');

  const handleDigit = (d: string) => {
    if (pin.length < 4) {
      const next = pin + d;
      setPin(next);
      if (next.length === 4) handleSubmit(next);
    }
  };

  const handleSubmit = (p: string) => {
    const stored = localStorage.getItem('kids_parent_pin');
    if (mode === 'enter') {
      if (p === stored) { setMode('success'); setTimeout(onSuccess, 800); }
      else { setError('PIN incorreto, tenta novamente'); setPin(''); }
    } else if (mode === 'create') {
      setNewPin(p); setMode('confirm'); setPin('');
    } else if (mode === 'confirm') {
      if (p === newPin) {
        localStorage.setItem('kids_parent_pin', p);
        setMode('success');
        setTimeout(onSuccess, 800);
      } else { setError('PINs não coincidem'); setPin(''); setMode('create'); setNewPin(''); }
    }
  };

  const handleBackspace = () => setPin(p => p.slice(0, -1));

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-white rounded-3xl p-8 w-80 flex flex-col items-center gap-4 shadow-2xl"
        initial={{ scale: 0.8, y: 40 }} animate={{ scale: 1, y: 0 }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        {mode === 'success' ? (
          <motion.div className="flex flex-col items-center gap-3" initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <div className="text-5xl">⭐</div>
            <p className="font-bold text-purple-700 text-lg">PIN criado com sucesso!</p>
          </motion.div>
        ) : (
          <>
            <div className="text-5xl">{mode === 'enter' ? '🔒' : '🔑'}</div>
            <p className="font-black text-slate-800 text-center">
              {mode === 'enter' ? 'Só para os pais' : mode === 'create' ? 'Criar PIN secreto' : 'Confirmar PIN'}
            </p>
            <p className="text-sm text-slate-500 text-center">
              {mode === 'enter' ? 'Insere o PIN para aceder às definições' : mode === 'create' ? 'Escolhe 4 números secretos' : 'Repete o PIN'}
            </p>

            {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}

            <div className="flex gap-3 my-2">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${i < pin.length ? 'bg-purple-600 border-purple-600' : 'border-slate-300'}`} />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 w-full">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <motion.button
                  key={n} whileTap={{ scale: 0.9 }}
                  onClick={() => handleDigit(String(n))}
                  className="h-12 rounded-2xl bg-slate-100 text-slate-800 font-bold text-xl hover:bg-purple-100 transition-colors"
                >{n}</motion.button>
              ))}
              <div />
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDigit('0')}
                className="h-12 rounded-2xl bg-slate-100 text-slate-800 font-bold text-xl hover:bg-purple-100 transition-colors">0</motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={handleBackspace}
                className="h-12 rounded-2xl bg-slate-100 text-slate-500 font-bold text-lg hover:bg-red-50 transition-colors">⌫</motion.button>
            </div>

            <button onClick={() => onNavigate?.('area-pais')} className="text-xs text-purple-500 underline mt-1 cursor-pointer">
              Ir para Portal dos Pais
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

// ── Mission Map Node ───────────────────────────────────────────────────────
const MissionNode: React.FC<{ mission: Mission; index: number; onPlay: () => void }> = ({ mission, index, onPlay }) => {
  const isLeft = index % 2 === 0;
  return (
    <div className={`flex items-center gap-4 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
      <motion.div
        className="relative"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: index * 0.15, type: 'spring', stiffness: 200 }}
      >
        {mission.status === 'current' && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ background: mission.color }}
          />
        )}
        <motion.button
          onClick={mission.status !== 'locked' ? onPlay : undefined}
          whileHover={mission.status !== 'locked' ? { scale: 1.1 } : {}}
          whileTap={mission.status !== 'locked' ? { scale: 0.95 } : {}}
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-xl relative z-10 transition-all"
          style={{
            background: mission.status === 'locked' ? '#e2e8f0' : `linear-gradient(135deg, ${mission.color}dd, ${mission.color})`,
            filter: mission.status === 'locked' ? 'grayscale(1)' : 'none',
            cursor: mission.status === 'locked' ? 'not-allowed' : 'pointer',
          }}
        >
          {mission.status === 'locked' ? <Lock className="w-8 h-8 text-slate-400" /> : mission.icon}
          {mission.status === 'completed' && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
          )}
        </motion.button>
      </motion.div>

      <motion.div
        className="flex-1 max-w-[160px]"
        initial={{ x: isLeft ? -20 : 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: index * 0.15 + 0.1 }}
      >
        <div className="bg-white rounded-2xl p-3 shadow-md border-2" style={{ borderColor: mission.status === 'locked' ? '#e2e8f0' : mission.color + '60' }}>
          <p className="font-black text-slate-800 text-sm">{mission.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{mission.desc}</p>
          {mission.status !== 'locked' && (
            <div className="flex items-center gap-1 mt-1.5">
              <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
              <span className="text-xs font-bold text-yellow-600">{mission.xp} XP</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
const KidsDashboard: React.FC<KidsDashboardProps> = ({
  studentName = 'Explorador',
  setView,
  streakDays = 5,
  xpTotal = 1250,
  stars = 42,
}) => {
  const [tab, setTab] = useState<'home' | 'map' | 'awards'>('home');
  const [showPinModal, setShowPinModal] = useState(false);
  const [celebrateReward, setCelebrateReward] = useState('');
  const [dailyDone, setDailyDone] = useState<number[]>([]);

  const firstName = studentName.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  useEffect(() => {
    const stored = localStorage.getItem('kids_daily_done');
    if (stored) setDailyDone(JSON.parse(stored));
  }, []);

  const markDone = (id: number) => {
    const next = dailyDone.includes(id) ? dailyDone : [...dailyDone, id];
    setDailyDone(next);
    localStorage.setItem('kids_daily_done', JSON.stringify(next));
    const reward = REWARDS[Math.floor(Math.random() * REWARDS.length)];
    setCelebrateReward(reward);
    setTimeout(() => setCelebrateReward(''), 1800);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #bfdbfe 0%, #dbeafe 30%, #fef3c7 100%)' }}>

      {/* ── Celebration particle ── */}
      <AnimatePresence>
        {celebrateReward && (
          <motion.div
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-8xl"
              initial={{ scale: 0, y: 0 }} animate={{ scale: [0, 1.5, 1], y: -80 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            >{celebrateReward}</motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PIN Modal ── */}
      <AnimatePresence>
        {showPinModal && (
          <ParentPinModal
            onClose={() => setShowPinModal(false)}
            onSuccess={() => { setShowPinModal(false); setView?.('area-pais'); }}
            onNavigate={setView}
          />
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sky-700 font-semibold text-sm">{greeting}! 👋</p>
            <h1 className="text-2xl font-black text-sky-900">{firstName} 🦁</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white/80 backdrop-blur rounded-2xl px-3 py-2 flex items-center gap-1.5 shadow">
              <span className="text-lg">🔥</span>
              <span className="font-black text-orange-600 text-sm">{streakDays}</span>
            </div>
            <button
              onClick={() => setShowPinModal(true)}
              className="bg-white/80 backdrop-blur rounded-2xl p-2 shadow hover:bg-white transition-colors"
            >
              <Settings className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* XP bar */}
        <div className="mt-4 bg-white/60 rounded-2xl p-3 flex items-center gap-3">
          <Star className="w-6 h-6 text-yellow-400 shrink-0" fill="currentColor" />
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-xs font-bold text-sky-900">XP Total</span>
              <span className="text-xs font-black text-yellow-600">{xpTotal} / 2000</span>
            </div>
            <div className="h-3 bg-sky-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #fbbf24, #f59e0b)' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((xpTotal / 2000) * 100, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1 bg-yellow-100 rounded-xl px-2 py-1">
            <span className="text-sm">⭐</span>
            <span className="text-xs font-black text-yellow-700">{stars}</span>
          </div>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div className="px-5 flex gap-2 mb-4">
        {[
          { id: 'home', label: 'Início', icon: <Home className="w-4 h-4" /> },
          { id: 'map', label: 'Mapa', icon: <Map className="w-4 h-4" /> },
          { id: 'awards', label: 'Troféus', icon: <Award className="w-4 h-4" /> },
        ].map(t => (
          <motion.button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-bold transition-all ${
              tab === t.id
                ? 'bg-white shadow-md text-sky-700'
                : 'bg-white/40 text-sky-600 hover:bg-white/60'
            }`}
          >
            {t.icon}{t.label}
          </motion.button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-5 pb-24">
        <AnimatePresence mode="wait">

          {/* HOME TAB */}
          {tab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col gap-4">

              {/* Daily Mission */}
              <motion.div
                className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-3xl p-5 shadow-xl text-white relative overflow-hidden"
                whileHover={{ scale: 1.01 }}
              >
                <div className="absolute -right-4 -top-4 text-7xl opacity-30 select-none">🦁</div>
                <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">Missão do Dia</p>
                <h2 className="text-xl font-black mb-1">Ajuda o Leo a contar!</h2>
                <p className="text-sm opacity-90 mb-3">Completa 3 lições de números hoje 🔢</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-white/30 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-white rounded-full" initial={{ width: 0 }} animate={{ width: '40%' }} transition={{ duration: 1 }} />
                  </div>
                  <span className="text-xs font-black">1/3</span>
                </div>
              </motion.div>

              {/* Quick activities */}
              <div>
                <h3 className="font-black text-sky-900 mb-3 text-base">O que vais explorar hoje?</h3>
                <div className="grid grid-cols-2 gap-3">
                  {ACTIVITIES.map((act, i) => (
                    <motion.button
                      key={act.id}
                      onClick={() => setView?.(act.view)}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="rounded-3xl p-4 flex flex-col items-center gap-2 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                      style={{ background: act.color }}
                    >
                      <span className="text-4xl">{act.emoji}</span>
                      <span className="font-black text-slate-800 text-sm">{act.title}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Daily checklist */}
              <div className="bg-white rounded-3xl p-5 shadow-md">
                <h3 className="font-black text-slate-800 mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" fill="currentColor" />
                  Desafios de hoje
                </h3>
                {[
                  { id: 1, label: 'Ouve 1 história', emoji: '📖' },
                  { id: 2, label: 'Faz 5 perguntas do quiz', emoji: '❓' },
                  { id: 3, label: 'Pratica pronúncia', emoji: '🎙️' },
                ].map(task => (
                  <motion.button
                    key={task.id}
                    onClick={() => markDone(task.id)}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center gap-3 py-3 border-b border-slate-100 last:border-0 cursor-pointer"
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                      dailyDone.includes(task.id) ? 'bg-green-400 border-green-400' : 'border-slate-300'
                    }`}>
                      {dailyDone.includes(task.id) && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-lg">{task.emoji}</span>
                    <span className={`text-sm font-semibold flex-1 text-left ${dailyDone.includes(task.id) ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {task.label}
                    </span>
                    <Star className={`w-4 h-4 ${dailyDone.includes(task.id) ? 'text-yellow-400' : 'text-slate-200'}`} fill="currentColor" />
                  </motion.button>
                ))}
              </div>

              {/* Streak calendar strip */}
              <div className="bg-white rounded-3xl p-4 shadow-md">
                <h3 className="font-black text-slate-800 mb-3 flex items-center gap-2 text-sm">
                  <span className="text-lg">🔥</span> Sequência de {streakDays} dias!
                </h3>
                <div className="flex gap-2">
                  {['S','T','Q','Q','S','S','D'].map((d, i) => {
                    const done = i < streakDays % 7;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs text-slate-400 font-semibold">{d}</span>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${done ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          {done ? '🔥' : '○'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* MAP TAB */}
          {tab === 'map' && (
            <motion.div key="map" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col gap-5">
              <div className="text-center mb-2">
                <p className="text-sky-700 font-semibold text-sm">A tua jornada de aprendizagem</p>
                <h2 className="text-xl font-black text-sky-900">Mapa da Aventura 🗺️</h2>
              </div>
              <div className="flex flex-col gap-4">
                {MISSIONS.map((m, i) => (
                  <MissionNode key={m.id} mission={m} index={i} onPlay={() => setView?.('practice')} />
                ))}
              </div>
            </motion.div>
          )}

          {/* AWARDS TAB */}
          {tab === 'awards' && (
            <motion.div key="awards" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col gap-4">
              <div className="text-center mb-2">
                <h2 className="text-xl font-black text-sky-900">Os teus Troféus 🏆</h2>
                <p className="text-sky-700 text-sm">Continua a aprender para ganhar mais!</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: '🌟', title: 'Primeira lição', unlocked: true },
                  { icon: '🔥', title: '5 dias seguidos', unlocked: true },
                  { icon: '📚', title: '3 histórias lidas', unlocked: true },
                  { icon: '🎯', title: 'Quiz perfeito', unlocked: false },
                  { icon: '🏆', title: 'Campeão', unlocked: false },
                  { icon: '💎', title: 'Nível máximo', unlocked: false },
                ].map((a, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ delay: i * 0.08, type: 'spring' }}
                    className={`rounded-2xl p-4 flex flex-col items-center gap-2 ${a.unlocked ? 'bg-gradient-to-b from-yellow-50 to-amber-50 shadow-md border border-yellow-200' : 'bg-slate-100'}`}
                  >
                    <span className={`text-4xl ${!a.unlocked && 'grayscale opacity-40'}`}>{a.icon}</span>
                    <p className={`text-xs font-bold text-center ${a.unlocked ? 'text-amber-800' : 'text-slate-400'}`}>{a.title}</p>
                    {!a.unlocked && <Lock className="w-3 h-3 text-slate-400" />}
                  </motion.div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-3xl p-5 text-white shadow-xl">
                <h3 className="font-black text-lg mb-1">Nível {Math.floor(xpTotal / 400) + 1} 🚀</h3>
                <p className="text-sm opacity-90 mb-3">Falta {400 - (xpTotal % 400)} XP para o próximo nível</p>
                <div className="h-3 bg-white/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((xpTotal % 400) / 400) * 100}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Bottom Nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-sky-100 px-6 py-3 flex justify-around items-center shadow-xl">
        {[
          { id: 'home', icon: <Home className="w-6 h-6" />, label: 'Início' },
          { id: 'map', icon: <Map className="w-6 h-6" />, label: 'Mapa' },
          { id: 'awards', icon: <Trophy className="w-6 h-6" />, label: 'Troféus' },
        ].map(n => (
          <button
            key={n.id}
            onClick={() => setTab(n.id as typeof tab)}
            className={`flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${tab === n.id ? 'text-sky-600' : 'text-slate-400'}`}
          >
            {n.icon}
            <span className="text-xs font-semibold">{n.label}</span>
            {tab === n.id && <motion.div layoutId="tab-dot" className="w-1 h-1 bg-sky-500 rounded-full" />}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default KidsDashboard;
