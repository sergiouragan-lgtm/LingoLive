import { CefrLevel } from "../../domain/cefr/Types";
import { UserMemory } from "../../domain/memory/UserMemory";

export class CefrAssessmentEngine {
  private static readonly vocabularyThresholds: Array<{ level: CefrLevel; words: number }> = [
    { level: 'C2', words: 350 },
    { level: 'C1', words: 200 },
    { level: 'B2', words: 100 },
    { level: 'B1', words: 50 },
    { level: 'A2', words: 20 },
    { level: 'A1', words: 0 },
  ];

  static calculateNextDifficulty(memory: UserMemory): CefrLevel {
    const uniqueVocabulary = new Set(
      (memory.vocabularyMastered || []).map((word) => word.trim().toLowerCase()).filter(Boolean)
    ).size;
    return this.vocabularyThresholds.find((entry) => uniqueVocabulary >= entry.words)?.level || 'A1';
  }

  static evaluate(input: string, targetLevel: CefrLevel): number {
    if (typeof input !== 'string' || !input.trim()) return 0;
    const words = input.toLowerCase().match(/[\p{L}\p{N}'’-]+/gu) || [];
    if (words.length === 0) return 0;
    const sentences = input.split(/[.!?]+/).filter((sentence) => sentence.trim()).length || 1;
    const uniqueRatio = new Set(words).size / words.length;
    const averageSentenceLength = words.length / sentences;
    const connectors = words.filter((word) => [
      'because', 'although', 'however', 'therefore', 'while', 'quando', 'porque',
      'embora', 'contudo', 'portanto', 'puisque', 'cependant', 'aunque', 'sin embargo',
    ].includes(word)).length;
    const targetComplexity: Record<CefrLevel, number> = {
      A1: 3, A2: 5, B1: 8, B2: 12, C1: 16, C2: 20,
    };
    const lengthScore = Math.min(1, words.length / (targetComplexity[targetLevel] * 2));
    const sentenceScore = Math.min(1, averageSentenceLength / targetComplexity[targetLevel]);
    const connectorScore = targetLevel === 'A1' || targetLevel === 'A2'
      ? 1
      : Math.min(1, connectors / (targetLevel === 'B1' ? 1 : 2));
    return Math.round((lengthScore * 0.4 + uniqueRatio * 0.3 + sentenceScore * 0.2 + connectorScore * 0.1) * 100) / 100;
  }
}
