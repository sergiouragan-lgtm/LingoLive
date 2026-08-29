
import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Sparkles, 
  Timer, 
  RotateCcw, 
  Play,
  Compass,
  Clock,
  Globe,
  Lock,
  Award,
  Snowflake,
  Target,
  CreditCard,
  AlertTriangle
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { useDeviceOrientation } from "../../hooks/useDeviceOrientation";
import { WeeklyComparisonChart } from "../growth/WeeklyComparisonChart";
import { WeeklyPerformanceChart } from "../growth/WeeklyPerformanceChart";
import { UserGrowthChart } from "../growth/UserGrowthChart";
import { InteractiveLearningAnalytics } from "../growth/InteractiveLearningAnalytics";
import { TotalMinutesCard } from "../growth/TotalMinutesCard";
import { StudyTimeTracker } from "../learning/StudyTimeTracker";
import { StudyStreakTracker } from "../learning/StudyStreakTracker";
import { NextActivityWidget } from "../learning/NextActivityWidget";
import { GamificationWidget } from '../learning/GamificationWidget';
import { SubscriptionStatusWidget } from "../billing/SubscriptionStatusWidget";
import { CurrentLanguageWidget } from "../learning/CurrentLanguageWidget";
import { CurrentLevelWidget } from "../learning/CurrentLevelWidget";
import { DailyGoalTracker } from "../learning/DailyGoalTracker";
import { DailyTip } from "../learning/DailyTip";
import { Leaderboard } from "../learning/ranking/Leaderboard";
import { StudyScheduler } from "../learning/calendario/StudyScheduler";
import { ConversationWizard } from "../ai-tutor/ConversationWizard";
import { DashboardHeader } from "./DashboardHeader";
import { ConfettiRain } from "./ConfettiRain";
import { StreakProtectionBanner } from "../notifications/StreakProtectionBanner";
import { generateWeeklyReportPDF } from "../../utils/pdfGenerator";
import { Language, Proficiency, AgeGroup, Scenario, Voice, StreakData, Achievement, PlatformFeatures, TranscriptItem, SavedWord, FeedbackReport, Localization } from "../../types";
import { auth, db } from "../../firebase";
import { collection, query, where, onSnapshot, orderBy, limit, doc, Timestamp } from "firebase/firestore";
import { subscribeToAchievements, UserAchievements, Badge } from "../../lib/AchievementsManager";
import { COUNTRY_DETAILS, TRANSLATIONS, formatDate } from "../../data/localizationData";
import { useLocalization, useLanguageChanged } from "../../context/LocalizationContext";
import { LANGUAGES } from "../../data";

const ProfileAdaptedWidgetBanner = React.memo<{ selectedAgeGroup: AgeGroup; onStartPractice: () => void; onNavigate?: (view: string) => void }>(({ selectedAgeGroup, onStartPractice, onNavigate }) => {
  const isChild = selectedAgeGroup === 'Kids' || selectedAgeGroup === 'CHILD' || selectedAgeGroup === 'Infancy';
  const isTeen = selectedAgeGroup === 'Teens' || selectedAgeGroup === 'TEEN' || selectedAgeGroup === 'PreTeens';

  if (isChild) {
    return (
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white p-5 rounded-3xl shadow-lg border-2 border-amber-300/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-bounce">🌈</span>
            <span className="font-extrabold text-sm uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">Modo Criança Ativo · Missão do Dia</span>
          </div>
          <div className="flex items-center gap-1 text-amber-100 font-bold text-sm bg-black/20 px-3 py-1 rounded-full">
            <span>⭐⭐⭐</span>
            <span className="text-xs">Estrelas</span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-amber-50 font-medium">
          Aprende com personagens divertidas, ganha presentes mágicos e diverte-te com jogos de vocabulário!
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <button onClick={onStartPractice} className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer">
            <span>🐱</span> <span>Personagens</span>
          </button>
          <button onClick={() => onNavigate?.('jogos')} className="bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer">
            <span>🎁</span> <span>Recompensas</span>
          </button>
          <button onClick={() => onNavigate?.('jogos')} className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer">
            <span>🎮</span> <span>Jogar</span>
          </button>
          <button onClick={onStartPractice} className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer">
            <span>🚀</span> <span>Missão do Dia</span>
          </button>
        </div>
      </div>
    );
  }

  if (isTeen) {
    return (
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 text-white p-5 rounded-3xl shadow-lg border border-indigo-400/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <span className="font-extrabold text-sm uppercase tracking-wider bg-white/15 px-3 py-1 rounded-full">Modo Adolescente · Sequência de 18 Dias</span>
          </div>
          <div className="flex items-center gap-1 text-indigo-100 font-bold text-xs bg-white/20 px-3 py-1 rounded-full">
            <span>🏆</span>
            <span>Top 5% Ranking</span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-indigo-100 font-medium">
          Desafios diários, cultura pop, conversação rápida com IA e rankings para elevar o teu nível ao máximo.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <button onClick={onStartPractice} className="bg-white text-indigo-800 hover:bg-indigo-50 font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer">
            <span>🔥</span> <span>Sequência 18d</span>
          </button>
          <button onClick={() => onNavigate?.('ranking')} className="bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer">
            <span>🏆</span> <span>Ranking</span>
          </button>
          <button onClick={onStartPractice} className="bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer">
            <span>🎯</span> <span>Desafio Diário</span>
          </button>
          <button onClick={onStartPractice} className="bg-pink-500 hover:bg-pink-400 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer">
            <span>💬</span> <span>Conversar com IA</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 text-white p-5 rounded-3xl shadow-lg border border-slate-700/60 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <span className="font-extrabold text-sm uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full">Modo Adulto · Progresso Semanal</span>
        </div>
        <div className="flex items-center gap-1 text-blue-200 font-bold text-xs bg-white/10 px-3 py-1 rounded-full">
          <span>📈</span>
          <span>Fluência Avançada</span>
        </div>
      </div>
      <p className="text-xs sm:text-sm text-slate-300 font-medium">
        Foco estratégico em inglês para negócios, reuniões internacionais, viagens e simulações reais de entrevistas.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <button onClick={onStartPractice} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer">
          <span>📊</span> <span>Progresso Semanal</span>
        </button>
        <button onClick={onStartPractice} className="bg-white/15 hover:bg-white/25 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer">
          <span>📈</span> <span>Fluência</span>
        </button>
        <button onClick={onStartPractice} className="bg-white/15 hover:bg-white/25 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer">
          <span>💼</span> <span>Negócios</span>
        </button>
        <button onClick={onStartPractice} className="bg-white text-slate-900 hover:bg-blue-50 font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer">
          <span>🎤</span> <span>Entrevistas</span>
        </button>
      </div>
    </div>
  );
});
ProfileAdaptedWidgetBanner.displayName = "ProfileAdaptedWidgetBanner";

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
  userProfile?: any;
  syncState?: {
    status: "idle" | "syncing" | "synced" | "offline" | "error";
    lastSyncedAt: string;
    target: "IndexedDB" | "Firestore" | "Both" | "None";
  };
  onForceSync?: () => Promise<void>;
  onBuyStreakFreeze?: () => void;
  onProtectStreakWithPoints?: () => void;
  toggleGoalOverlay: () => void;
  onNavigate?: (view: string) => void;
}

// Memoized Sub-components for Cards and Indicators to prevent unnecessary re-renders
interface GreetingCardProps {
  firstName?: string;
  formattedDate: string;
  isLoading?: boolean;
  isError?: boolean;
}

export const GreetingCard = React.memo<GreetingCardProps>(({ firstName, formattedDate, isLoading, isError }) => {
  const { t } = useLocalization();

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting.morning', 'Bom dia');
    if (hour < 18) return t('greeting.afternoon', 'Boa tarde');
    return t('greeting.evening', 'Boa noite');
  }, [t]);

  if (isLoading) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded"></div>
        <div className="h-6 w-32 bg-slate-200 rounded"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-red-100 shadow-xs">
        <p className="text-red-600 font-medium">{t('greeting.error', 'Olá, Estudante')}</p>
      </div>
    );
  }

  const displayName = firstName && firstName.trim().length > 0 ? firstName.trim().split(' ')[0] : t('greeting.fallback', 'Estudante');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs"
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          {getGreeting()}, {displayName} <span className="animate-bounce inline-block">👋</span>
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          {t('greeting.subtitle', 'Continua exatamente de onde paraste.')}
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 w-fit">
        <Clock size={14} className="text-indigo-500" />
        <span>{formattedDate}</span>
      </div>
    </motion.div>
  );
});
GreetingCard.displayName = "GreetingCard";

