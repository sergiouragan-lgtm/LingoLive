export interface AdaptiveLearningProfile {
  userId: string;
  performanceScore: number; // 0-100
  quizScoreAverage: number; // 0-100
  speakingScore: number;    // 0-100
  listeningScore: number;   // 0-100
  readingSpeedWpm: number;  // Word per minute
  writingQualityScore: number; // 0-100
  attendanceRate: number;   // 0 to 1
  learningStreak: number;
  motivationLevel: 'low' | 'medium' | 'high';
  estimatedCefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  difficultyIndex: number;  // 0.0 (easiest) to 1.0 (hardest)
  learningStyle: 'Visual' | 'Auditory' | 'Reading/Writing' | 'Kinesthetic' | 'Conversational' | 'Hybrid';
  availableStudyTimeMin: number;
  careerPath?: 'Doctors' | 'Engineers' | 'Lawyers' | 'Teachers' | 'Pilots' | 'Nurses' | 'Developers' | 'Designers' | 'Sales' | 'Management' | 'Student' | 'General';
  isChildProfile?: boolean;
  lastUpdated: string;
}

export interface LearningObjective {
  id: string;
  userId: string;
  type: 'Primary' | 'Secondary' | 'Professional' | 'Personal';
  title: string;
  description: string;
  targetCefr?: string;
  targetSkill?: string;
  status: 'active' | 'completed' | 'paused';
  priorityWeight: number; // 0.0 to 1.0
  createdAt: string;
}

export interface KnowledgeGap {
  id: string;
  userId: string;
  topic: string;
  type: 'grammar' | 'vocabulary' | 'pronunciation' | 'listening' | 'reading' | 'writing' | 'professional_terminology';
  severity: 'low' | 'medium' | 'high' | 'critical';
  identifiedAt: string;
}

export interface AdaptiveGoal {
  id: string;
  userId: string;
  title: string;
  category: 'speaking' | 'listening' | 'reading' | 'writing' | 'vocabulary' | 'consistency' | 'custom';
  targetValue: number;
  currentValue: number;
  deadline: string;
  completed: boolean;
  xpReward: number;
}

export interface AdaptivePathNode {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'speaking' | 'listening' | 'reading' | 'writing' | 'vocabulary' | 'review' | 'micro_assessment' | 'game' | 'story' | 'professional_simulation';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  durationMin: number; // 5, 10, 15, 30
  xpReward: number;
  status: 'locked' | 'unlocked' | 'completed';
  skillsTargeted: string[];
  tiedObjectiveId?: string; // Links to LearningObjective
  isReview?: boolean;
}

export interface AdaptivePath {
  id: string;
  userId: string;
  language: string;
  nodes: AdaptivePathNode[];
  generatedAt: string;
  pathType: 'Standard' | 'Career' | 'Child' | 'Review_Heavy' | 'Multi_Goal';
}

export interface AdaptiveRecommendation {
  id: string;
  title: string;
  description: string;
  actionView: string; // e.g. "practice", "quiz", "live-sessions", "languages"
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTimeMin: number;
  sourceObjectiveId?: string;
}

