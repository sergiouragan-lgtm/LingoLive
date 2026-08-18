export interface AIProfile {
  id: string;
  userId: string;
  learningStyle: string;
  strengths: string[];
  weaknesses: string[];
  goals: string[];
  lastAnalysis: string;
}

export interface KnowledgeNode {
  id: string;
  skillId: string;
  level: number;
  difficulty: number;
}

export interface Recommendation {
  id: string;
  userId: string;
  contentId: string;
  reason: string;
}