interface MainLearningCardProps {
  hasStartedPractice: boolean;
  selectedLanguageName?: string;
  selectedLanguageFlag?: string;
  scenarioTitle?: string;
  scenarioDesc?: string;
  lessonProgressPercent: number;
  onStartPractice: () => void;
}

const MainLearningCard = React.memo<MainLearningCardProps>(({
  hasStartedPractice,
  selectedLanguageName,
  selectedLanguageFlag,
  scenarioTitle,
  scenarioDesc,
  lessonProgressPercent,
  onStartPractice
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, ease: "easeOut", delay: 0.05 }}
    className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 text-white p-5 sm:p-6 rounded-2xl shadow-sm border border-indigo-500/30 flex flex-col justify-between gap-4"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="p-1.5 rounded-lg bg-white/10 text-white">
          <BookOpen size={16} />
        </span>
        <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-200">
          {hasStartedPractice ? "Continuar Aprendizagem" : "Começar Primeira Aula"}
        </span>
      </div>
      <CurrentLanguageWidget name={selectedLanguageName} flag={selectedLanguageFlag} />
    </div>

    <div>
      <h3 className="text-lg font-bold text-white mb-1">
        {hasStartedPractice
          ? (scenarioTitle || "Prática de Conversação com Tutor IA")
          : "Começar primeira aula"}
      </h3>
      <p className="text-xs text-indigo-100/90 line-clamp-2">
        {hasStartedPractice
          ? (scenarioDesc || "Aprimore o seu vocabulário e fluência com o tutor inteligente.")
          : "Inicie a sua primeira conversa com o Tutor de IA."}
      </p>

      {hasStartedPractice && (
        <div className="mt-3">
          <div className="flex justify-between items-center text-[11px] text-indigo-100 font-medium mb-1">
            <span>Progresso da Lição</span>
            <span className="font-bold">{lessonProgressPercent}%</span>
          </div>
          <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${lessonProgressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>

    <button
      type="button"
      onClick={onStartPractice}
      aria-label={hasStartedPractice ? "Continuar aprendizagem" : "Iniciar primeira aula"}
      className="w-full sm:w-auto self-start bg-white text-indigo-700 hover:bg-indigo-50 font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
    >
      <Play size={15} className="fill-indigo-700" />
      <span>{hasStartedPractice ? "Continuar" : "Iniciar"}</span>
    </button>
  </motion.div>
));
MainLearningCard.displayName = "MainLearningCard";

interface NextClassCardProps {
  nextClassScheduled: any;
  onStartPractice: () => void;
  onNavigate?: (view: string) => void;
}

const NextClassCard = React.memo<NextClassCardProps>(({
  nextClassScheduled,
  onStartPractice,
  onNavigate
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, ease: "easeOut", delay: 0.1 }}
    className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-100 flex flex-col justify-between gap-4"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
          <Calendar size={16} />
        </span>
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Próxima Aula
        </span>
      </div>
      {nextClassScheduled && (
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Confirmada
        </span>
      )}
    </div>

    {nextClassScheduled ? (
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-slate-800">
          {nextClassScheduled.title || "Aula de Conversação ao Vivo"}
        </h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-slate-400" />
            <span>{nextClassScheduled.date || "Hoje"} • {nextClassScheduled.time || "18:00"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target size={14} className="text-slate-400" />
            <span>{nextClassScheduled.teacher || "Prof. Clara Santos"}</span>
          </div>
        </div>
      </div>
    ) : (
      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-800">
          Nenhuma aula agendada
        </h3>
        <p className="text-xs text-slate-500">
          Agende uma sessão com um professor nativo para acelerar o seu aprendizado.
        </p>
      </div>
    )}

    {nextClassScheduled ? (
      <button
        type="button"
        onClick={onStartPractice}
        aria-label="Entrar na aula"
        className="w-full sm:w-auto self-start bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
      >
        <span>Entrar</span>
        <ChevronRight size={15} />
      </button>
    ) : (
      <button
        type="button"
        onClick={() => {
          if (onNavigate) {
            onNavigate('live-calendar');
          } else {
            onStartPractice();
          }
        }}
        aria-label="Agendar aula"
        className="w-full sm:w-auto self-start bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
      >
        <Calendar size={15} />
        <span>Agendar Aula</span>
      </button>
    )}
  </motion.div>
));
NextClassCard.displayName = "NextClassCard";

interface StatIndicatorItemProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  bgClass: string;
}

const StatIndicatorItem = React.memo<StatIndicatorItemProps>(({ label, value, icon, bgClass }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
    <div className={`w-10 h-10 rounded-xl ${bgClass} flex items-center justify-center shrink-0`}>
      {icon}
    </div>
    <div className="truncate">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">{label}</div>
      <div className="text-base font-extrabold text-slate-800 truncate">{value}</div>
    </div>
  </div>
));
StatIndicatorItem.displayName = "StatIndicatorItem";

interface QuickSummaryIndicatorsProps {
  currentXp: number;
  streakHistory: string[];
  proficiency: string;
  progressPercent: number;
}

const QuickSummaryIndicators = React.memo<QuickSummaryIndicatorsProps>(({
  currentXp,
  streakHistory,
  proficiency,
  progressPercent
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, ease: "easeOut", delay: 0.15 }}
    className="grid grid-cols-2 sm:grid-cols-4 gap-3"
  >
    <StatIndicatorItem
      label="XP"
      value={`${currentXp} XP`}
      icon={<Sparkles size={20} />}
      bgClass="bg-amber-50 text-amber-600"
    />
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
        <Flame size={20} className="fill-orange-500/20" />
      </div>
      <div className="truncate">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">Sequência</div>
        <StudyStreakTracker history={streakHistory} />
      </div>
    </div>
    <CurrentLevelWidget level={proficiency} />
    <StatIndicatorItem
      label="Progresso"
      value={`${Math.round(progressPercent)}%`}
      icon={<Target size={20} />}
      bgClass="bg-emerald-50 text-emerald-600"
    />
  </motion.div>
));
QuickSummaryIndicators.displayName = "QuickSummaryIndicators";

const parseAndValidateYyyyMmDd = (dateStr: string): Date | null => {
  if (typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;

  const [yearStr, monthStr, dayStr] = trimmed.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) return null;

  const d = new Date(year, month - 1, day, 12, 0, 0);
  if (d.getFullYear() !== year || (d.getMonth() + 1) !== month || d.getDate() !== day) {
    return null;
  }
  return d;
};

const isDateInCurrentWeek = (dateInput: string | Date | undefined): boolean => {
  if (!dateInput) return false;
  let d: Date | null = null;
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return false;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      d = parseAndValidateYyyyMmDd(trimmed);
      if (!d) return false;
    } else {
      d = new Date(trimmed);
    }
  } else {
    d = new Date(dateInput);
  }
  if (!d || isNaN(d.getTime())) return false;

  const now = new Date();
  const currentDay = now.getDay();
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0, 0);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);

  return d >= monday && d <= sunday;
};

interface WeeklyProgressSectionProps {
  streakHistory?: string[];
  savedWords?: SavedWord[];
  learningGoal?: string;
  selectedScenarioTitle?: string;
  selectedScenarioDescription?: string;
  selectedLanguageName?: string;
  proficiency?: string;
  onStartPractice: () => void;
  onToggleGoalOverlay?: () => void;
  onNavigate?: (view: string) => void;
}

