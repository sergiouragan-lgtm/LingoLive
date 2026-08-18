import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Flame, Shield, Award, Sparkles, ClipboardList, Mic, CircleDollarSign, 
  ChevronRight, Calendar, Users, Star, ArrowUpRight, Check, Compass, GraduationCap, ShieldCheck, Gamepad2, Volume2, Gem, Eye
} from 'lucide-react';
import { gamificationService } from '../../services/gamification';
import { LeaderboardUser, BadgeRule, GamificationAchievement } from '../../types/gamification';
import { useToast } from '../../context/ToastContext';

interface RankingModuleProps {
  onAddXp?: (xp: number) => void;
}

export const RankingModule: React.FC<RankingModuleProps> = ({ onAddXp }) => {
  const { addToast } = useToast();
  const userId = 'student-test-user';

  // State
  const [activeLeague, setActiveLeague] = useState<'bronze' | 'silver' | 'gold' | 'diamond'>('bronze');
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [badges, setBadges] = useState<BadgeRule[]>([]);
  const [achievements, setAchievements] = useState<GamificationAchievement[]>([]);
  const [userProgress, setUserProgress] = useState<{ [key: string]: number }>({});
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'achievements' | 'badges' | 'events'>('leaderboard');
  const [loading, setLoading] = useState(true);

  // Load data
  const loadRankingData = async () => {
    setLoading(true);
    try {
      const state = await gamificationService.getUserState(userId);
      setUserProgress(state.achievementsProgress || {});
      setUnlockedBadges(state.badges || []);
      
      const lb = await gamificationService.getLeaderboard(userId, activeLeague);
      setLeaderboard(lb);

      setBadges(gamificationService['repository'].getBadges());
      setAchievements(gamificationService['repository'].getAchievements());
    } catch (err) {
      console.error('Failed to load ranking data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRankingData();
  }, [activeLeague]);

  // Claim achievement reward
  const handleClaimAchievement = async (achId: string) => {
    // Adding reward via direct service simulation
    const state = await gamificationService.getUserState(userId);
    const ach = achievements.find(a => a.id === achId);
    if (!ach) return;

    // Simulate claiming
    state.xp += ach.rewardXp;
    state.coins += ach.rewardCoins;
    
    // Set progress super high so we don't claim again, or mark as claimed
    state.achievementsProgress[`${achId}_claimed`] = 1;
    await gamificationService['repository'].saveUserState(state);

    if (onAddXp) onAddXp(ach.rewardXp);
    addToast(`Recompensa coletada! +${ach.rewardXp} XP e +${ach.rewardCoins} Moedas!`, 'success');
    loadRankingData();
  };

  return (
    <div className="space-y-6">
      {/* Title & Description Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500 shrink-0" />
            Arena de Campeões
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">Mede a tua dedicação, compete em ligas saudáveis e celebra as tuas conquistas.</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0 self-start sm:self-center">
          {[
            { id: 'leaderboard', label: 'Tabela' },
            { id: 'achievements', label: 'Conquistas' },
            { id: 'badges', label: 'Medalhas' },
            { id: 'events', label: 'Eventos' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* --- TAB: LEADERBOARD --- */}
      {activeTab === 'leaderboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* League Select Column */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs h-fit">
            <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider text-slate-400">Selecione a Liga</h4>
            <div className="space-y-2">
              {[
                { id: 'bronze', label: 'Liga de Bronze', color: 'border-amber-700 bg-amber-500/5 text-amber-800' },
                { id: 'silver', label: 'Liga de Prata', color: 'border-slate-300 bg-slate-100/30 text-slate-700' },
                { id: 'gold', label: 'Liga de Ouro', color: 'border-yellow-400 bg-yellow-500/5 text-yellow-800' },
                { id: 'diamond', label: 'Liga de Diamante', color: 'border-cyan-400 bg-cyan-500/5 text-cyan-800 animate-pulse' }
              ].map(lg => {
                const isSelected = activeLeague === lg.id;
                return (
                  <button
                    key={lg.id}
                    onClick={() => setActiveLeague(lg.id as any)}
                    className={`w-full p-4 border rounded-2xl text-left font-black text-sm cursor-pointer transition-all flex items-center justify-between ${
                      isSelected 
                        ? `${lg.color} ring-2 ring-indigo-500/10 scale-[1.02]` 
                        : 'border-slate-150 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <span>{lg.label}</span>
                    <Shield className={`w-4 h-4 ${
                      lg.id === 'bronze' ? 'text-amber-700' :
                      lg.id === 'silver' ? 'text-slate-400' :
                      lg.id === 'gold' ? 'text-yellow-500' : 'text-cyan-400'
                    }`} />
                  </button>
                );
              })}
            </div>
            
            <div className="border-t border-slate-100 pt-4 text-[11px] text-slate-400 leading-relaxed font-semibold">
              ℹ️ Os 3 primeiros colocados de cada liga são promovidos para a liga seguinte todos os domingos à meia-noite!
            </div>
          </div>

          {/* Leaderboard Competitor List */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-extrabold text-slate-900 text-sm">Classificação Global</h4>
              <span className="text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full font-bold">Liga Ativa</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto pr-2">
                {leaderboard.map((item, idx) => {
                  const isTop3 = item.rank <= 3;
                  return (
                    <div 
                      key={item.userId}
                      className={`flex items-center justify-between py-3.5 px-2 rounded-2xl transition-all ${
                        item.isCurrentUser ? 'bg-indigo-50/40 border border-indigo-100 shadow-inner' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      {/* Left: Rank & Avatar */}
                      <div className="flex items-center gap-3">
                        <span className={`w-6 font-black text-center text-sm ${
                          item.rank === 1 ? 'text-yellow-500 text-base' :
                          item.rank === 2 ? 'text-slate-400' :
                          item.rank === 3 ? 'text-amber-700' : 'text-slate-400'
                        }`}>
                          {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : item.rank}
                        </span>

                        {/* Interactive Complex Avatar Render */}
                        <div className="relative w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 shadow-inner shrink-0 overflow-hidden"
                             style={{
                               background: item.avatar.background === 'cosmic' ? 'radial-gradient(circle, #312e81 0%, #030712 100%)' :
                                           item.avatar.background === 'sunset' ? 'linear-gradient(to top, #b45309, #78350f)' :
                                           item.avatar.background === 'emerald' ? 'linear-gradient(to bottom, #065f46, #022c22)' :
                                           item.avatar.background === 'royal' ? 'radial-gradient(circle, #5b21b6 0%, #1e1b4b 100%)' : '#f1f5f9'
                             }}>
                          
                          {/* Base Avatar rendering */}
                          {item.avatar.base === 'explorer' && <Compass className="w-5 h-5 text-amber-400" />}
                          {item.avatar.base === 'scholar' && <GraduationCap className="w-5 h-5 text-cyan-400" />}
                          {item.avatar.base === 'wizard' && <Sparkles className="w-5 h-5 text-purple-400" />}
                          {item.avatar.base === 'champion' && <ShieldCheck className="w-5 h-5 text-emerald-400" />}
                          {item.avatar.base === 'neutral' && <Gamepad2 className="w-5 h-5 text-indigo-400" />}

                          {/* Accessory Layer */}
                          {item.avatar.accessory === 'glasses' && (
                            <span className="absolute text-[8px] top-4 border-b border-white px-1 text-white">👓</span>
                          )}
                          {item.avatar.accessory === 'headphones' && (
                            <span className="absolute text-[8px] top-1 border-b border-white px-1 text-white">🎧</span>
                          )}
                          {item.avatar.accessory === 'crown' && (
                            <span className="absolute text-xs -top-1">👑</span>
                          )}
                          {item.avatar.accessory === 'cap' && (
                            <span className="absolute text-[10px] -top-1">🧢</span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs sm:text-sm text-slate-900">{item.name}</span>
                            {item.streak >= 5 && (
                              <span className="text-[10px] bg-orange-50 text-orange-600 font-extrabold border border-orange-100 px-1 rounded flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5" />
                                {item.streak}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold block">{item.avatar.title || 'Iniciante'} · Nível {item.level}</span>
                        </div>
                      </div>

                      {/* Right: Score */}
                      <div className="text-right">
                        <span className="text-xs sm:text-sm font-black text-slate-800 tracking-tight">{item.totalXp} XP</span>
                        <span className="text-[10px] text-slate-400 block font-semibold">Total Acumulado</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB: ACHIEVEMENTS --- */}
      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map(ach => {
            const current = userProgress[ach.id] || 0;
            const isCompleted = current >= ach.targetValue;
            const percent = Math.min((current / ach.targetValue) * 100, 100);
            const isClaimed = userProgress[`${ach.id}_claimed`] === 1;

            return (
              <div 
                key={ach.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-start gap-4 hover:border-slate-300 transition-all"
              >
                <div className={`p-3 rounded-2xl shrink-0 border ${
                  isCompleted 
                    ? 'bg-amber-50 border-amber-200 text-amber-500' 
                    : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}>
                  {ach.iconName === 'Flame' && <Flame className="w-6 h-6" />}
                  {ach.iconName === 'Sparkles' && <Sparkles className="w-6 h-6" />}
                  {ach.iconName === 'ClipboardList' && <ClipboardList className="w-6 h-6" />}
                  {ach.iconName === 'Volume2' && <Volume2 className="w-6 h-6" />}
                  {ach.iconName === 'CircleDollarSign' && <CircleDollarSign className="w-6 h-6" />}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h5 className="font-extrabold text-sm text-slate-900">{ach.name}</h5>
                      <p className="text-xs text-slate-500">{ach.description}</p>
                    </div>
                    <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md shrink-0">
                      {ach.category}
                    </span>
                  </div>

                  {/* Linear Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Progresso</span>
                      <span>{current} / {ach.targetValue}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>

                  {/* Footer Reward & Action */}
                  <div className="flex items-center justify-between border-t border-slate-50 pt-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600">
                      <CircleDollarSign className="w-3.5 h-3.5" />
                      <span>+{ach.rewardCoins} Moedas</span>
                      <span className="text-indigo-400">+{ach.rewardXp} XP</span>
                    </div>

                    {isClaimed ? (
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" /> Concluída
                      </span>
                    ) : isCompleted ? (
                      <button
                        onClick={() => handleClaimAchievement(ach.id)}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 cursor-pointer transition-all"
                      >
                        Coletar Recompensas
                      </button>
                    ) : (
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Bloqueada</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- TAB: BADGES --- */}
      {activeTab === 'badges' && (
        <div className="space-y-4">
          <h4 className="font-extrabold text-slate-900 text-sm">Quadro de Honra (Medalhas de Mérito)</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {badges.map(badge => {
              const isUnlocked = unlockedBadges.includes(badge.id);
              return (
                <div 
                  key={badge.id}
                  className={`border rounded-3xl p-5 text-center flex flex-col items-center justify-center space-y-3 transition-all relative overflow-hidden ${
                    isUnlocked 
                      ? `${badge.color} border shadow-inner` 
                      : 'bg-white border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <div className={`p-3 rounded-2xl border ${
                    isUnlocked 
                      ? 'bg-white/40 border-current/20' 
                      : 'bg-slate-50 border-slate-100'
                  }`}>
                    {badge.iconName === 'Flame' && <Flame className="w-6 h-6" />}
                    {badge.iconName === 'Award' && <Award className="w-6 h-6" />}
                    {badge.iconName === 'Sparkles' && <Sparkles className="w-6 h-6" />}
                    {badge.iconName === 'BookOpen' && <ClipboardList className="w-6 h-6" />}
                    {badge.iconName === 'CheckCircle' && <Check className="w-6 h-6" />}
                    {badge.iconName === 'Mic' && <Mic className="w-6 h-6" />}
                    {badge.iconName === 'CircleDollarSign' && <CircleDollarSign className="w-6 h-6" />}
                  </div>

                  <div>
                    <h5 className="font-black text-xs sm:text-sm text-slate-900 leading-tight">{badge.name}</h5>
                    <p className="text-[10px] text-slate-500 leading-snug mt-1">{badge.description}</p>
                  </div>

                  {isUnlocked ? (
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                      Conquistada
                    </span>
                  ) : (
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 border border-slate-200">
                      Critério: {badge.requiredValue} {badge.criteriaType}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB: EVENTS --- */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl text-white relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-cyan-500/20 border border-cyan-500/30 px-3 py-1 rounded-full text-cyan-400 font-extrabold flex items-center gap-1 uppercase tracking-widest">
                    <Calendar className="w-3 h-3 animate-pulse" /> Torneio Sazonal
                  </span>
                  <span className="text-xs text-orange-400 font-bold">Oficial LingoLIVE</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">Copa Poliglota de Outono 🍂</h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
                  Competição especial aberta para todos os alunos de nível bronze a diamante. Ganha o dobro de XP em lições de pronúncia e sobe ao pódio principal para levar prémios gigantescos.
                </p>
                
                <div className="flex flex-wrap gap-4 pt-3 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span><strong className="text-white">1,420+</strong> alunos registados</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span>Prémio principal: <strong className="text-white">1,500 Moedas + Título Lenda</strong></span>
                  </div>
                </div>
              </div>

              {/* Real Countdown visual */}
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center w-full md:w-auto shrink-0">
                <span className="text-[10px] text-slate-400 font-black uppercase block tracking-wider mb-2">Termina em:</span>
                <div className="flex justify-center gap-3 font-mono font-black text-lg text-cyan-400">
                  <div>
                    <span className="block text-2xl text-white">05</span>
                    <span className="text-[9px] text-slate-500 uppercase block">dias</span>
                  </div>
                  <span>:</span>
                  <div>
                    <span className="block text-2xl text-white">18</span>
                    <span className="text-[9px] text-slate-500 uppercase block">horas</span>
                  </div>
                  <span>:</span>
                  <div>
                    <span className="block text-2xl text-white">42</span>
                    <span className="text-[9px] text-slate-500 uppercase block">mins</span>
                  </div>
                </div>
                
                <button
                  onClick={() => addToast('Registaste-te no Torneio Sazonal com sucesso! Boa sorte! 🍂🏆', 'success')}
                  className="w-full mt-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-extrabold text-xs rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                >
                  Participar Gratuitamente
                </button>
              </div>
            </div>
          </div>

          {/* Past Events / Wall of Fame */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-900 text-sm">Histórico de Campeões</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { title: 'Torneio de Verão ☀️', winner: 'Sofia Costa', reward: '1,000 Moedas' },
                { title: 'Desafio Vocabulário 📚', winner: 'Mateus Silva', reward: '500 Moedas' },
                { title: 'Maratona Inverno ❄️', winner: 'Beatriz Pereira', reward: '1,200 Moedas' }
              ].map((ev, i) => (
                <div key={i} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
                  <h5 className="font-bold text-xs text-slate-900">{ev.title}</h5>
                  <p className="text-[10px] text-slate-500 mt-1">Campeão: <strong className="text-slate-800">{ev.winner}</strong></p>
                  <span className="text-[10px] bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full text-amber-600 font-extrabold mt-2 inline-block">
                    {ev.reward}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
