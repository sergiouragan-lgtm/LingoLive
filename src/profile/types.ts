export interface Attribute<T> {
  value: T;
  confidence: number;
  source: string;
  lastUpdated: string;
  validationStatus: string;
  version: string;
}

export interface IdentityDomain {
  userId: Attribute<string>;
  fullName: Attribute<string>;
  preferredDisplayName: Attribute<string>;
  birthDate: Attribute<string>;
  gender: Attribute<string>;
}

export interface LocalizationDomain {
  country: Attribute<string>;
  interfaceLanguage: Attribute<string>;
  nativeLanguage: Attribute<string>;
  timezone: Attribute<string>;
}

export interface LearningDomain {
  cefrLevel: Attribute<string>;
  vocabularySize: Attribute<number>;
  learningStyle: Attribute<string>;
  targetLanguages?: Attribute<string[]> | string[];
  targetLanguage?: Attribute<string> | string;
}

export interface EducationalDomain {
  educationLevel: Attribute<string>;
  currentOccupation: Attribute<string>;
}

export interface AIPersonalizationDomain {
  preferredTutorPersonality: Attribute<string>;
  preferredCorrectionStyle: Attribute<string>;
}

export interface GamificationDomain {
  xp: Attribute<number>;
  coins: Attribute<number>;
  streak: Attribute<number>;
}

export interface SubscriptionDomain {
  plan: Attribute<string>;
  renewalDate: Attribute<string>;
}

export interface AccountDomain {
  role: Attribute<string>;
  status: Attribute<string>;
  dailyGoal: Attribute<number>;
  subscriptionActive: Attribute<boolean>;
  lastLogin: Attribute<string>;
}

export interface ChildProfileDomain {
  parentalConsent: Attribute<boolean>;
  safetyLevel: Attribute<string>;
}

export interface AccessibilityDomain {
  visualPreferences: Attribute<string>;
  motionPreferences: Attribute<string>;
}

export interface SmartProfile {
  userId: string;
  identity: IdentityDomain;
  localization: LocalizationDomain;
  learning: LearningDomain;
  educational: EducationalDomain;
  aiPersonalization: AIPersonalizationDomain;
  gamification: GamificationDomain;
  subscription: SubscriptionDomain;
  account: AccountDomain;
  childProfile: ChildProfileDomain;
  accessibility: AccessibilityDomain;
  updatedAt: string;
}
