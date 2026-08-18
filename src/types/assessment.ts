export type QuestionType = 
  | "multiple-choice"
  | "true-false"
  | "essay"
  | "fill-blank"
  | "speaking"
  | "listening"
  | "writing";

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  instruction: string;
  points: number;
  
  // Media integrations
  imageUrl?: string;
  audioUrl?: string;
  
  // Specific helpers
  options?: string[]; // multiple-choice
  correctAnswer?: string; // multiple-choice, true-false, fill-blank
  rubricCriteria?: {
    dimension: string;
    description: string;
    maxScore: number;
  }[]; // essay, speaking, writing
  
  // Adaptive metadata
  difficulty: "beginner" | "intermediate" | "advanced";
  category: "grammar" | "vocabulary" | "listening" | "speaking" | "writing";
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  language: string;
  durationMin: number;
  isAdaptive: boolean;
  questions: Question[];
  passingScorePercent: number;
}

export interface ScheduledExam {
  id: string;
  examId: string;
  title: string;
  language: string;
  scheduledDate: string;
  dueDate: string;
  classId?: string;
  className?: string;
  status: "pending" | "completed" | "expired";
}

export interface AnswerSubmission {
  questionId: string;
  value: string; // text response, selected choice, or voice recording base64 string
}

export interface QuestionScore {
  questionId: string;
  pointsEarned: number;
  maxPoints: number;
  isCorrect: boolean;
  aiFeedback?: string;
  rubricScores?: {
    dimension: string;
    score: number;
    feedback: string;
  }[];
}

export interface ExamAttempt {
  id: string;
  examId: string;
  userId: string;
  studentName: string;
  timestamp: string;
  scorePercent: number;
  totalPointsEarned: number;
  totalPointsPossible: number;
  passed: boolean;
  questionScores: QuestionScore[];
  generalFeedback: string;
  status: "submitted" | "graded" | "pending-manual";
}

export interface Certificate {
  id: string;
  userId: string;
  studentName: string;
  examTitle: string;
  language: string;
  scorePercent: number;
  issueDate: string;
  verificationCode: string;
}

export interface ClassAssessmentAnalytics {
  examId: string;
  examTitle: string;
  averageScorePercent: number;
  totalSubmissions: number;
  passRatePercent: number;
  categoryStrengths: { category: string; averagePercent: number }[];
  criticalAreas: string[];
}
