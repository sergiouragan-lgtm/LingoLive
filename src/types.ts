
import {
  OfficialUserRole,
  LegacyUserRole,
  CompatibleUserRole,
  UserRole as NewUserRole,
  AgeGroup as OfficialAgeGroup,
  LegacyAgeGroup,
  CompatibleAgeGroup,
  AccountStatus,
  OnboardingStatus,
  IntelligentProfileStatus,
  AssessmentStatus,
  SubscriptionStatus,
  EntryFlowResolutionStatus,
  EntryDestination,
  EntryFlowErrorCode,
  EntryFlowResult
} from './types/entryFlow';

export type {
  OfficialUserRole,
  LegacyUserRole,
  CompatibleUserRole,
  OfficialAgeGroup,
  LegacyAgeGroup,
  CompatibleAgeGroup,
  AccountStatus,
  OnboardingStatus,
  IntelligentProfileStatus,
  AssessmentStatus,
  SubscriptionStatus,
  EntryFlowResolutionStatus,
  EntryDestination,
  EntryFlowErrorCode,
  EntryFlowResult
};

export interface Localization {
  country: string;
  language: string;
  currency: string;
}

export interface LinguisticIdentity {
  interfaceLanguage: string;
  nativeLanguage: string;
  learningLanguage: string;
  tutorLanguage: string;
  regionalVariant: string;
  preferredDialect: string;
  formalityLevel: 'formal' | 'informal';
  slangAcademicPreference: 'slang' | 'academic' | 'balanced';
  usageContext: 'travel' | 'business' | 'academic' | 'exam' | 'conversation';
}

export type SubscriptionPlan = 'Free' | 'Premium';
export type UserRole = NewUserRole;

export type AppView = "gestao-financeira" | "marketplace" | "marketplace-catalog" | "marketplace-services" | "marketplace-subscriptions" | "marketplace-analytics" | "marketplace-lars" | "live-classes" | "live-calendar" | "live-teachers" | "live-rooms" | "live-recordings" | "live-analytics" | "area-empresarial" | "colaboradores" | "equipas" | "academias" | "programas" | "competencias" | "compliance" | "analytics-corp" | "financeiro-corp" | "command-center-corp" | "professores" | "alunos" | "turmas" | "salas" | "horarios" | "disciplinas" | "frequencia" | "financeiro" | "configuracoes-escola" | "ia-escolar" | "biblioteca" | "minhas-turmas" | "meus-alunos" | "mensagens" | "avaliacoes" | "presencas" | "trabalhos" | "ia-professor" | "calendario" | "comunicacao" | "gamification" | "adaptive-engine" | "dashboard" | "practice" | "feedback" | "vocab" | "quiz" | "admin-dashboard" | "educator-dashboard" | "area-escolar" | "area-escolar-b2b" | "area-professor" | "area-aluno" | "area-pais" | "live-chat" | "languages" | "live-sessions" | "community" | "profile" | "perfil" | "perfil-aprendizagem" | "settings" | "subscription" | "subscription-plans" | "learning-path" | "adaptive-learning" | "pronunciation" | "assessment-platform" | "pagamentos" | "pagamentos-sucesso" | "marketing" | "criar-turma" | "adicionar-alunos" | "landing" | "onboarding" | "activation" | "school-registration" | "b2b-payment" | "school-management" | "welcome" | "assessment" | "waiting-verification" | "suspended" | "jogos" | "ranking" | "cms" | "certificados" | "analytics" | "ebook-studio" | "ebook-curation" | "ebook-analytics" | "ebook-recommendations" | "ebook-notifications" | "ebook-achievements" | "ebook-assignments-teacher" | "ebook-assignments-student" | "ebook-flashcards" | "ebook-student-dashboard" | "ebook-reader";

export interface Language {
  code: string;
  name: string;
  flag: string;
  defaultVoice: string;
}

export type Proficiency = "Beginner" | "Intermediate" | "Advanced";
export type AgeGroup = CompatibleAgeGroup;

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

export interface PronunciationAnalysisItem {
  word: string;
  userPhonetic: string;
  nativePhonetic: string;
  tip: string;
}

export interface FeedbackReport {
  overallScore: number;
  fluencyLevel: string;
  strengths: string[];
  grammarMistakes: GrammarMistake[];
  vocabularyTips: VocabularyTip[];
  pronunciationTips: string[];
  encouragingSummary: string;
  pronunciationAnalysis?: PronunciationAnalysisItem[];
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
  maturityLevel?: string;
  category?: string;
}

export interface StreakData {
  count: number;
  lastDate: string;
  history: string[];
  practicePoints?: number;
  streakFreezes?: number;
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
  vibrationDuration?: number;
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
  onboardingStatus: 'not_started' | 'welcome' | 'language_selection' | 'objective' | 'assessment' | 'completed';
}