const WeeklyProgressSection = React.memo<WeeklyProgressSectionProps>(({
  streakHistory = [],
  savedWords = [],
  learningGoal,
  selectedScenarioTitle,
  selectedScenarioDescription,
  selectedLanguageName,
  proficiency,
  onStartPractice,
  onToggleGoalOverlay,
  onNavigate
}) => {
  const validUniqueWeeklyDates = Array.from(
    new Set(
      (streakHistory || [])
        .filter((dateStr): dateStr is string => typeof dateStr === 'string')
        .map(dateStr => dateStr.trim())
        .filter(dateStr => parseAndValidateYyyyMmDd(dateStr) !== null)
    )
  ).filter(dateStr => isDateInCurrentWeek(dateStr));

  const weeklyActiveDaysCount = validUniqueWeeklyDates.length;
  const weeklySavedWordsCount = savedWords.filter(w => isDateInCurrentWeek(w.savedAt)).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut", delay: 0.2 }}
      className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-xs space-y-5"
      id="weekly-progress-section"
    >
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Progresso da Semana</span>
        </h2>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
          Acompanha as tuas metas e continua no ritmo certo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ÁREA 1 — ACTIVIDADE SEMANAL */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
            <Clock size={15} className="text-indigo-600" />
            <span>Actividade Semanal</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100/80 flex flex-col justify-between" aria-label="Dias com Actividade na semana actual">
              <div className="text-[11px] font-bold text-slate-500">Dias com Actividade</div>
              <div className="text-lg font-extrabold text-slate-800 mt-1">
                {weeklyActiveDaysCount} {weeklyActiveDaysCount === 1 ? 'dia' : 'dias'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Na semana actual</div>
            </div>

            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100/80 flex flex-col justify-between">
              <div className="text-[11px] font-bold text-slate-500">Palavras Guardadas</div>
              <div className="text-lg font-extrabold text-slate-800 mt-1">{weeklySavedWordsCount} palavras</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Guardadas esta semana</div>
            </div>
          </div>
        </div>

        {/* ÁREA 2 — OBJECTIVOS DA SEMANA */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
            <Target size={15} className="text-indigo-600" />
            <span>Objectivos da Semana</span>
          </div>

          <div className="space-y-2.5">
            {learningGoal ? (
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100/80 flex items-center justify-between gap-2">
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-800 truncate">Foco: {learningGoal}</div>
                  <div className="text-[11px] text-slate-500 truncate">Objectivo principal do perfil</div>
                </div>
                <button
                  type="button"
                  onClick={onStartPractice}
                  className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer"
                >
                  Praticar
                </button>
              </div>
            ) : null}

            {onToggleGoalOverlay ? (
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100/80 flex items-center justify-between gap-2">
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-800 truncate">Meta de Prática Diária</div>
                  <div className="text-[11px] text-slate-500 truncate">Ajustar ritmo de aprendizagem</div>
                </div>
                <button
                  type="button"
                  onClick={onToggleGoalOverlay}
                  className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer"
                >
                  Ajustar
                </button>
              </div>
            ) : null}

            {!learningGoal && !onToggleGoalOverlay && (
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100/80 text-center space-y-1">
                <div className="text-xs font-bold text-slate-800">Define o teu próximo objectivo</div>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">Escolhe uma meta de aprendizagem para manteres um ritmo consistente.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRÓXIMA PRÁTICA */}
      <div className="pt-3 border-t border-slate-100">
        <div
          className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          aria-label="Próxima prática seleccionada"
        >
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <Sparkles size={16} className="text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 min-w-0">
              <div className="font-bold text-indigo-900 text-xs">
                Próxima Prática
              </div>
              {selectedScenarioTitle ? (
                <div className="text-[11px] leading-relaxed space-y-0.5">
                  <p className="font-semibold text-slate-800 truncate">{selectedScenarioTitle}</p>
                  {selectedScenarioDescription && (
                    <p className="text-slate-600 line-clamp-2 text-[10.5px]">{selectedScenarioDescription}</p>
                  )}
                  {selectedLanguageName && (
                    <p className="text-slate-500 text-[10px] font-medium">{selectedLanguageName}{proficiency ? ` · ${proficiency}` : ''}</p>
                  )}
                </div>
              ) : (
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Escolhe uma actividade para continuares a tua aprendizagem.
                </p>
              )}
            </div>
          </div>
          {onStartPractice && (
            <button
              type="button"
              onClick={onStartPractice}
              aria-label="Praticar próxima actividade"
              className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 rounded-lg transition shrink-0 cursor-pointer shadow-xs text-center"
            >
              Praticar agora
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});
WeeklyProgressSection.displayName = "WeeklyProgressSection";

export default function Dashboard(props: DashboardProps) {
  const { addToast } = useToast();
  const orientation = useDeviceOrientation();
  const [achievementsData, setAchievementsData] = useState<UserAchievements | null>(null);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [prevStreak, setPrevStreak] = useState<number | null>(null);

  // REALTIME FIRESTORE SUBSCRIPTIONS
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [realtimeNextClass, setRealtimeNextClass] = useState<any>(null);
  const [realtimeUserGamification, setRealtimeUserGamification] = useState<any>(null);
  const [isGamificationLoading, setIsGamificationLoading] = useState(true);
  const [isGamificationError, setIsGamificationError] = useState(false);

  useEffect(() => {
    // 1. Announcements Realtime Listener with tenant scoping
    const orgId = props.userProfile?.tenantId || props.userProfile?.organizationId;
    let unsubAnn: (() => void) | undefined;

    if (orgId) {
      const annQuery = query(
        collection(db, 'announcements'), 
        where('organizationId', '==', orgId), 
        where('isPublished', '==', true),
        limit(5)
      );
      unsubAnn = onSnapshot(annQuery, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });
        setAnnouncements(list);
      }, (err) => {
        console.warn('[Dashboard] Announcements snapshot listener notice:', err);
      });
    } else {
      setAnnouncements([]);
    }

    // 2. Schedules & Gamification Realtime Listeners
    const currentUser = auth.currentUser;
    let unsubClass: (() => void) | undefined;
    let unsubGamification: (() => void) | undefined;

    if (currentUser?.uid) {
      const classId = props.userProfile?.classId || props.userProfile?.turma;
      
      if (orgId && classId) {
        const schedQuery = query(
          collection(db, 'schedules'), 
          where('organizationId', '==', orgId),
          where('classId', '==', classId),
          where('status', '==', 'scheduled'),
          where('startTime', '>=', Timestamp.now()),
          orderBy('startTime', 'asc'),
          limit(1)
        );

        unsubClass = onSnapshot(schedQuery, (snap) => {
          if (!snap.empty) {
            setRealtimeNextClass(snap.docs[0].data());
          } else {
            setRealtimeNextClass(null);
          }
        }, (err) => {
          console.warn('[Dashboard] Schedules snapshot listener notice:', err);
          setRealtimeNextClass(null);
        });
      } else {
        setRealtimeNextClass(null);
      }

      const gamificationRef = doc(db, 'user_gamification', currentUser.uid);
      unsubGamification = onSnapshot(gamificationRef, (snapDoc) => {
        setIsGamificationLoading(false);
        if (snapDoc.exists()) {
          setRealtimeUserGamification(snapDoc.data());
        } else {
          setRealtimeUserGamification(null);
        }
      }, (err) => {
        console.warn('[Dashboard] Gamification snapshot listener notice:', err);
        setIsGamificationLoading(false);
        setIsGamificationError(true);
      });
    }

    return () => {
      if (unsubAnn) unsubAnn();
      if (unsubClass) unsubClass();
      if (unsubGamification) unsubGamification();
    };
  }, [props.userProfile, props.userId]);

  useEffect(() => {
    if (props.streakData && props.streakData.count !== undefined) {
      if (prevStreak !== null && props.streakData.count > prevStreak) {
        setShowStreakCelebration(true);
        
        // Trigger confetti rain when reaching consistency milestones (3, 7, 14, 21, 30, 50, 75, 100 days)
        const currentCount = props.streakData.count;
        const milestones = [3, 7, 14, 21, 30, 50, 75, 100];
        const isMultipleOf7 = currentCount > 0 && currentCount % 7 === 0;
        
        if (milestones.includes(currentCount) || isMultipleOf7) {
          setShowConfetti(true);
          addToast(`🎉 Parabéns pela sua consistência de ${currentCount} dias!`, 'success');
        }
      }
      setPrevStreak(props.streakData.count);
    }
  }, [props.streakData?.count]);
  const { localization, activeCountry, ot: translate, formatCurrency, formatDate: contextFormatDate, formatNumber } = useLocalization();
  const [, setDummy] = useState({});

  useLanguageChanged(() => setDummy({}));

  const [goal, setGoal] = useState<number>(30); // Default 30 mins

  useEffect(() => {
    const savedGoal = localStorage.getItem('dailyPracticeGoal');
    if (savedGoal) setGoal(parseInt(savedGoal, 10));
  }, []);

  const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newGoal = parseInt(e.target.value, 10) || 0;
    setGoal(newGoal);
    localStorage.setItem('dailyPracticeGoal', newGoal.toString());
  };

  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const triggerGoalReminder = useCallback(async (isSimulation = false) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const sessionsToday = props.streakData.history.filter(h => h === todayStr).length;
    const minutesToday = sessionsToday * 20;
    const currentGoal = parseInt(localStorage.getItem('dailyPracticeGoal') || '30', 10);

    const hasMetGoal = minutesToday >= currentGoal;

    if (hasMetGoal && !isSimulation) {
      // Don't trigger if they already met the goal (unless it's a manual simulation)
      return;
    }

    const title = "Meta Diária LingoLIVE ⏰";
    const message = isSimulation && hasMetGoal
      ? `Simulação do Lembrete das 20h: Você já atingiu sua meta diária de ${currentGoal} min hoje! Excelente trabalho! Se não tivesse praticado, receberia este lembrete às 20h para fazer uma revisão rápida de 5 minutos.`
      : `Que tal uma revisão rápida de 5 minutos? Você praticou ${minutesToday} min hoje e sua meta diária é de ${currentGoal} min. Pratique para manter sua sequência de ${props.streakData.count} dias ativa!`;

    // Attempt HTML5 Web Notification
    let pushSuccess = false;
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body: message,
            icon: '/favicon.ico',
          });
          pushSuccess = true;
        } catch (e) {
          console.warn('Native notification failed, falling back to toast', e);
        }
      }
    }

    // Always show toast
    if (pushSuccess) {
      addToast("🔔 Notificação enviada para o seu dispositivo!", "success");
    } else {
      addToast(title, message);
    }
  }, [props.streakData, addToast]);

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
          addToast("🎉 Notificações ativadas com sucesso!", "Você receberá um lembrete se não cumprir sua meta diária até às 20:00.");
        } else if (permission === 'denied') {
          addToast("Aviso", "Notificações do navegador bloqueadas. Ative nas configurações do navegador para receber avisos.");
        }
      } catch (err) {
        console.error("Error requesting permission:", err);
      }
    } else {
      addToast("Aviso", "Este navegador não suporta notificações de área de trabalho.");
    }
  };
  
  const [simulatedTime, setSimulatedTime] = useState<string | null>(null);

  const [countdownInfo, setCountdownInfo] = useState<{
    minutes: number;
    seconds: number;
    isUrgent: boolean;
    isMet: boolean;
    activeWindow: boolean;
  }>({
    minutes: 0,
    seconds: 0,
    isUrgent: false,
    isMet: false,
    activeWindow: false
  });

  const calculateCountdown = useCallback(() => {
    const now = simulatedTime ? new Date(simulatedTime) : new Date();
    const target = new Date(now.getTime());
    target.setHours(20, 0, 0, 0);

    const diffMs = target.getTime() - now.getTime();
    const todayStr = now.toISOString().split("T")[0];
    const sessionsToday = props.streakData.history.filter(h => h === todayStr).length;
    const minutesToday = sessionsToday * 20;
    const currentGoal = parseInt(localStorage.getItem('dailyPracticeGoal') || '30', 10);
    const goalMet = minutesToday >= currentGoal;

    if (diffMs <= 0) {
      return {
        minutes: 0,
        seconds: 0,
        isUrgent: false,
        isMet: goalMet,
        activeWindow: false
      };
    }

    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    const isUrgent = diffMs < 30 * 60 * 1000; // less than 30 minutes left (between 19:30 and 20:00)

    return {
      minutes,
      seconds,
      isUrgent,
      isMet: goalMet,
      activeWindow: true
    };
  }, [props.streakData, simulatedTime]);

  useEffect(() => {
    const updateCountdown = () => {
      const info = calculateCountdown();
      setCountdownInfo(info);

      // Automated notification if under 30 minutes, goal is not met, and not notified yet today
      if (info.activeWindow && info.isUrgent && !info.isMet) {
        const now = simulatedTime ? new Date(simulatedTime) : new Date();
        const todayStr = now.toISOString().split("T")[0];
        
        // Use simulated key or standard key depending on whether we are simulating
        const storageKey = simulatedTime ? `last30MinWarningDate_simulated_${todayStr}` : `last30MinWarningDate_${todayStr}`;
        const alreadyNotified = localStorage.getItem(storageKey);

        if (!alreadyNotified) {
          localStorage.setItem(storageKey, "true");

          const title = "⏰ Prazo Limite Próximo (8 PM)";
          const message = `Faltam apenas ${info.minutes}m e ${info.seconds}s! Pratique para bater sua meta diária de conversação e garantir sua sequência de ${props.streakData.count} dias ativa!`;

          let pushSuccess = false;
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(title, {
                body: message,
                icon: '/favicon.ico',
              });
              pushSuccess = true;
            } catch (e) {
              console.warn('Native notification failed', e);
            }
          }

          if (pushSuccess) {
            addToast("🔔 Alerta de proximidade de meta enviado ao seu dispositivo!", "success");
          } else {
            addToast(title, message);
          }
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    // If simulatedTime is set, we also want to advance simulatedTime by 1 second every real second
    let simInterval: any = null;
    if (simulatedTime) {
      simInterval = setInterval(() => {
        setSimulatedTime(prev => {
          if (!prev) return null;
          const d = new Date(prev);
          d.setSeconds(d.getSeconds() + 1);
          return d.toISOString();
        });
      }, 1000);
    }

    return () => {
      clearInterval(interval);
      if (simInterval) clearInterval(simInterval);
    };
  }, [calculateCountdown, props.streakData.count, addToast, simulatedTime]);

  const profile = props.userProfile || (() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const stored = localStorage.getItem(`lingolive_user_sub_${currentUser.uid}`);
      if (stored) {
        try { return JSON.parse(stored); } catch (e) {}
      }
    }
    return null;
  })();

  const isKid = profile && profile.age !== undefined && profile.age < 12;
  const isTeen = profile && profile.age !== undefined && profile.age >= 12 && profile.age < 18;
  const isAdult = !isKid && !isTeen;

  // Dynamic gamified level & XP system
  // XP is server-owned. Never derive rewards from client state or sample baselines.
  const currentXp = Number(realtimeUserGamification?.xp ?? realtimeUserGamification?.totalXp ?? 0);

  // Determine Level numerical value and boundaries
  let levelNum = 1;
  let prevXpThreshold = 0;
  let nextXpThreshold = 1000;

  if (currentXp < 1000) {
    levelNum = 1;
    prevXpThreshold = 0;
    nextXpThreshold = 1000;
  } else if (currentXp < 2500) {
    levelNum = 2;
    prevXpThreshold = 1000;
    nextXpThreshold = 2500;
  } else if (currentXp < 5000) {
    levelNum = 3;
    prevXpThreshold = 2500;
    nextXpThreshold = 5000;
  } else if (currentXp < 8000) {
    levelNum = 4;
    prevXpThreshold = 5000;
    nextXpThreshold = 8000;
  } else {
    levelNum = 5;
    prevXpThreshold = 8000;
    nextXpThreshold = 12000;
  }

  const xpInCurrentLevel = currentXp - prevXpThreshold;
  const xpNeededForNextLevel = nextXpThreshold - prevXpThreshold;
  const progressPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNextLevel) * 100));

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

    // 2. Goal Check with triggerGoalReminder
    const checkGoalReminder = () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastReminderDate = localStorage.getItem('last8PMReminderDate');
      
      // If we already sent a reminder today, skip
      if (lastReminderDate === todayStr) {
        return;
      }

      const now = new Date();
      if (now.getHours() >= 20) {
        const currentGoal = parseInt(localStorage.getItem('dailyPracticeGoal') || '30', 10);
        const sessionsToday = props.streakData.history.filter(h => h === todayStr).length;
        const minutesToday = sessionsToday * 20;

        if (minutesToday < currentGoal) {
          triggerGoalReminder(false);
          localStorage.setItem('last8PMReminderDate', todayStr);
        }
      }
    };

    // Run initially
    checkGoalReminder();

    // Run every 10 minutes in case they leave the app open as it rolls past 8 PM
    const interval = setInterval(checkGoalReminder, 10 * 60 * 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [props.streakData, triggerGoalReminder]);

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

  // Helpers for top 4 action blocks
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const firstName = props.studentName;
  const hasStartedPractice = (props.streakData?.history?.length || 0) > 0 || (props.savedWords?.length || 0) > 0;
  const lessonProgressPercent = hasStartedPractice ? Math.min(100, Math.max(0, Math.round(progressPercent))) : 0;
  const nextClassScheduled = realtimeNextClass || profile?.nextClass || null;

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
        {/* TOP SECTION: 4 ACTION-ORIENTED BLOCKS (FIRST IN HIERARCHY AT TOP OF SCREEN) */}
        <div className="space-y-4">
          {/* BLOCO 1: Saudação Inteligente */}
          <GreetingCard
            firstName={firstName}
            formattedDate={contextFormatDate(new Date())}
            isLoading={props.syncState?.status === 'syncing'}
            isError={props.syncState?.status === 'error'}
          />

          {/* GRID FOR BLOCO 2 & BLOCO 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* BLOCO 2: Cartão Principal */}
            <MainLearningCard
              hasStartedPractice={hasStartedPractice}
              selectedLanguageName={props.selectedLanguage?.name}
              selectedLanguageFlag={props.selectedLanguage?.flag}
              scenarioTitle={props.selectedScenario?.title}
              scenarioDesc={props.selectedScenario?.description}
              lessonProgressPercent={lessonProgressPercent}
              onStartPractice={props.onStartPractice}
            />

            {/* BLOCO 3: Próxima Actividade */}
            <NextActivityWidget
              activity={nextClassScheduled ? {
                id: nextClassScheduled.id || '1',
                title: nextClassScheduled.title || "Aula de Conversação ao Vivo",
                date: nextClassScheduled.date,
                time: nextClassScheduled.time,
                teacher: nextClassScheduled.teacher,
                type: 'lesson'
              } : null}
              onNavigate={() => {
                if (nextClassScheduled) {
                  props.onStartPractice();
                } else if (props.onNavigate) {
                  props.onNavigate('live-calendar');
                } else {
                  props.onStartPractice();
                }
              }}
            />
          </div>

          {/* BLOCO 4: Resumo Rápido (Indicadores) */}
          <QuickSummaryIndicators
            currentXp={currentXp}
            streakHistory={props.streakData?.history || []}
            proficiency={props.selectedProficiency || profile?.proficiency || "A1-A2"}
            progressPercent={progressPercent}
          />
        </div>

        {/* SECÇÃO: PROGRESSO DA SEMANA (RENDERIZADA IMEDIATAMENTE DEPOIS DOS QUATRO BLOCOS PRINCIPAIS) */}
        <WeeklyProgressSection
          streakHistory={props.streakData?.history}
          savedWords={props.savedWords}
          learningGoal={profile?.learningGoal}
          selectedScenarioTitle={props.selectedScenario?.title}
          selectedScenarioDescription={props.selectedScenario?.description}
          selectedLanguageName={props.selectedLanguage?.name}
          proficiency={props.selectedProficiency || profile?.proficiency}
          onStartPractice={props.onStartPractice}
          onToggleGoalOverlay={props.toggleGoalOverlay}
          onNavigate={props.onNavigate}
        />

        {/* Streak Protection Warning Banner (Active when streak is at risk) */}
        <StreakProtectionBanner
          streakData={props.streakData}
          onActivateInstantFreeze={() => props.onProtectStreakWithPoints?.()}
          onStartPractice={props.onStartPractice}
        />

        {/* Manage Subscription Status Widget */}
        <SubscriptionStatusWidget
          planId={props.userProfile?.subscriptionPlanId || props.userProfile?.accountStatus?.planId}
          subscriptionStatus={props.userProfile?.subscriptionStatus || props.userProfile?.accountStatus?.subscriptionStatus || 'active'}
          subscriptionActive={props.userProfile?.subscriptionActive || props.userProfile?.accountStatus?.isActive}
          paidUntil={props.userProfile?.subscriptionExpiresAt || props.userProfile?.accountStatus?.expiresAt}
          onManagePlan={() => props.onNavigate ? props.onNavigate('subscription-plans') : null}
        />

        {/* Gamification Hub */}
        <GamificationWidget data={realtimeUserGamification} isLoading={isGamificationLoading} isError={isGamificationError} />

        {/* Dashboard Action Toolbar */}
        <DashboardHeader
          studentName={props.studentName}
          onShare={handleShare}
          onGenerateReport={() => generateWeeklyReportPDF(props.studentName, userWeeklyMinutes, props.streakData.count, props.achievements)}
          levelNum={levelNum}
          currentXp={currentXp}
          nextXpThreshold={nextXpThreshold}
          progressPercent={progressPercent}
          profile={profile}
          syncState={props.syncState}
          onForceSync={props.onForceSync}
        />

        {/* Daily Tip Alert */}
        <DailyTip selectedLanguage={props.selectedLanguage} />

        {/* Personalized Interactive Profiles Hub */}
        {profile && (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-xl text-xs font-extrabold tracking-wider uppercase text-white ${
                isKid ? "bg-amber-500" : isTeen ? "bg-cyan-500" : "bg-indigo-500"
              }`}>
                {isKid ? "🎮 Espaço Kids" : isTeen ? "⚡ Liga Teen" : "💼 Perfil Profissional"}
              </span>
              <span className="text-xs text-slate-400 font-bold uppercase">Personalização IA</span>
            </div>

            {/* KID INTERFACE */}
            {isKid && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { title: "🧩 Quebra-Cabeça", desc: "Junte as letras de animais e frutas!", icon: "🧩", color: "from-pink-500/10 to-pink-500/5 hover:border-pink-300" },
                    { title: "🐼 Panda Aventura", desc: "Fale com o ursinho respondendo por voz!", icon: "🐼", color: "from-amber-500/10 to-amber-500/5 hover:border-amber-300" },
                    { title: "🎨 Pinte e Aprenda", desc: "Ouça as cores e pinte lindos desenhos!", icon: "🎨", color: "from-emerald-500/10 to-emerald-500/5 hover:border-emerald-300" },
                    { title: "🎵 Karaokê Kids", desc: "Cante canções alegres para praticar!", icon: "🎵", color: "from-violet-500/10 to-violet-500/5 hover:border-violet-300" }
                  ].map((game, idx) => (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-2xl border border-slate-100 bg-gradient-to-br ${game.color} transition-all cursor-pointer shadow-xs`}
                      onClick={props.onStartQuiz}
                    >
                      <div className="text-3xl mb-2">{game.icon}</div>
                      <h4 className="font-bold text-xs text-slate-800 mb-0.5">{game.title}</h4>
                      <p className="text-[10px] text-slate-500 leading-normal">{game.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-900 font-medium">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🪙</span>
                    <div>
                      <div><strong>Estrela da Sorte Ativa!</strong></div>
                      <div className="text-[10px] text-amber-800 font-normal">Complete {props.savedWords.length > 0 ? `${props.savedWords.length}/5` : "0/5"} palavras para ganhar 20 Moedas Mágicas!</div>
                    </div>
                  </div>
                  <button 
                    onClick={props.onViewSavedVocab}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-3.5 py-1.5 rounded-xl text-[10px] cursor-pointer"
                  >
                    Ver Minhas Palavras
                  </button>
                </div>
              </div>
            )}

            {/* TEEN INTERFACE */}
            {isTeen && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div 
                    onClick={props.onStartQuiz}
                    className="p-5 rounded-2xl border border-slate-100 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 hover:border-cyan-300 transition-all cursor-pointer"
                  >
                    <div className="text-2xl mb-1.5">⚔️</div>
                    <h4 className="font-extrabold text-xs text-slate-800 mb-1">Duelo de Vocabulário</h4>
                    <p className="text-[10px] text-slate-500 leading-normal">Desafie amigos ou responda a um quiz contra o tempo para ganhar bônus de XP!</p>
                  </div>
                  <div 
                    onClick={props.onStartPractice}
                    className="p-5 rounded-2xl border border-slate-100 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 hover:border-indigo-300 transition-all cursor-pointer"
                  >
                    <div className="text-2xl mb-1.5">⚡</div>
                    <h4 className="font-extrabold text-xs text-slate-800 mb-1">Quest Diária de Áudio</h4>
                    <p className="text-[10px] text-slate-500 leading-normal">Grave 3 mensagens com o Professor de IA para destravar novas gírias exclusivas.</p>
                  </div>
                  <div 
                    onClick={props.onViewLearningPath}
                    className="p-5 rounded-2xl border border-slate-100 bg-gradient-to-br from-purple-500/10 to-purple-500/5 hover:border-purple-300 transition-all cursor-pointer"
                  >
                    <div className="text-2xl mb-1.5">📜</div>
                    <h4 className="font-extrabold text-xs text-slate-800 mb-1">Certificados de Conclusão</h4>
                    <p className="text-[10px] text-slate-500 leading-normal">Pratique {props.streakData.count}/30 dias consecutivos para solicitar seu primeiro certificado oficial!</p>
                  </div>
                </div>
              </div>
            )}

            {/* ADULT INTERFACE & GOALS */}
            {isAdult && (
              <div className="space-y-3">
                {profile.learningGoal === "Trabalho" || profile.learningGoal === "Negócios" ? (
                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm">👔 Business English Hub</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer" onClick={props.onStartPractice}>
                        <div className="font-bold text-xs text-slate-800 mb-1">📞 Reuniões Internacionais</div>
                        <p className="text-[10px] text-slate-500">Pratique apresentação de relatórios, negociações em inglês e oratória profissional.</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer" onClick={props.onStartPractice}>
                        <div className="font-bold text-xs text-slate-800 mb-1">✉️ Redação de E-mails & Propostas</div>
                        <p className="text-[10px] text-slate-500">Aprenda conectivos de negócios, redação formal de e-mails comerciais e termos legais.</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer" onClick={props.onStartPractice}>
                        <div className="font-bold text-xs text-slate-800 mb-1">🤝 Simulador de Entrevista de Emprego</div>
                        <p className="text-[10px] text-slate-500">Responda a perguntas complexas de RH e aprenda a destacar suas principais conquistas.</p>
                      </div>
                    </div>
                  </div>
                ) : profile.learningGoal === "Viagens" ? (
                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm">✈️ Imersão para Viagens</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer" onClick={props.onStartPractice}>
                        <div className="font-bold text-xs text-slate-800 mb-1">🛂 Aeroporto & Imigração</div>
                        <p className="text-[10px] text-slate-500">Simule responder a perguntas de segurança, controle de passaportes e retirada de bagagem.</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer" onClick={props.onStartPractice}>
                        <div className="font-bold text-xs text-slate-800 mb-1">🏨 Check-in no Hotel & Serviços</div>
                        <p className="text-[10px] text-slate-500">Como registrar sua reserva, solicitar serviços especiais de quarto e pedir orientações locais.</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer" onClick={props.onStartPractice}>
                        <div className="font-bold text-xs text-slate-800 mb-1">🍽️ Restaurantes & Transportes</div>
                        <p className="text-[10px] text-slate-500">Pratique pedir pratos e bebidas, pedir a conta com elegância e comprar bilhetes de metrô ou trem.</p>
                      </div>
                    </div>
                  </div>
                ) : profile.learningGoal === "Universidade" || profile.learningGoal === "Escola" || profile.learningGoal === "Exames" ? (
                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm">📚 Hub Acadêmico e Exames Oficiais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer" onClick={props.onStartPractice}>
                        <div className="font-bold text-xs text-slate-800 mb-1">📝 Redação e Artigos</div>
                        <p className="text-[10px] text-slate-500">Domine regras gramaticais formais, citações corretas e conectivos acadêmicos avançados.</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer" onClick={props.onStartPractice}>
                        <div className="font-bold text-xs text-slate-800 mb-1">📑 Preparatório TOEFL / IELTS</div>
                        <p className="text-[10px] text-slate-500">Simule testes orais reais cronometrados sob pressão com feedback imediato de IA.</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer" onClick={props.onStartPractice}>
                        <div className="font-bold text-xs text-slate-800 mb-1">📖 Análise de Textos Complexos</div>
                        <p className="text-[10px] text-slate-500">Aumente sua velocidade de leitura, capte a ideia principal e expanda seu vocabulário acadêmico.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm">🗣️ Prática Geral de Idiomas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer" onClick={props.onStartPractice}>
                        <div className="font-bold text-xs text-slate-800 mb-1">💬 Conversas do Dia a Dia</div>
                        <p className="text-[10px] text-slate-500">Pratique falar sem pressão sobre seus hobbies, rotina, gostos musicais e muito mais.</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer" onClick={props.onStartPractice}>
                        <div className="font-bold text-xs text-slate-800 mb-1">🎭 Imersão Cultural & Gírias</div>
                        <p className="text-[10px] text-slate-500">Explore como os nativos realmente falam nas ruas, conheça piadas e referências culturais.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
          >
            <ConversationWizard
              userId={props.userId}
              userEmail={props.userEmail}
              onStartSession={props.onStartWizardSession}
            />
          </motion.div>
        )}

        {/* Streak & Achievements (Integrated) */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className={`grid ${
            orientation === 'landscape' ? 'grid-cols-2 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-6'
          }`}
        >
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-orange-500 flex flex-col justify-between group hover:shadow-md transition-all duration-300">
              <div>
                <h2 className="font-bold text-lg mb-2 flex items-center gap-2 text-orange-600">
                  <motion.span
                    animate={{
                      scale: [1, 1.15, 1],
                      rotate: [0, -5, 5, 0],
                    }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }}
                    className="inline-block"
                  >
                    <Flame className="text-orange-500 fill-orange-500/20" />
                  </motion.span>
                  Sequência: {props.streakData.count} dias
                </h2>
                <p className="text-slate-500 text-sm mb-4">Você está com tudo! Cada dia de prática fortalece o seu aprendizado.</p>
                
                {achievementsData && (() => {
                  const incompleteBadges = (Object.values(achievementsData.badges) as Badge[]).filter(b => !b.unlockedAt);
                  if (incompleteBadges.length === 0) return <p className="text-xs text-emerald-600 font-semibold mb-4">Todas as conquistas desbloqueadas!</p>;
                  
                  const nextBadge = incompleteBadges.sort((a,b) => (b.progress / b.totalRequired) - (a.progress / a.totalRequired))[0];
                  const percent = Math.min(100, Math.round((nextBadge.progress / nextBadge.totalRequired) * 100));
                  
                  return (
                    <div className="space-y-1 mb-4">
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

                {/* Streak Freeze & Practice Points Mechanism */}
                <div className="my-4 p-3.5 bg-sky-50/50 rounded-xl border border-sky-100/60 text-slate-700">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Award size={14} className="text-indigo-500" />
                      <span>Pontos de Prática:</span>
                    </div>
                    <span className="bg-indigo-600 text-white font-black px-2 py-0.5 rounded-full text-[10px] min-w-[24px] text-center shadow-xs">
                      {props.streakData.practicePoints ?? 100} PTS
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Snowflake size={14} className="text-sky-500" />
                      <span>Congeladores Ativos:</span>
                    </div>
                    <span className="bg-sky-500 text-white font-black px-2 py-0.5 rounded-full text-[10px] min-w-[24px] text-center shadow-xs">
                      {props.streakData.streakFreezes ?? 0} un
                    </span>
                  </div>

                  {/* Purchase Button */}
                  <button
                    onClick={props.onBuyStreakFreeze}
                    disabled={(props.streakData.practicePoints ?? 100) < 50}
                    className={`w-full py-1.5 px-3 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                      (props.streakData.practicePoints ?? 100) >= 50
                        ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    <Snowflake size={11} />
                    Comprar Congelamento de Ofensiva (50 PTS)
                  </button>

                  {/* On-the-spot protection banner if streak is at risk */}
                  {(() => {
                    const getDaysDifferenceFromToday = (dateStr: string) => {
                      if (!dateStr) return 0;
                      const today = new Date();
                      const year = today.getFullYear();
                      const month = String(today.getMonth() + 1).padStart(2, "0");
                      const day = String(today.getDate()).padStart(2, "0");
                      const todayStr = `${year}-${month}-${day}`;
                      
                      const lastDateObj = new Date(dateStr + "T12:00:00");
                      const todayObj = new Date(todayStr + "T12:00:00");
                      const diffTime = todayObj.getTime() - lastDateObj.getTime();
                      return Math.round(diffTime / (1000 * 60 * 60 * 24));
                    };

                    const diffDays = props.streakData.lastDate ? getDaysDifferenceFromToday(props.streakData.lastDate) : 0;
                    const isAtRisk = diffDays > 1;

                    if (isAtRisk && (props.streakData.streakFreezes ?? 0) === 0) {
                      return (
                        <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-200 text-slate-700 text-[10px] leading-relaxed flex flex-col gap-1.5 animate-pulse">
                          <span className="font-extrabold text-amber-800">
                            ⚠️ Sequência em Risco! Você não praticou ontem. Deseja gastar 50 PTS para congelar e salvar sua sequência agora mesmo?
                          </span>
                          <button
                            onClick={props.onProtectStreakWithPoints}
                            disabled={(props.streakData.practicePoints ?? 100) < 50}
                            className="w-full py-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-md shadow-xs border border-amber-700 text-[10px] cursor-pointer"
                          >
                            Congelar e Salvar Ofensiva (50 PTS)
                          </button>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Action and test triggers */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    props.onSimulatePastPractice(0);
                    addToast("Prática de hoje registrada! Sua sequência foi atualizada.", "success");
                  }}
                  className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm border border-orange-100/30"
                >
                  <Flame size={13} className="text-orange-500 fill-orange-500/10 animate-bounce" />
                  Registrar Prática de Hoje
                </button>
                <button
                  onClick={() => {
                    setShowStreakCelebration(true);
                    setShowConfetti(true);
                  }}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm border border-indigo-100/30"
                >
                  <Sparkles size={13} className="text-indigo-500" />
                  Visualizar Animação
                </button>
                <button
                  onClick={props.toggleGoalOverlay}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm border border-indigo-100/30"
                >
                  <Target size={13} className="text-indigo-500" />
                  Ver Meta Diária
                </button>
              </div>
            </div>
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Trophy className="text-amber-500"/> Conquistas</h2>
             <p className="text-slate-500 text-sm">{props.achievements.filter(a => a.unlockedAt).length} desbloqueadas</p>
           </div>
        </motion.div>

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

        {/* Painel Geral de Progresso, Metas & Idioma */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.25 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-12 gap-6 w-full"
        >
          {/* Card 1: Seletor de Idiomas */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 xl:col-span-4 flex flex-col justify-between hover:shadow-md transition-all duration-200">
             <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                     <span className="text-xl">🌐</span> Idioma de Estudo
                  </h3>
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                     {props.selectedLanguage.name}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                   Selecione abaixo para alternar instantaneamente o seu idioma de foco:
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                   {LANGUAGES.map((lang) => {
                      const isSelected = props.selectedLanguage.code === lang.code;
                      return (
                         <button
                           key={lang.code}
                           onClick={() => props.setSelectedLanguage(lang)}
                           className={`p-3 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm ring-1 ring-indigo-300/30 font-bold'
                                : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-600'
                           }`}
                         >
                            <span className="text-xl filter drop-shadow-xs">{lang.flag}</span>
                            <span className="text-xs truncate">{lang.name.split(" ")[0]}</span>
                         </button>
                      );
                   })}
                </div>
             </div>
             
             {/* Info sub-box */}
             <div className="mt-5 pt-4 border-t border-slate-100/80 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-xs">
                   {props.selectedLanguage.code.toUpperCase()}
                </div>
                <div className="text-left">
                   <span className="text-[10px] text-slate-400 font-bold uppercase block">Voz Padrão IA</span>
                   <span className="text-xs font-semibold text-slate-700">{props.selectedLanguage.defaultVoice || "Feminina"}</span>
                </div>
             </div>
          </div>

          {/* Card 2: Metas de Estudo */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 xl:col-span-4 flex flex-col justify-between hover:shadow-md transition-all duration-200">
             <div className="w-full">
                <DailyGoalTracker
                    streakData={props.streakData}
                    isLoading={props.syncState?.status === 'syncing'}
                    isError={props.syncState?.status === 'error'}
                />

                {/* Lembrete 20h */}
                <div className="mt-4 p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        ⏰ Lembrete das 20:00
                     </span>
                     <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${
                        notificationPermission === 'granted' 
                           ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                           : notificationPermission === 'denied' 
                              ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                              : 'bg-amber-100 text-amber-700 border border-amber-200'
                     }`}>
                        {notificationPermission === 'granted' 
                           ? 'Push Ativo ✓' 
                           : notificationPermission === 'denied' 
                              ? 'Bloqueado ⚠️' 
                              : 'In-App Toast 🔔'}
                     </span>
                  </div>
                  
                  <p className="text-[10px] text-slate-500 leading-normal">
                     Receba um alerta se não cumprir sua meta diária de estudos de conversação até às 20h, sugerindo uma revisão de 5 min.
                  </p>

                  {/* Countdown Timer Section */}
                  {countdownInfo.activeWindow && (
                     <div className={`p-2 rounded-lg border ${
                        countdownInfo.isMet 
                           ? 'bg-emerald-50/50 border-emerald-100' 
                           : countdownInfo.isUrgent 
                              ? 'bg-rose-50 border-rose-200 animate-pulse' 
                              : 'bg-indigo-50/50 border-indigo-100'
                     } space-y-1`}>
                        <div className="flex items-center justify-between text-xs">
                           <span className="font-semibold text-slate-700">Prazo das 20h:</span>
                           {countdownInfo.isMet ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                 Meta batida hoje! 🎉
                              </span>
                           ) : (
                              <span className={`font-mono font-bold ${
                                 countdownInfo.isUrgent ? 'text-rose-600' : 'text-indigo-600'
                              }`}>
                                 {countdownInfo.minutes.toString().padStart(2, '0')}m : {countdownInfo.seconds.toString().padStart(2, '0')}s
                              </span>
                           )}
                        </div>
                        {!countdownInfo.isMet && (
                           <div className="text-[9px] text-slate-500 flex items-center justify-between">
                              <span>Status: {countdownInfo.isUrgent ? '⚠️ Prazo Crítico!' : 'Em andamento'}</span>
                              <span>Complete mais estudos</span>
                            </div>
                        )}
                     </div>
                  )}

                  <div className="flex items-center flex-wrap gap-2 pt-1">
                     {notificationPermission === 'default' && (
                        <button
                           onClick={requestNotificationPermission}
                           className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded transition flex items-center gap-1 border border-indigo-200/50"
                        >
                           Ativar Push
                        </button>
                     )}
                     <button
                        onClick={() => triggerGoalReminder(true)}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded transition flex items-center gap-1 border border-slate-200"
                     >
                        ⚡ Testar Lembrete
                     </button>

                     {/* Simulation controls */}
                     {!simulatedTime ? (
                        <button
                           onClick={() => {
                              const simDate = new Date();
                              simDate.setHours(19, 45, 0, 0); // 19:45 (under 30 mins)
                              setSimulatedTime(simDate.toISOString());
                              // Reset warning so simulation trigger immediately fires the notification
                              localStorage.removeItem(`last30MinWarningDate_simulated_${simDate.toISOString().split("T")[0]}`);
                              addToast("⏰ Simulação iniciada!", "A simular hora atual: 19:45. Menos de 30 minutos restantes!");
                           }}
                           className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded transition flex items-center gap-1 border border-amber-200"
                        >
                           🧪 Simular 19:45 (Urgente)
                        </button>
                     ) : (
                        <button
                           onClick={() => {
                              setSimulatedTime(null);
                              addToast("Simulação Terminada", "Voltando ao horário real do dispositivo.");
                           }}
                           className="text-[10px] bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold px-2 py-1 rounded transition flex items-center gap-1 border border-rose-200"
                        >
                           ⏹ Parar Simulação ({new Date(simulatedTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})})
                        </button>
                     )}
                  </div>
                </div>
             </div>

             <div className="mt-5 pt-4 border-t border-slate-100/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                   <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   Status do dia:
                </span>
                <span className={`font-bold ${
                   (() => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const sessionsToday = props.streakData.history.filter(h => h === todayStr).length;
                      const minutesToday = sessionsToday * 20;
                      return minutesToday >= goal;
                   })() ? 'text-emerald-600' : 'text-amber-500'
                }`}>
                   {(() => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const sessionsToday = props.streakData.history.filter(h => h === todayStr).length;
                      const minutesToday = sessionsToday * 20;
                      return minutesToday >= goal;
                   })() ? 'Meta Concluída! 🎉' : 'Pratique para atingir!'}
                </span>
             </div>
          </div>

          {/* Card 3: Estatísticas de Aprendizado */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 xl:col-span-4 flex flex-col justify-between hover:shadow-md transition-all duration-200">
             <div>
                <h3 className="font-bold text-base text-slate-800 flex items-center gap-2 mb-4">
                   <span className="text-xl">📊</span> Estatísticas de Aprendizado
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                   Resumo consolidado do seu rendimento de prática recente e vocabulário:
                </p>

                <div className="grid grid-cols-3 gap-3">
                   {/* Palavras Salvas */}
                   <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100/80 hover:border-indigo-100 hover:bg-white hover:shadow-xs transition-all duration-200">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center mb-2.5">
                         <BookMarked className="text-indigo-600" size={14} />
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">Expressões</span>
                      <span className="text-lg font-bold text-indigo-950 block mt-0.5">{props.savedWords.length}</span>
                   </div>

                   {/* Sessões Concluídas */}
                   <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100/80 hover:border-emerald-100 hover:bg-white hover:shadow-xs transition-all duration-200">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center mb-2.5">
                         <CheckCircle className="text-emerald-600" size={14} />
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">Sessões</span>
                      <span className="text-lg font-bold text-indigo-950 block mt-0.5">{props.sessionTranscript.length > 0 ? 1 : 0}</span>
                   </div>

                   {/* Minutos Totais */}
                   <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100/80 hover:border-orange-100 hover:bg-white hover:shadow-xs transition-all duration-200">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center mb-2.5">
                         <Clock className="text-orange-500" size={14} />
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block truncate">Minutos</span>
                      <span className="text-lg font-bold text-indigo-950 block mt-0.5"><StudyTimeTracker userId={props.userId} /></span>
                   </div>
                </div>
             </div>

             <div className="mt-5 pt-4 border-t border-slate-100/80 flex items-center justify-between text-xs text-slate-500">
                <span>Sequência active:</span>
                <span className="font-bold text-orange-600 flex items-center gap-1 font-mono">
                   <StudyStreakTracker history={props.streakData?.history || []} />
                </span>
             </div>
          </div>
        </motion.div>

        {/* Weekly Performance Chart */}
        <UserGrowthChart streakData={props.streakData} />

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

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.55 }}
        >
          <InteractiveLearningAnalytics streakData={props.streakData} />
        </motion.div>
        <StudyScheduler />
      </div>

      {/* Right Sidebar */}
      <div className={`w-full lg:w-80 flex flex-col ${
        orientation === 'landscape' ? 'p-1.5 gap-3' : 'p-3 sm:p-6 gap-4 sm:gap-6'
      }`}>

         <Leaderboard userId={props.userId} userProfile={props.userProfile} />
         <WeeklyComparisonChart 
           userMinutes={userWeeklyMinutes} 
           classId={props.userProfile?.classId || props.userProfile?.turma}
           organizationId={props.userProfile?.tenantId || props.userProfile?.organizationId}
         />
         
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1">
           <div className="flex justify-between items-center mb-6">
             <h2 className="font-bold text-lg">Aviso Diário</h2>
             <span className="text-indigo-600 text-sm font-medium cursor-pointer hover:underline">Ver tudo</span>
           </div>
           <div className="space-y-4">
             {announcements.length === 0 ? (
               <div className="py-6 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                 Sem avisos pendentes para hoje.
               </div>
             ) : (
               announcements.map((n, i) => (
                 <div key={n.id || i} className="group cursor-pointer bg-slate-50/50 hover:bg-slate-50 p-3 rounded-xl border border-slate-100 transition">
                   <div className="font-bold text-xs text-slate-800 group-hover:text-indigo-600 transition-colors">{n.title}</div>
                   <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{n.description || n.desc}</div>
                   <div className="text-indigo-600 text-[10px] font-bold mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     Ver mais <ChevronRight size={12} />
                   </div>
                 </div>
               ))
             )}
           </div>
         </div>
      </div>

      {/* Celebration Modal Overlay */}
      <AnimatePresence>
        {showStreakCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setShowStreakCelebration(false)}
          >
            {/* Ambient fire/light effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.15)_0%,transparent_70%)] pointer-events-none" />

            {/* Sparkles / Fire particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
              {[...Array(16)].map((_, i) => {
                const angle = (i / 16) * 360;
                const radians = (angle * Math.PI) / 180;
                const x = Math.cos(radians) * 200;
                const y = Math.sin(radians) * 200;
                return (
                  <motion.div
                    key={i}
                    className="absolute w-3 h-3 rounded-full bg-gradient-to-t from-orange-500 via-amber-400 to-red-500 shadow-lg shadow-orange-500/50"
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
                    animate={{
                      x: [0, x * 1.2, x * 1.5],
                      y: [0, y * 1.2, y * 1.5 - 60],
                      opacity: [1, 0.9, 0],
                      scale: [0.5, 1.3, 0],
                    }}
                    transition={{
                      duration: 2.2,
                      ease: "easeOut",
                      repeat: Infinity,
                      repeatDelay: 0.3,
                      delay: i * 0.1,
                    }}
                  />
                );
              })}
            </div>

            {/* Celebration card container */}
            <motion.div
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ 
                scale: 1, 
                y: 0, 
                opacity: 1,
                transition: { type: "spring", damping: 15, stiffness: 100 } 
              }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              className="relative max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 text-center shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-6 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Rotating background rays */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute -top-24 w-96 h-96 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(249,115,22,0.06)_60deg,transparent_120deg,rgba(249,115,22,0.06)_240deg,transparent_300deg)] rounded-full pointer-events-none"
              />

              {/* Huge animated Flame badge */}
              <div className="relative">
                {/* Outer pulsing ring */}
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -inset-4 rounded-full bg-orange-500/20 blur-xl"
                />
                <motion.div
                  animate={{ 
                    scale: [1, 1.12, 1],
                    rotate: [0, -6, 6, 0],
                  }}
                  transition={{ 
                    duration: 1.6, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-24 h-24 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-xl shadow-orange-500/30"
                >
                  <Flame size={48} className="fill-white/10 filter drop-shadow-md" />
                </motion.div>
              </div>

              {/* Title and texts */}
              <div className="space-y-2 z-10">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-xs font-black uppercase tracking-widest rounded-full"
                >
                  <Sparkles size={12} className="animate-pulse" />
                  NOVA MARCA DIÁRIA!
                </motion.div>
                
                <motion.h3
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
                  className="text-2xl font-black text-slate-900 dark:text-white"
                >
                  Sequência Incrível!
                </motion.h3>
                
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
                  className="text-slate-600 dark:text-slate-300 text-sm max-w-sm leading-relaxed"
                >
                  Você atingiu a fantástica marca de{" "}
                  <span className="text-orange-500 font-extrabold text-lg block my-1">
                    <StudyStreakTracker history={props.streakData?.history || []} />
                  </span>{" "}
                  Seu aprendizado está fluindo como nunca. Continue praticando para manter sua chama acesa e proteger seu progresso!
                </motion.p>
              </div>

              {/* Reward feedback or badge progress */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1, transition: { delay: 0.5 } }}
                className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 z-10 flex items-center gap-3.5"
              >
                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                  <Trophy size={20} className="animate-bounce" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">XP & Recompensas</div>
                  <div className="text-sm font-black text-slate-800 dark:text-slate-200">+120 XP acumulado de sequência</div>
                </div>
              </motion.div>

              {/* Action Button */}
              <motion.button
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.6 } }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowStreakCelebration(false)}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm shadow-lg shadow-orange-500/20 transition cursor-pointer z-10 flex items-center justify-center gap-2"
              >
                <span>Continuar Aprendendo</span>
                <ChevronRight size={16} />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfettiRain active={showConfetti} onComplete={() => setShowConfetti(false)} />
   </motion.div>
  );
}
