import { CefrLevel } from '../cefr/Types';
import { LearningSkill } from './aggregates/Lesson';

export interface SkillMastery {
  skill: LearningSkill;
  score: number;
  attempts: number;
  updatedAt: string;
}

export interface LearningProgress {
  userId: string;
  courseId: string;
  language: string;
  cefrLevel: CefrLevel;
  completedLessonIds: string[];
  unlockedLessonIds: string[];
  mastery: SkillMastery[];
  xp: number;
  streakDays: number;
  updatedAt: string;
  version: number;
}