export interface Course {
  id: string;
  title: string;
  description: string;
  language: string;
  level: Proficiency;
  thumbnailUrl?: string;
  published: boolean;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
}

export type ExerciseType = 'speaking' | 'listening' | 'writing' | 'reading' | 'vocabulary' | 'grammar' | 'quiz';

export interface Exercise {
  id: string;
  lessonId: string;
  type: ExerciseType;
  title: string;
  content: any; // Flexible for different exercise types
  order: number;
  xpReward: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  order: number;
  xpReward: number;
}

export interface UserCourseProgress {
  userId: string;
  courseId: string;
  completedLessons: string[];
  currentModuleId: string;
  currentLessonId: string;
}

export interface AiSession {
  id: string;
  userId: string;
  type: 'conversation' | 'correction' | 'tutoring' | 'roleplay' | 'lesson';
  messages: { role: 'user' | 'assistant', text: string }[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  criteria: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'learning' | 'social' | 'consistency';
  points: number;
}

export interface Mission {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  title: string;
  description: string;
  target: number;
  current: number;
  rewardCoins: number;
  rewardXp: number;
  completed: boolean;
}

export interface UserGamificationProfile {
  userId: string;
  xp: number;
  level: number;
  coins: number;
  streak: number;
  lastActive: Date;
  badges: string[];
  achievements: string[];
  activeMissions: string[];
}

export type QuestionType = 'multiple-choice' | 'fill-in-the-blank' | 'drag-and-drop' | 'audio' | 'speaking' | 'essay' | 'true-false' | 'image' | 'video';

export interface Question {
  id: string;
  assessmentId: string;
  type: QuestionType;
  prompt: string;
  options?: string[]; // For multiple choice, etc.
  correctAnswer?: any;
  mediaUrl?: string; // For audio, image, video
  points: number;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  courseId?: string;
  lessonId?: string;
  difficulty: Proficiency;
  questions: Question[];
  createdAt: Date;
}

export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  userId: string;
  answers: { questionId: string, answer: any }[];
  score: number;
  feedback: string;
  completedAt: Date;
}

export interface SpeakingSession {
  id: string;
  userId: string;
  topic: string;
  audioUrl: string;
  transcript: string;
  pronunciationScore: number;
  accentScore: number;
  feedback: string;
  createdAt: Date;
}

export interface WritingEssay {
  id: string;
  userId: string;
  topic: string;
  content: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  aiFeedback: string;
  teacherFeedback?: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
  versionHistory: { content: string; updatedAt: Date }[];
}

export interface ReadingText {
  id: string;
  title: string;
  content: string;
  difficulty: Proficiency;
  language: string;
  createdAt: Date;
}

export interface ReadingBookmark {
  id: string;
  userId: string;
  readingId: string;
  paragraphIndex: number;
  createdAt: Date;
}

export interface ReadingNote {
  id: string;
  userId: string;
  readingId: string;
  content: string;
  createdAt: Date;
}

export interface ListeningTrack {
  id: string;
  title: string;
  audioUrl: string;
  transcript: string;
  difficulty: Proficiency;
  language: string;
  duration: number;
}

export interface ListeningProgress {
  id: string;
  userId: string;
  trackId: string;
  completed: boolean;
  score?: number;
  lastPosition: number;
}

export interface Flashcard {
  id: string;
  collectionId: string;
  front: string;
  back: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'audio';
  difficulty: Proficiency;
}

export interface FlashcardCollection {
  id: string;
  name: string;
  ownerId: string;
  isPublic: boolean;
  createdAt: Date;
}

export interface FlashcardProgress {
  id: string;
  userId: string;
  cardId: string;
  nextReview: Date;
  interval: number; // In days
  repetitionCount: number;
  easeFactor: number;
}

export interface School {
  id: string;
  name: string;
  address: string;
  adminUid: string;
}

export interface Department {
  id: string;
  schoolId: string;
  name: string;
  description: string;
  headTeacherUid: string;
}

export interface Teacher {
  uid: string;
  schoolId: string;
  name: string;
  email: string;
  departmentId: string;
}

export interface Student {
  uid: string;
  schoolId: string;
  name: string;
  email: string;
  parentId: string;
}

export interface Parent {
  uid: string;
  schoolId: string;
  name: string;
  email: string;
  studentUids: string[];
}

export interface Class {
  id: string;
  schoolId: string;
  name: string;
  teacherUid: string;
}

export interface Subject {
  id: string;
  schoolId: string;
  name: string;
  departmentId: string;
}

export interface Schedule {
  id: string;
  classId: string;
  subjectId: string;
  teacherUid: string;
  startTime: Date;
  endTime: Date;
  dayOfWeek: number;
}

export interface Attendance {
  id: string;
  classId: string;
  studentUid: string;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
}

export interface AcademicEvent {
  id: string;
  schoolId: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  type: 'holiday' | 'exam' | 'other';
}
