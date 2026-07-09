import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  BarChart3, 
  FileText,
  Share2, 
  Search, 
  Flame, 
  Trophy, 
  CheckCircle, 
  BookMarked, 
  ChevronRight, 
  Timer, 
  RotateCcw, 
  Play,
  Compass
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { useDeviceOrientation } from "../../hooks/useDeviceOrientation";
import { WeeklyComparisonChart } from "../growth/WeeklyComparisonChart";
import { WeeklyPerformanceChart } from "../growth/WeeklyPerformanceChart";
import { TotalMinutesCard } from "../growth/TotalMinutesCard";
import { DailyGoalTracker } from "../learning/DailyGoalTracker";
import { DailyTipCard } from "../learning/DailyTipCard";
import { Leaderboard } from "../learning/ranking/Leaderboard";
import { StudyScheduler } from "../learning/calendario/StudyScheduler";
import { ConversationWizard } from "../ai-tutor/ConversationWizard";
import { generateWeeklyReportPDF } from "../../utils/pdfGenerator";
import { Language, Proficiency, AgeGroup, Scenario, Voice, StreakData, Achievement, PlatformFeatures, TranscriptItem, SavedWord, FeedbackReport, Localization } from "../../types";
import { auth } from "../../firebase";
import { subscribeToAchievements, UserAchievements, Badge } from "../../lib/AchievementsManager";
import { COUNTRY_DETAILS, TRANSLATIONS, formatDate } from "../../data/localizationData";
import { useLocalization } from "../../context/LocalizationContext";

interface DashboardProps {
  selectedLanguage: Language;
  setSelectedLanguage: (l: Language) => void;
  selectedProficiency: Proficiency;
  setSelectedProficiency: (p: Proficiency) => void;
  selectedAgeGroup: AgeGroup;
  setSelectedAgeGroup: (a: AgeGroup) => void;
  selectedScenario: Scenario;
  setSelectedScenario: (s: Scenario) => void;
  selectedVoice: Voice;
  setSelectedVoice: (v: Voice) => void;
  onStartPractice: () => void;
  onViewSavedVocab: () => void;
  onStartQuiz: () => void;
  savedCount: number;
  streakData: StreakData;
  achievements: Achievement[];
  onSimulatePastPractice: (daysAgo: number) => void;
  features?: PlatformFeatures;
  sessionTranscript: TranscriptItem[];
  savedWords: SavedWord[];
  studentName: string;
  feedback?: FeedbackReport;
  onViewLearningPath: () => void;
  userId?: string;
  userEmail?: string;
  onStartWizardSession?: (config: {
    language: Language;
    proficiency: Proficiency;
    ageGroup: AgeGroup;
    scenario: Scenario;
    voice: Voice;
  }) => void;
  localization: Localization;
}

