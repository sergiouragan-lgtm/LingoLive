export interface UserMemory {
  userId: string;
  vocabularyMastered: string[];
  grammarWeaknesses: string[];
  preferredStyle: string;
  learningGoals: string[];
  motivation: string;
  studyFrequency: string;
  lastUpdated: Date;
  privacyLevel: 'public' | 'private' | 'anonymized';
}
