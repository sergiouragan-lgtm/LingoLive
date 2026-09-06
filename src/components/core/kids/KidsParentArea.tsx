import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, Clock, Globe, BarChart2, Plus, Settings, Star, Flame, Zap, Shield, User } from 'lucide-react';

interface KidsParentAreaProps {
  onClose: () => void;
}

type ParentTab = 'overview' | 'progress' | 'settings';

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  emoji: string;
  level: number;
  xp: number;
  streak: number;
  language: string;
  dailyLimit: number;
}

const defaultChild: ChildProfile = {
  id: 'c1',
  name: 'O Teu Explorador',
  age: 8,
  emoji: '🦁',
  level: 5,
  xp: 1250,
  streak: 7,
  language: 'English',
  dailyLimit: 30,
};

function StatPill({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1 bg-white rounded-2xl py-3 px-2 shadow-sm border border-gray-100">
      <div className="flex items-center gap-1" style={{ color }}>
        {icon}
        <span className="font-display font-extrabold text-lg" style={{ color }}>{value}</span>
      </div>
      <span className="text-gray-400 text-[10px] font-semibold uppercase tracking-wide">{label}</span>
    </div>
  );
}

function WeeklyBar({ day, pct }: { day: string; pct: number; key?: number }) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className="w-full bg-gray-100 rounded-full overflow-hidden" style={{ height: 60 }}>
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${pct}%` }}
          transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
          className="w-full rounded-full mt-auto"
          style={{ background: pct > 0 ? 'linear-gradient(180deg, #6366F1, #8B5CF6)' : 'transparent', marginTop: `${100 - pct}%` }}
        />
      </div>
      <span className="text-[10px] font-bold text-gray-400 uppercase">{day}</span>
    </div>
  );
}

export const KidsParentArea: React.FC<KidsParentAreaProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<ParentTab>('overview');
  const [child] = useState<ChildProfile>(defaultChild);
  const [dailyLimit, setDailyLimit] = useState(child.dailyLimit);
  const [showAddChild, setShowAddChild] = useState(false);

  const weekData = [
    { day: 'S', pct: 80 },
    { day: 'T', pct: 60 },
    { day: 'Q', pct: 90 },
    { day: 'Q', pct: 40 },
    { day: 'S', pct: 70 },
    { day: 'S', pct: 50 },
    { day: 'D', pct: 30 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="w-full max-w-sm bg-gray-50 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div
          className="px-5 pt-5 pb-4 flex items-center justify-between shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366F1, #7C3AED)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-display font-extrabold text-white text-base leading-tight">Área dos Pais</p>
              <p className="text-indigo-200 text-xs">Controlo parental</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-white border-b border-gray-100 shrink-0">
          {(['overview', 'progress', 'settings'] as ParentTab[]).map((tab) => {
            const labels: Record<ParentTab, string> = { overview: 'Resumo', progress: 'Progresso', settings: 'Definições' };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-3 text-xs font-display font-bold transition-colors"
                style={{
                  color: activeTab === tab ? '#6366F1' : '#9CA3AF',
                  borderBottom: activeTab === tab ? '2px solid #6366F1' : '2px solid transparent',
                }}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          <AnimatePresence mode="wait">

            {/* ── OVERVIEW ─────────────────────────────── */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-4"
              >
                {/* Child card */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{child.emoji}</div>
                    <div className="flex-1">
                      <p className="font-display font-extrabold text-slate-800 text-base">{child.name}</p>
                      <p className="text-gray-400 text-xs">{child.age} anos · {child.language}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-indigo-600 text-sm">Nível {child.level}</p>
                      <p className="text-gray-400 text-xs">{child.xp} XP total</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <StatPill icon={<Star className="w-4 h-4" />} value={`${child.xp}`} label="XP" color="#F59E0B" />
                    <StatPill icon={<Flame className="w-4 h-4" />} value={`${child.streak}d`} label="Sequência" color="#EF4444" />
                    <StatPill icon={<Zap className="w-4 h-4" />} value={`Nv${child.level}`} label="Nível" color="#6366F1" />
                  </div>
                </div>

                {/* Today summary */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <p className="font-display font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-indigo-500" /> Atividade de hoje
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-xs">Tempo de estudo</span>
                    <span className="font-display font-bold text-slate-700 text-sm">18 min / {dailyLimit} min</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (18 / dailyLimit) * 100)}%` }}
                      transition={{ delay: 0.4, duration: 0.7 }}
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }}
                    />
                  </div>
                  <div className="flex justify-between mt-3 text-xs text-gray-400">
                    <span>3 exercícios completos</span>
                    <span>+150 XP ganhos</span>
                  </div>
                </div>

                {/* Add child */}
                <button
                  onClick={() => setShowAddChild(true)}
                  className="w-full flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-dashed border-indigo-200 text-indigo-600"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                      <Plus className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="font-display font-bold text-sm">Adicionar criança</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-indigo-400" />
                </button>
              </motion.div>
            )}

            {/* ── PROGRESS ─────────────────────────────── */}
            {activeTab === 'progress' && (
              <motion.div
                key="progress"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-4"
              >
                {/* Weekly activity chart */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <p className="font-display font-bold text-slate-700 text-sm mb-4">Atividade semanal</p>
                  <div className="flex items-end gap-2" style={{ height: 80 }}>
                    {weekData.map((d, i) => (
                      <WeeklyBar key={i} day={d.day} pct={d.pct} />
                    ))}
                  </div>
                  <p className="text-center text-xs text-gray-400 mt-3">Minutos estudados por dia</p>
                </div>

                {/* Achievements */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <p className="font-display font-bold text-slate-700 text-sm mb-3">Conquistas recentes</p>
                  {[
                    { emoji: '🏆', title: 'Primeira semana', sub: 'Estudou 7 dias seguidos', date: 'Hoje' },
                    { emoji: '⭐', title: 'Vocabulário Iniciante', sub: '50 palavras aprendidas', date: 'Ontem' },
                    { emoji: '🚀', title: 'Missão cumprida', sub: 'Completou 10 exercícios', date: 'Há 3 dias' },
                  ].map((a) => (
                    <div key={a.title} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                      <span className="text-2xl">{a.emoji}</span>
                      <div className="flex-1">
                        <p className="font-display font-bold text-slate-700 text-sm">{a.title}</p>
                        <p className="text-gray-400 text-xs">{a.sub}</p>
                      </div>
                      <span className="text-gray-300 text-xs">{a.date}</span>
                    </div>
                  ))}
                </div>

                {/* Words learned */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-display font-bold text-slate-700 text-sm">Palavras aprendidas</p>
                    <span className="font-display font-extrabold text-indigo-600 text-lg">87</span>
                  </div>
                  <p className="text-gray-400 text-xs">Objectivo semanal: 100 palavras</p>
                  <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '87%' }}
                      transition={{ delay: 0.3, duration: 0.7 }}
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #10B981, #34D399)' }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── SETTINGS ─────────────────────────────── */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-4"
              >
                {/* Daily limit */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <p className="font-display font-bold text-slate-700 text-sm">Limite diário</p>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-sm">{dailyLimit} minutos / dia</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={120}
                    step={5}
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-gray-300 mt-1">
                    <span>5 min</span>
                    <span>120 min</span>
                  </div>
                </div>

                {/* Language */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-indigo-500" />
                    <p className="font-display font-bold text-slate-700 text-sm">Língua a aprender</p>
                  </div>
                  {['English', 'Español', 'Français', 'Deutsch'].map((lang) => (
                    <div
                      key={lang}
                      className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
                    >
                      <span className="text-slate-600 text-sm">{lang}</span>
                      {lang === child.language && (
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Activo</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Account */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-indigo-500" />
                    <p className="font-display font-bold text-slate-700 text-sm">Conta</p>
                  </div>
                  {[
                    { label: 'Alterar nome da criança', icon: <ChevronRight className="w-4 h-4 text-gray-300" /> },
                    { label: 'Alterar PIN parental', icon: <ChevronRight className="w-4 h-4 text-gray-300" /> },
                    { label: 'Notificações de progresso', icon: <ChevronRight className="w-4 h-4 text-gray-300" /> },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 cursor-pointer"
                    >
                      <span className="text-slate-600 text-sm">{row.label}</span>
                      {row.icon}
                    </div>
                  ))}
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl font-display font-extrabold text-white text-base"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #7C3AED)', boxShadow: '0 4px 0 #4F46E5' }}
                >
                  Guardar Definições
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Add child modal */}
      <AnimatePresence>
        {showAddChild && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/50"
            onClick={() => setShowAddChild(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-5">
                <div className="text-5xl mb-3">👶</div>
                <h3 className="font-display font-extrabold text-slate-800 text-xl">Adicionar Criança</h3>
                <p className="text-gray-400 text-sm mt-1">Cria um perfil para outra criança</p>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nome da criança"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-sans text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <input
                  type="number"
                  placeholder="Idade"
                  min={3}
                  max={17}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-sans text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowAddChild(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 font-display font-bold text-gray-500 text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowAddChild(false)}
                  className="flex-1 py-3 rounded-xl font-display font-bold text-white text-sm"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #7C3AED)' }}
                >
                  Adicionar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
