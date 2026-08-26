import { LearningSkill } from './aggregates/Lesson';

export type ActivityKind = 'quiz' | 'reading' | 'writing' | 'listening' | 'speaking' | 'flashcard';

export interface LearningActivityAttempt {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  activityId: string;
  kind: ActivityKind;
  skill: LearningSkill;
  score: number;
  durationSeconds: number;
  completedAt: string;
}

export interface ActivityFeedback {
  mastered: boolean;
  normalizedScore: number;
  earnedXp: number;
  nextReviewAt: string;
  messageKey: 'retry' | 'progressing' | 'mastered';
}
