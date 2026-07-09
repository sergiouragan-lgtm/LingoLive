
export interface Localization {
  country: string;
  language: string;
  currency: string;
}

export type SubscriptionPlan = 'Free' | 'Premium';
export type UserRole = 'student' | 'teacher' | 'parent' | 'school_admin' | 'admin';

export type AppView = "dashboard" | "practice" | "feedback" | "vocab" | "quiz" | "admin-dashboard" | "educator-dashboard" | "area-escolar" | "area-escolar-b2b" | "area-professor" | "area-aluno" | "area-pais" | "live-chat" | "languages" | "live-sessions" | "community" | "profile" | "settings" | "subscription" | "subscription-plans" | "learning-path" | "pagamentos" | "marketing" | "criar-turma" | "adicionar-alunos" | "landing" | "onboarding" | "activation" | "school-registration" | "b2b-payment" | "school-management";

export interface Language {
  code: string;
  name: string;
  flag: string;
  defaultVoice: string;
}

export type Proficiency = "Beginner" | "Intermediate" | "Advanced";
export type AgeGroup = "Infancy" | "Kids" | "PreTeens" | "Teens";

export interface Scenario {
  id: string;
  title: string;
  description: string;
  iconName: string;
  promptContext: string;
}

export interface Voice {
  name: string;
  gender: "Male" | "Female";
  description: string;
}

export interface TranscriptItem {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
}

export interface GrammarMistake {
  original: string;
  corrected: string;
  explanation: string;
}

export interface VocabularyTip {
  word: string;
  definition: string;
  suggestion: string;
}

export interface FeedbackReport {
  overallScore: number;
  fluencyLevel: string;
  strengths: string[];
  grammarMistakes: GrammarMistake[];
  vocabularyTips: VocabularyTip[];
  pronunciationTips: string[];
  encouragingSummary: string;
}

export interface SavedWord {
  id: string;
  word: string;
  meaning: string;
  pronunciation: string;
  grammarNote: string;
  exampleOriginal: string;
  exampleTranslation: string;
  savedAt: string;
}

export interface StreakData {
  count: number;
  lastDate: string;
  history: string[];
}

export interface Achievement {
  id: string;
  userId: string;
  title: string;
  description: string;
  iconName: string;
  unlockedAt?: Date;
  progress: number;
  totalRequired: number;
}

export interface PlatformFeatures {
  practiceRoom: boolean;
  languageQuiz: boolean;
  liveChat: boolean;
  vocabDeck: boolean;
  educatorDashboard: boolean;
}

export interface School {
  id: string;
  nome: string;
  planoAssinatura: string;
  dadosPagamento: string;
  country: string;
  plan: 'school_basic' | 'school_pro';
  studentsLimit: number;
  teachersLimit: number;
  createdAt: Date;
  name: string;
}

export interface Teacher {
  uid: string;
  nome: string;
  email: string;
  telefone: string;
  idioma: string;
  sala: string;
  turno: string;
  invitationCode: string;
  schoolId: string;
  allowedClassIds?: string[];
}

export interface Class {
  id: string;
  name: string;
  teacherUid: string;
  studentUids: string[];
}

export interface Student {
  uid: string;
  name: string;
  age: number;
  targetLanguage: string;
  teacherUid: string;
}

export interface SchoolMetrics {
  totalStudents: number;
  licenseLimit: number;
  totalWordsLearned: number;
  averageStreak: number;
  activeTeachers: number;
}

export interface StudentPracticeActivity {
  date: string;
  activity: string;
}

export interface VocabularyMastery {
  word: string;
  masteryLevel: number;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  streak: number;
  avatar: string;
}
export interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  timestamp: string;
}

export interface StudentPerformance {
  studentName: string;
  targetLanguage: string;
  performanceScore: number;
  lastPractice: string;
  timeline: StudentPracticeActivity[];
  vocabularyMastery: VocabularyMastery[];
  transcripts: TranscriptItem[];
}

export interface ClassReport {
  className: string;
  commonErrors: string[];
  students: StudentPerformance[];
}

export interface ServiceHealthItem {
  status: 'healthy' | 'unhealthy';
  latencyMs: number;
  error?: string;
}

export interface ServiceHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    firestore: ServiceHealthItem;
    gemini: ServiceHealthItem;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  languageNative: string;
  languageLearning: string[];
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  xp: number;
  coins: number;
  streak: number;
  createdAt: Date;
}

export interface Lesson {
  id: string;
  language: string;
  level: string;
  title: string;
  content: string;
  xpReward: number;
}

export interface AiSession {
  id: string;
  userId: string;
  type: 'conversation' | 'correction' | 'tutoring' | 'roleplay' | 'lesson';
  messages: { role: 'user' | 'assistant', text: string }[];
}

export interface QuizResult {
  id: string;
  userId: string;
  lessonId: string;
  score: number;
  createdAt: Date;
}
