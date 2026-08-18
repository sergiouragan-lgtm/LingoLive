import { EnterpriseRole } from '../auth/rbac';

export interface BaseEnterpriseEntity {
  id?: string;
  createdAt: string; // ISO 8601 Timestamp
  updatedAt: string; // ISO 8601 Timestamp
  createdBy: string; // UID or SYSTEM
  updatedBy: string; // UID or SYSTEM
  tenantId: string;  // Multi-tenant isolation key
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'PENDING' | 'TERMINATED';
  version: number;   // Document schema version
  softDelete: boolean;
}

// 1. Users
export interface EnterpriseUser extends BaseEnterpriseEntity {
  email: string;
  role: EnterpriseRole;
  emailVerified: boolean;
  mfaEnabled: boolean;
  lastLoginAt: string;
  phoneNumber?: string;
  tenantName: string;
  ipAddress?: string;
  deviceInfo?: string;
}

// 2. Profiles
export interface EnterpriseProfile extends BaseEnterpriseEntity {
  userId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl: string;
  birthDate?: string;
  biography?: string;
  selectedLanguage: string;
}

// 3. Schools
export interface EnterpriseSchool extends BaseEnterpriseEntity {
  name: string;
  address: string;
  ownerUid: string;
  contactEmail: string;
  maxStudents: number;
  currentStudentsCount: number;
  schoolType: 'K12' | 'LANGUAGE_SCHOOL' | 'CORPORATE_ACADEMY' | 'UNIVERSITY';
}

// 4. Teachers
export interface EnterpriseTeacher extends BaseEnterpriseEntity {
  userId: string;
  schoolId: string;
  nativeLanguages: string[];
  teachingLanguages: string[];
  certifications: string[];
  hourlyRate: number;
  rating: number;
  isNativeTeacher: boolean;
}

// 5. Students
export interface EnterpriseStudent extends BaseEnterpriseEntity {
  userId: string;
  schoolId?: string;
  companyId?: string; // If enterprise corporate learning program
  parentId?: string;  // For child protection relations
  currentLevel: string; // CEFR Level e.g., A1, A2, B1, B2, C1, C2
  streakDays: number;
  points: number;
  learningLanguages: string[];
}

// 6. Companies (Corporate Multitenancy)
export interface EnterpriseCompany extends BaseEnterpriseEntity {
  name: string;
  industry: string;
  corporateDomain: string;
  billingEmail: string;
  totalSeats: number;
  assignedSeats: number;
}

// 7. Subscriptions
export interface EnterpriseSubscription extends BaseEnterpriseEntity {
  ownerId: string; // School, Company, or Individual User
  planId: string;  // 'Free' | 'Premium_Individual' | 'Premium_Corporate' | 'Premium_School'
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  periodStart: string;
  periodEnd: string;
  cancelAtPeriodEnd: boolean;
}

// 8. Payments
export interface EnterprisePayment extends BaseEnterpriseEntity {
  subscriptionId?: string;
  stripeInvoiceId?: string;
  stripeChargeId?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  receiptUrl?: string;
}

// 9. Courses
export interface EnterpriseCourse extends BaseEnterpriseEntity {
  title: string;
  description: string;
  sourceLanguage: string;
  targetLanguage: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  totalLessons: number;
}

// 10. Lessons
export interface EnterpriseLesson extends BaseEnterpriseEntity {
  courseId: string;
  title: string;
  content: string;
  order: number;
  estimatedMinutes: number;
  difficultyRating: number;
}

// 11. Assessments
export interface EnterpriseAssessment extends BaseEnterpriseEntity {
  lessonId?: string;
  courseId?: string;
  title: string;
  passingScore: number;
  totalQuestions: number;
  durationMinutes: number;
}

// 12. QuestionBank
export interface EnterpriseQuestion extends BaseEnterpriseEntity {
  assessmentId?: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  points: number;
  questionType: 'MULTIPLE_CHOICE' | 'TRANSLATION' | 'VOICE_ACCENT' | 'FILL_BLANKS';
}

// 13. Certificates
export interface EnterpriseCertificate extends BaseEnterpriseEntity {
  userId: string;
  courseId: string;
  assessmentId: string;
  certificateHash: string; // Blockchain verification equivalent
  completionDate: string;
  gradeAchieved: number;
}