export default function Dashboard(props: DashboardProps) {
  const { addToast } = useToast();
  const orientation = useDeviceOrientation();
  const [achievementsData, setAchievementsData] = useState<UserAchievements | null>(null);
  const { localization, activeCountry, t: translate, formatCurrency, formatDate: contextFormatDate, formatNumber } = useLocalization();

  useEffect(() => {
    // 1. Achievements
    const currentUser = auth.currentUser;
    let unsubscribe: () => void = () => {};
    if (currentUser) {
        unsubscribe = subscribeToAchievements(
          currentUser.uid,
          (data) => {
            setAchievementsData(data);
          }
        );
    }

    // 2. Goal Check
    const checkGoal = () => {
      const hour = new Date().getHours();
      if (hour >= 20) {
        const goal = parseInt(localStorage.getItem('dailyPracticeGoal') || '30', 10);
        const todayStr = new Date().toISOString().split('T')[0];
        const sessionsToday = props.streakData.history.filter(h => h === todayStr).length;
        const minutesToday = sessionsToday * 20;
        
        if (minutesToday < goal) {
          addToast("Ainda não atingiu sua meta diária! Faça uma prática rápida para manter sua sequência.", 'info');
        }
      }
    };
    checkGoal();

    return () => unsubscribe();
  }, [props.streakData, addToast]);

  const handleShare = async () => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const recentSessions = props.streakData.history.filter(dateStr => {
        const d = new Date(dateStr);
        return d >= sevenDaysAgo && d <= today;
    });
    const totalMinutes = recentSessions.length * 20;

    const text = `Estou no LingoLive e já completei ${totalMinutes} minutos de prática esta semana e mantenho uma sequência de ${props.streakData.count} dias! Venha aprender comigo!`;
    if (navigator.share) {
        try {
            await navigator.share({ title: 'Meu Progresso LingoLive', text });
        } catch (err) {
            console.error('Error sharing:', err);
        }
    } else {
        navigator.clipboard.writeText(text);
        addToast("Texto copiado para a área de transferência!", "success");
    }
  };

  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  const userRecentSessions = props.streakData.history.filter(dateStr => {
      const d = new Date(dateStr);
      return d >= sevenDaysAgo && d <= today;
  });
  const userWeeklyMinutes = userRecentSessions.length * 20;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex ${orientation === 'landscape' ? 'flex-row' : 'flex-col'} lg:flex-row min-h-screen bg-slate-50 text-slate-800 ${
        orientation === 'landscape' ? 'p-1 sm:p-2 gap-2' : 'p-2 sm:p-4 gap-4'
      } overflow-x-hidden w-full`} 
      id="dashboard-outer-container"
    >
      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${
        orientation === 'landscape' ? 'p-2 gap-3' : 'p-3 sm:p-6 gap-4 sm:gap-6'
      } overflow-y-auto`}>
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative w-full max-w-md">
            <input type="text" placeholder="Pesquisar..." className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm" />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
             <button onClick={handleShare} className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer">
                <Share2 size={14} />
                <span className="truncate">Compartilhar</span>
             </button>
             <button onClick={() => generateWeeklyReportPDF(props.studentName, userWeeklyMinutes, props.streakData.count, props.achievements)} className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer">
                <FileText size={14} />
                <span className="truncate">Relatório</span>
             </button>
             <div className="flex items-center gap-2 shrink-0 ml-auto md:ml-0">
               <img src="https://ui-avatars.com/api/?name=John+Doe" alt="User" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
               <div className="text-left">
                 <div className="font-bold text-xs sm:text-sm">{props.studentName}</div>
                 <div className="text-[10px] text-slate-500">3rd year</div>
               </div>
             </div>
          </div>
        </div>

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-3xl p-8 flex items-center justify-between shadow-lg">
          <div>
            <div className="text-indigo-100 text-sm mb-2">{contextFormatDate(new Date())}</div>
            <h1 className="text-3xl font-bold mb-2">Bem-vindo de volta, {props.studentName}!</h1>
            <p className="text-indigo-50">Mantenha-se atualizado no seu portal do aluno</p>
          </div>
          <div className="text-6xl opacity-80">🎓</div>
        </div>

        {/* Dynamic Learning Path Teaser */}
        <div className="bg-white rounded-3xl border border-indigo-100 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-8 -mt-8 opacity-50" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Compass className="w-6 h-6 text-indigo-600 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold uppercase px-2 py-0.5 rounded-full tracking-wider">Trilha de Prática Inteligente</span>
                <span className="text-xs text-indigo-600 font-semibold">Recomendado para Você</span>
              </div>
              <h3 className="font-bold text-slate-800 text-base mt-1">Conclua o Desafio Inteligente da sua Trilha</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {props.savedWords.length > 0 
                  ? `Pratique com flashcards das suas ${props.savedWords.length} palavras salvas ou resolva desafios de sintaxe!`
                  : "Aprenda novos vocabulários e estruturas gramaticais com base no seu perfil de fala."
                }
              </p>
            </div>
          </div>
          <button 
            onClick={props.onViewLearningPath}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-2xl text-xs transition shadow-md shadow-indigo-600/10 cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            Acessar Minha Trilha <ChevronRight size={14} />
          </button>
        </div>

        {/* Conversation Wizard Section */}
        {props.userId && props.onStartWizardSession && (
          <ConversationWizard
            userId={props.userId}
            userEmail={props.userEmail}
            onStartSession={props.onStartWizardSession}
          />
        )}

        {/* Streak & Achievements (Integrated) */}
        <div className={`grid ${
          orientation === 'landscape' ? 'grid-cols-2 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-6'
        }`}>
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-orange-500">
             <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-orange-600"><Flame className="text-orange-500"/> Sequência: {props.streakData.count} dias</h2>
             <p className="text-slate-500 text-sm mb-4">Você está com tudo!</p>
             
             {achievementsData && (() => {
               const incompleteBadges = (Object.values(achievementsData.badges) as Badge[]).filter(b => !b.unlockedAt);
               if (incompleteBadges.length === 0) return <p className="text-xs text-emerald-600 font-semibold">Todas as conquistas desbloqueadas!</p>;
               
               const nextBadge = incompleteBadges.sort((a,b) => (b.progress / b.totalRequired) - (a.progress / a.totalRequired))[0];
               const percent = Math.min(100, Math.round((nextBadge.progress / nextBadge.totalRequired) * 100));
               
               return (
                 <div className="space-y-1">
                   <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
                     <span>Próximo nível: {nextBadge.title}</span>
                     <span>{percent}%</span>
                   </div>
                   <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                     <div 
                       className="bg-orange-500 h-full rounded-full transition-all duration-500"
                       style={{ width: `${percent}%` }}
                     />
                   </div>
                 </div>
               );
             })()}
           </div>
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Trophy className="text-amber-500"/> Conquistas</h2>
             <p className="text-slate-500 text-sm">{props.achievements.filter(a => a.unlockedAt).length} desbloqueadas</p>
           </div>
        </div>

        {/* Quick Actions */}
        <div className={`grid ${
          orientation === 'landscape' ? 'grid-cols-3 gap-3' : 'grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6'
        }`}>
          {[
            { label: "Resume Previous Session", icon: RotateCcw, action: props.onStartPractice },
            { label: "Quick Vocabulary Review", icon: BookMarked, action: props.onViewSavedVocab },
            { label: "Start 5-Minute Drill", icon: Timer, action: () => addToast("Em breve!", "info") },
          ].map((action, i) => (
            <button 
              key={i} 
              id={i === 0 ? "tour-practice-btn" : undefined}
              onClick={action.action} 
              className="bg-indigo-600 text-white p-6 rounded-2xl shadow-sm flex flex-col items-center gap-2 hover:bg-indigo-700 transition duration-200"
            >
              <action.icon size={30} />
              <span className="font-semibold text-sm">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Learning Stats */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
           <h2 className="font-bold text-lg mb-4">Estatísticas de Aprendizado</h2>
           <div className={`grid ${
             orientation === 'landscape' ? 'grid-cols-4 gap-3' : 'grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6'
           }`}>
              <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-4">
                <BookMarked className="text-indigo-600" size={24} />
                <div>
                  <div className="text-slate-500 text-sm">Palavras Salvas</div>
                  <div className="text-2xl font-bold text-indigo-900">{props.savedWords.length}</div>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-4">
                <CheckCircle className="text-emerald-600" size={24} />
                <div>
                  <div className="text-slate-500 text-sm">Sessões Concluídas</div>
                  <div className="text-2xl font-bold text-indigo-900">{props.sessionTranscript.length > 0 ? 1 : 0}</div>
                </div>
              </div>
              <TotalMinutesCard streakData={props.streakData} />
              <DailyGoalTracker streakData={props.streakData} />
           </div>
        </div>

        {/* Weekly Performance Chart */}
        <DailyTipCard selectedLanguage={props.selectedLanguage} />

        {/* Regional Culture, Slang & Geopositioning Card */}
        {(() => {
          const detail = COUNTRY_DETAILS[props.localization.country] || COUNTRY_DETAILS.US;
          const currentLang = props.localization.language === 'en' ? 'en' : 'pt';
          const t = TRANSLATIONS[currentLang] || TRANSLATIONS.pt;
          const formattedToday = formatDate(new Date(), props.localization.country);

          return (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl select-none" role="img" aria-label={detail.name}>{detail.flag}</span>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                      {t.activeCountry}: {detail.name}
                    </h3>
                    <p className="text-xs text-slate-500">{t.subActiveCountry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:text-right sm:justify-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">{t.currencySymbol}</span>
                    <span className="text-sm font-semibold text-slate-800">{detail.currency} ({detail.symbol})</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">{t.officialLanguage}</span>
                  <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    🌐 {detail.language}
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">{t.countryCode}</span>
                  <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    📍 {detail.code} / ISO-3166
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">{t.dateFormatLabel}</span>
                  <span className="text-sm font-semibold text-slate-800 flex flex-col">
                    <span>📅 {detail.dateFormat}</span>
                    <span className="text-[10px] text-indigo-600 font-mono mt-0.5">{formattedToday}</span>
                  </span>
                </div>
              </div>

              {/* Recommended Conversation Themes */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>💭</span> {t.themesSection}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {detail.themes.map((theme, index) => (
                    <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-100/50 transition-all duration-200">
                      <h5 className="font-bold text-slate-800 text-xs mb-1">{theme.title}</h5>
                      <p className="text-xs text-slate-500 leading-relaxed">{theme.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* National Holidays */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>🎉</span> {t.holidaysSection}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {detail.holidays.map((h, index) => (
                    <div key={index} className="bg-amber-50/40 p-4 rounded-xl border border-amber-100/20 hover:bg-amber-50/70 transition-all duration-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-amber-900 text-xs">{h.name}</span>
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full font-mono">{h.date}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{h.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slangs dictionary */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>💬</span> {t.slangDict}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {detail.slangs.map((s, index) => (
                    <div key={index} className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100/30 hover:bg-indigo-50/70 transition-all duration-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-indigo-900 text-sm">{s.term}</span>
                        <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">Gíria</span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium mb-2">
                        <span className="text-slate-400">Significado:</span> {s.meaning}
                      </p>
                      <p className="text-xs text-indigo-700/90 italic font-mono bg-white/70 px-2.5 py-1.5 rounded-lg border border-indigo-100/20">
                        "{s.example}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        <WeeklyPerformanceChart streakData={props.streakData} />
        <StudyScheduler />
      </div>

      {/* Right Sidebar */}
      <div className={`w-full lg:w-80 flex flex-col ${
        orientation === 'landscape' ? 'p-1.5 gap-3' : 'p-3 sm:p-6 gap-4 sm:gap-6'
      }`}>

         <Leaderboard />
         <WeeklyComparisonChart userMinutes={userWeeklyMinutes} />
         
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1">
           <div className="flex justify-between items-center mb-6">
             <h2 className="font-bold text-lg">Aviso Diário</h2>
             <span className="text-indigo-600 text-sm font-medium cursor-pointer hover:underline">Ver tudo</span>
           </div>
           <div className="space-y-6">
             {[{title: "Pagamento preliminar devido", desc: "Lorem ipsum..."}, {title: "Calendário de exames", desc: "Lorem ipsum..."}].map((n, i) => (
               <div key={i} className="group cursor-pointer">
                 <div className="font-semibold text-sm text-slate-800 group-hover:text-indigo-700 transition-colors">{n.title}</div>
                 <div className="text-xs text-slate-500 mt-1 line-clamp-2">{n.desc}</div>
                 <div className="text-indigo-600 text-xs font-medium mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   Ver mais <ChevronRight size={14} />
                 </div>
               </div>
             ))}
           </div>
         </div>
      </div>
   </motion.div>
  );
}
