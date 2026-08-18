export interface PhonemeScore {
  phoneme: string;
  accuracy: number; // 0-100
  ipaSymbol: string;
  feedback: string;
}

export interface PronunciationResult {
  id: string;
  userId: string;
  timestamp: string;
  targetText: string;
  transcription: string;
  
  // High-level scores
  overallScore: number;    // 0-100
  accuracyScore: number;   // 0-100 (how correct the sounds were)
  fluencyScore: number;    // 0-100 (flow, rhythm, pauses)
  completenessScore: number; // 0-100 (were all words spoken)
  
  // Fine-grained analysis
  speechSpeedWpm: number;  // Words per minute
  pauseCount: number;      // Number of unnatural pauses
  accentDetected: string;  // e.g. "Brazilian Portuguese Accent", "Neutral Accent"
  accentConfidence: number; // 0-100
  
  phonemeAnalysis: PhonemeScore[];
  generalFeedback: string;
  improvementTips: string[];
  
  audioUrl?: string; // Optional URL if saved
}

export interface PronunciationReport {
  id: string;
  userId: string;
  studentName?: string;
  teacherId?: string;
  language: string;
  averageOverall: number;
  averageAccuracy: number;
  averageFluency: number;
  totalAttempts: number;
  commonErrorPhonemes: string[];
  timelineData: { date: string; score: number }[];
  feedbackSummary: string;
  generatedAt: string;
}

export interface OfflineAudioQueueItem {
  id: string;
  userId: string;
  timestamp: string;
  targetText: string;
  audioBlobBase64: string; // Stored offline
}