// 14. Marketplace
export interface EnterpriseMarketplaceItem extends BaseEnterpriseEntity {
  title: string;
  description: string;
  priceCoins: number;
  priceCurrency?: number; // Real currency conversion option
  itemCategory: 'AVATAR_SKIN' | 'VOICE_MODEL' | 'THEME' | 'STREAK_SHIELD' | 'LIVE_CLASS_PASS';
  stockQuantity?: number;
}

// 15. Avatars
export interface EnterpriseAvatar extends BaseEnterpriseEntity {
  name: string;
  imageUrl: string;
  associatedVoiceId?: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  unlockedByCoins: number;
}

// 16. Gamification (Leagues and Achievements)
export interface EnterpriseGamificationProfile extends BaseEnterpriseEntity {
  userId: string;
  currentLeague: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'EMERALD' | 'CHAMPIONS';
  weeklyXp: number;
  totalXp: number;
  achievementsUnlocked: string[]; // List of IDs
  leaguePosition: number;
}

// 17. Notifications
export interface EnterpriseNotification extends BaseEnterpriseEntity {
  recipientId: string; // UID, 'ALL_STUDENTS', 'ALL_TEACHERS' etc.
  title: string;
  body: string;
  category: 'PUSH' | 'EMAIL' | 'IN_APP';
  read: boolean;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
}

// 18. Ambassadors (Referral / Affiliate Program)
export interface EnterpriseAmbassador extends BaseEnterpriseEntity {
  userId: string;
  referralCode: string;
  commissionRate: number;
  totalReferrals: number;
  totalEarnings: number;
}

// 19. AuditLogs
export interface EnterpriseAuditLog {
  id?: string;
  timestamp: string;
  actorUid: string;
  actorEmail: string;
  action: string;
  resourcePath: string;
  tenantId: string;
  ipAddress: string;
  userAgent: string;
  oldValue: any;
  newValue: any;
}

// 20. AISessions (Active learning with Tutor AI)
export interface EnterpriseAISession extends BaseEnterpriseEntity {
  userId: string;
  targetLanguage: string;
  selectedDialect: string;
  totalExchangeTokens: number;
  startedAt: string;
  endedAt?: string;
}

// 21. AIMemory (Personalized learning graph across sessions)
export interface EnterpriseAIMemory extends BaseEnterpriseEntity {
  userId: string;
  vocabularyMastered: string[];
  weakGrammarPoints: string[];
  pronunciationErrors: string[];
  interests: string[];
}

// 22. LanguageProfiles (Advanced LIE integration details)
export interface EnterpriseLanguageProfile extends BaseEnterpriseEntity {
  userId: string;
  nativeLanguage: string;
  learningLanguage: string;
  preferredRegionalVariant: string;
  preferredDialect: string;
  formalityLevel: 'formal' | 'informal';
  slangAcademicPreference: 'slang' | 'academic' | 'balanced';
  usageContext: 'travel' | 'business' | 'academic' | 'exam' | 'conversation';
}

// 23. Dialects
export interface EnterpriseDialect extends BaseEnterpriseEntity {
  id: string; // Dialect identifier e.g., 'kimbundu'
  name: string;
  parentLanguage: string;
  pronunciationTip: string;
  vocabularyOverrides: Record<string, string>;
}

// 24. Countries
export interface EnterpriseCountry extends BaseEnterpriseEntity {
  countryCode: string; // ISO-2 e.g., 'AO'
  countryName: string;
  officialLanguages: string[];
  regionalLanguages: string[];
}

// 25. Translations
export interface EnterpriseTranslation extends BaseEnterpriseEntity {
  languageCode: string; // 'pt', 'en', 'ar', etc.
  translationKeys: Record<string, string>;
}

// 26. FeatureFlags (Remote Config & In-App overrides)
export interface EnterpriseFeatureFlag extends BaseEnterpriseEntity {
  key: string;
  value: any;
  targetingRules?: string; // JSON logic or SQL target group description
}

// 27. AnalyticsEvents
export interface EnterpriseAnalyticsEvent {
  id?: string;
  timestamp: string;
  userId: string;
  tenantId: string;
  eventName: string;
  eventParameters: Record<string, any>;
  deviceCategory: 'MOBILE' | 'DESKTOP' | 'TABLET';
}

// 28. SystemLogs
export interface EnterpriseSystemLog {
  id?: string;
  timestamp: string;
  severity: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  serviceName: string;
  message: string;
  stackTrace?: string;
  environment: 'development' | 'staging' | 'production';
}
