import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Flame, 
  BookOpen, 
  GraduationCap, 
  Award, 
  Shield, 
  ArrowRight, 
  CheckCircle2, 
  Trophy, 
  Bookmark,
  Sparkles,
  School,
  Activity,
  Mic,
  Check
} from 'lucide-react';
import { Achievement, StreakData, Language, Proficiency, PlatformFeatures } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useAppTheme } from '../../context/ThemeContext';
import { auth } from '../../firebase';
import { subscribeToAchievements, UserAchievements, Badge } from '../../lib/AchievementsManager';

interface UserProfileProps {
  userName: string;
  userEmail: string | null;
  streakData: StreakData;
  achievements: Achievement[];
  selectedLanguage: Language;
  selectedProficiency: Proficiency;
  setView: (view: any) => void;
  features: PlatformFeatures;
  onOpenQuiz: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  userName, 
  userEmail, 
  streakData, 
  achievements, 
  selectedLanguage,
  selectedProficiency,
  setView,
  features,
  onOpenQuiz 
}) => {
  const { addToast } = useToast();
  const { theme, age, setAge } = useAppTheme();
  const [firestoreAchievements, setFirestoreAchievements] = useState<UserAchievements | null>(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const unsubscribe = subscribeToAchievements(
      currentUser.uid,
      (data) => {
        setFirestoreAchievements(data);
      },
      (badgeTitle) => {
        addToast(`🏆 Conquista Desbloqueada: ${badgeTitle}!`, 'achievement');
      }
    );
    return () => unsubscribe();
  }, [addToast]);

  // Determine if the current logged-in user is the general administrator
  const isAdmin = userEmail?.toLowerCase() === 'sergio.uragan@gmail.com';

  // Metrics logic
  const totalHours = Math.max(8.5, streakData.history.length * 0.5); // At least 8.5 hours
  const streakDays = streakData.history.length || 3;
  const currentCourse = `Curso de ${selectedLanguage.name} ${selectedProficiency === 'Beginner' ? 'Básico' : selectedProficiency === 'Intermediate' ? 'Intermediário' : 'Avançado'}`;
  const completionRate = selectedProficiency === 'Beginner' ? 85 : selectedProficiency === 'Intermediate' ? 62 : 38;

  const handleNavigateActivity = (viewName: any, label: string, isEnabled: boolean) => {
    if (!isEnabled) {
      addToast(`A atividade de ${label} está offline no momento.`, "warning");
      return;
    }
    setView(viewName);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 bg-slate-950 rounded-3xl border border-slate-900 shadow-2xl relative overflow-hidden" 
      id="user-profile"
    >
      {/* Background radial highlight glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar branding */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider border border-indigo-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" /> MEU PERFIL GERAL
            </span>
            <span className="text-xs text-slate-400 font-semibold bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-800">
              ID Estudante: #{(userEmail || 'user').split('@')[0]}
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mt-2 text-slate-100">
            Painel Geral do Aluno
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Gerencie suas conquistas, visualize estatísticas inteligentes de uso e acesse ferramentas integradas.
          </p>
        </div>
      </div>

      {/* 1. Header Card: Dados de identificação do estudante, idioma ativo e nível */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-950 p-6 md:p-8 rounded-3xl border border-indigo-500/30 shadow-lg relative z-10 text-white flex flex-col md:flex-row items-center gap-6 justify-between">
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="w-20 h-20 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center text-3xl font-black shadow-lg shadow-cyan-400/20">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight text-white">{userName}</h3>
            <p className="text-indigo-200 text-sm font-medium">{userEmail}</p>
            
            <div className="flex flex-wrap gap-2.5 mt-4 justify-center md:justify-start">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-950/40 border border-indigo-400/20 rounded-xl text-xs font-bold text-white">
                <span className="text-lg">{selectedLanguage.flag}</span>
                Idioma: {selectedLanguage.name}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-950/40 border border-indigo-400/20 rounded-xl text-xs font-bold text-cyan-300">
                <Award className="w-3.5 h-3.5 text-cyan-400" />
                Nível: {selectedProficiency === 'Beginner' ? 'Iniciante' : selectedProficiency === 'Intermediate' ? 'Intermediário' : 'Avançado'}
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setView('dashboard')}
          className="w-full md:w-auto px-6 py-3.5 bg-cyan-400 hover:bg-cyan-300 active:scale-[0.98] text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all duration-300 shadow-lg shadow-cyan-400/20 flex items-center justify-center gap-2 group cursor-pointer"
        >
          <Mic className="w-4 h-4 text-slate-950 group-hover:scale-125 transition-transform" />
          Treinar Conversação
        </button>
      </div>

      {/* Interactive Theme and Age Customizer Panel */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden z-10 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" /> Customização de Tema do Aluno (Firestore)
            </h4>
            <p className="text-xs text-slate-400">
              O LingoLive AI adapta dinamicamente sua interface com base na idade cadastrada no Firestore.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              theme === 'kiditorial' 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
            }`}>
              Tema Ativo: {theme === 'kiditorial' ? '🧒 Kiditorial' : '💼 Corporate'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-300 block">Idade do Perfil</span>
              <span className="text-[10px] text-slate-400">Salvando no Firestore (/students)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAge(Math.max(5, (age || 18) - 1))}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm cursor-pointer flex items-center justify-center transition-all"
                title="Diminuir idade"
              >
                -
              </button>
              <span className="text-base font-extrabold text-slate-100 min-w-12 text-center">
                {age !== null ? `${age} anos` : '...'}
              </span>
              <button
                type="button"
                onClick={() => setAge(Math.min(99, (age || 18) + 1))}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm cursor-pointer flex items-center justify-center transition-all"
                title="Aumentar idade"
              >
                +
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-300 block">Alternar Modo</span>
              <span className="text-[10px] text-slate-400">Atalhos rápidos para alternar faixa etária</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAge(9)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  theme === 'kiditorial' 
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/10' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Infantil (9 anos)
              </button>
              <button
                type="button"
                onClick={() => setAge(20)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  theme === 'corporate' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Corporativo (20 anos)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Bloco de Analytics: Cards de métricas exibindo "Curso Atual", "Aproveitamento" (barra de progresso), "Tempo de Uso" (horas acumuladas de fala) e "Sequência diária" (ícone de fogo) */}
      <div className="space-y-4">
        <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" /> Estatísticas e Performance
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card: Curso Atual */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase">Curso Atual</span>
              <School className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-white font-black text-sm leading-snug">{currentCourse}</p>
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1">LingoLive AI Academics</p>
            </div>
          </div>

          {/* Card: Aproveitamento (progress bar) */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase">Aproveitamento</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <span className="text-white font-black text-2xl leading-none">{completionRate}%</span>
                <span className="text-[8px] text-slate-500 font-extrabold">CONCLUÍDO</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card: Tempo de Uso */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase">Tempo de Uso</span>
              <Mic className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-white font-black text-2xl leading-none">{totalHours.toFixed(1)}h</p>
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1">Acumulado de Fala</p>
            </div>
          </div>

          {/* Card: Sequência diária */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase">Sequência Diária</span>
              <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-white font-black text-2xl leading-none">{streakDays} dias</p>
              </div>
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1">Dias Seguidos</p>
            </div>
          </div>

        </div>
      </div>

      {/* Real-time Firestore Achievements Block */}
      <div className="space-y-4 relative z-10" id="firestore-achievements-container">
        <div className="flex items-center justify-between">
          <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400 animate-bounce" /> Conquistas em Tempo Real (Firestore)
          </h4>
          <span className="text-[10px] text-slate-500 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800 uppercase tracking-widest">
            Sincronizado
          </span>
        </div>

        {firestoreAchievements ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(Object.values(firestoreAchievements.badges || {}) as Badge[]).map((badge) => {
              const isUnlocked = !!badge.unlockedAt;
              const percent = Math.min(105, Math.round((badge.progress / badge.totalRequired) * 100));
              
              return (
                <div 
                  key={badge.id}
                  className={`p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                    isUnlocked 
                      ? 'bg-slate-900/90 border-indigo-500/30 shadow-lg shadow-indigo-500/5' 
                      : 'bg-slate-900/40 border-slate-800/80 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                        isUnlocked 
                          ? 'bg-indigo-500/10 border-2 border-indigo-500/30 text-indigo-400 shadow-md shadow-indigo-500/10' 
                          : 'bg-slate-950 border border-slate-800 text-slate-500'
                      }`}>
                        {badge.iconName === 'BookOpen' && <BookOpen className="w-5 h-5" />}
                        {badge.iconName === 'GraduationCap' && <GraduationCap className="w-5 h-5" />}
                        {badge.iconName === 'Award' && <Award className="w-5 h-5" />}
                      </div>

                      {isUnlocked ? (
                        <span className="text-[9px] bg-emerald-500/15 text-emerald-400 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" /> Desbloqueado
                        </span>
                      ) : (
                        <span className="text-[9px] bg-slate-950 text-slate-500 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border border-slate-800">
                          Em Progresso
                        </span>
                      )}
                    </div>

                    <div>
                      <h5 className="font-bold text-sm text-slate-100">{badge.title}</h5>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {badge.description}
                      </p>
                    </div>

                    {/* Show explored languages list at the bottom of the Language Explorer card */}
                    {badge.id === 'language-explorer' && firestoreAchievements.languagesExplored.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {firestoreAchievements.languagesExplored.map((lang, idx) => (
                          <span 
                            key={idx} 
                            className="text-[9px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-md font-medium text-slate-300"
                          >
                            🌍 {lang}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 space-y-1.5">
                    <div className="flex justify-between items-end text-[10px]">
                      <span className="text-slate-500 font-extrabold uppercase">Progresso</span>
                      <span className={`font-black ${isUnlocked ? 'text-indigo-400' : 'text-slate-300'}`}>
                        {badge.progress} / {badge.totalRequired} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-900">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          isUnlocked ? 'bg-gradient-to-r from-indigo-500 to-cyan-400' : 'bg-slate-700'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400 font-semibold">Carregando conquistas do Firestore...</p>
          </div>
        )}
      </div>

      {/* 3. Bloco de Atividades Integradas: Cards interativos de clique rápido */}
      <div className="space-y-4">
        <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" /> Atividades Integradas
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card: Ranking (Leaderboard) */}
          <div 
            onClick={() => handleNavigateActivity('community', 'Quadro de Líderes', features.leaderboard !== false)}
            className={`p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between cursor-pointer group ${
              features.leaderboard !== false 
                ? 'bg-slate-900 border-slate-800 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/5' 
                : 'bg-slate-900/40 border-slate-900/50 opacity-60'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h5 className="font-bold text-sm text-slate-100 group-hover:text-indigo-400 transition-colors">Quadro de Líderes</h5>
                  {features.leaderboard === false && (
                    <span className="text-[8px] bg-red-500/20 text-red-300 font-black px-1.5 py-0.5 rounded uppercase">Offline</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">Veja sua classificação na liga global.</p>
              </div>
            </div>
            {features.leaderboard !== false && (
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            )}
          </div>

          {/* Card: Quiz de Idioma */}
          <div 
            onClick={() => handleNavigateActivity('quiz', 'Quiz de Idioma', features.languageQuiz !== false)}
            className={`p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between cursor-pointer group ${
              features.languageQuiz !== false 
                ? 'bg-slate-900 border-slate-800 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/5' 
                : 'bg-slate-900/40 border-slate-900/50 opacity-60'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h5 className="font-bold text-sm text-slate-100 group-hover:text-cyan-400 transition-colors">Quiz de Idioma</h5>
                  {features.languageQuiz === false && (
                    <span className="text-[8px] bg-red-500/20 text-red-300 font-black px-1.5 py-0.5 rounded uppercase">Offline</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">Desafios rápidos e testes de gramática.</p>
              </div>
            </div>
            {features.languageQuiz !== false && (
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            )}
          </div>

          {/* Card: Prática de Vocabulário (Vocab Deck) */}
          <div 
            onClick={() => handleNavigateActivity('vocab', 'Baralho de Vocabulário', features.vocabDeck !== false)}
            className={`p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between cursor-pointer group ${
              features.vocabDeck !== false 
                ? 'bg-slate-900 border-slate-800 hover:border-pink-500 hover:shadow-lg hover:shadow-pink-500/5' 
                : 'bg-slate-900/40 border-slate-900/50 opacity-60'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400">
                <Bookmark className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h5 className="font-bold text-sm text-slate-100 group-hover:text-pink-400 transition-colors">Vocabulário Salvo</h5>
                  {features.vocabDeck === false && (
                    <span className="text-[8px] bg-red-500/20 text-red-300 font-black px-1.5 py-0.5 rounded uppercase">Offline</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">Acesse e consolide palavras favoritadas.</p>
              </div>
            </div>
            {features.vocabDeck !== false && (
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
            )}
          </div>

        </div>
      </div>


    </motion.div>
  );
};
