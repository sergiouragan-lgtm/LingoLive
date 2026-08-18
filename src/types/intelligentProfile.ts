import { Timestamp } from 'firebase/firestore';

export interface IntelligentProfile {
  userId: string;

  personalData: {
    age: number | null;
    gender?: string | null;
    country: string;
    role: string;
  };

  languageProfile: {
    nativeLanguage: string;
    targetLanguage: string;
    level: string;
    goals: string[];
    learningStyle: string;
  };

  aiPreferences: {
    languageMode: string;
    allowRegionalExpressions: boolean;
    allowSlang: boolean;
    dailyGoal: number;
    studyFrequency: number;
  };

  recommendations: {
    learningPath: string;
    aiTutorEnabled: boolean;
  };

  onboardingCompleted: boolean;
  profileVersion: number;

  createdAt: Timestamp | unknown;
  updatedAt: Timestamp | unknown;
}
