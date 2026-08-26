import { CefrLevel } from "../../domain/cefr/Types";
import { UserMemory } from "../../domain/memory/UserMemory";

export interface CefrSkillScore {
  skill: 'Grammar' | 'Vocabulary' | 'Reading' | 'Writing' | 'Listening' | 'Speaking';
  score: number;
}

const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const THRESHOLDS = [0, 0.45, 0.58, 0.7, 0.82, 0.92];

export class CefrAssessmentEngine {
  
  // Adaptive Difficulty Logic
  static calculateNextDifficulty(memory: UserMemory): CefrLevel {
    const vocabularyScore = Math.min(memory.vocabularyMastered.length / 500, 1);
    const weaknessPenalty = Math.min(memory.grammarWeaknesses.length * 0.02, 0.2);
    return this.levelForScore(Math.max(0, vocabularyScore - weaknessPenalty));
  }

  // Evaluates input against rubric
  static evaluate(input: string, targetLevel: CefrLevel): number {
    const normalized = input.trim();
    if (!normalized) return 0;
    const words = normalized.split(/\s+/).filter(Boolean);
    const uniqueRatio = new Set(words.map(word => word.toLowerCase())).size / words.length;
    const sentenceCount = Math.max(1, normalized.split(/[.!?]+/).filter(Boolean).length);
    const lengthScore = Math.min(words.length / (8 + LEVELS.indexOf(targetLevel) * 10), 1);
    const structureScore = Math.min(sentenceCount / (1 + LEVELS.indexOf(targetLevel) * 0.5), 1);
    return Number((lengthScore * 0.45 + uniqueRatio * 0.35 + structureScore * 0.2).toFixed(3));
  }

  static levelForScore(score: number): CefrLevel {
    const bounded = Math.max(0, Math.min(score, 1));
    for (let index = THRESHOLDS.length - 1; index >= 0; index -= 1) {
      if (bounded >= THRESHOLDS[index]) return LEVELS[index];
    }
    return 'A1';
  }

  static assessSkills(scores: CefrSkillScore[]): { level: CefrLevel; overallScore: number } {
    if (scores.length === 0) return { level: 'A1', overallScore: 0 };
    const valid = scores.map(item => Math.max(0, Math.min(item.score, 1)));
    const overallScore = valid.reduce((total, score) => total + score, 0) / valid.length;
    return { level: this.levelForScore(overallScore), overallScore: Number(overallScore.toFixed(3)) };
  }
}
