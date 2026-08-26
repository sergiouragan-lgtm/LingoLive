import { describe, expect, it, vi } from 'vitest';
import { CurriculumEngine } from '../curriculum/CurriculumEngine';
import { CefrAssessmentEngine } from '../cefr/CefrAssessmentEngine';
import { LearningProgressService } from './LearningProgressService';
import { LearningProgress } from '../../domain/learning/LearningProgress';

const nodes = [
  { id: 'a1', type: 'Cambridge' as const, title: 'A1', competencyId: 'speaking-a1', dependencies: [], isCompleted: false },
  { id: 'a2', type: 'Cambridge' as const, title: 'A2', competencyId: 'speaking-a2', dependencies: ['a1'], isCompleted: false },
];

describe('learning engines', () => {
  it('validates a curriculum DAG and unlocks only eligible lessons', () => {
    expect(CurriculumEngine.validateAcyclic(nodes)).toBe(true);
    expect(CurriculumEngine.getUnlockedNodes(nodes).map(node => node.id)).toEqual(['a1']);
    expect(CurriculumEngine.calculateProgress([])).toBe(0);
  });

  it('rejects cyclic curriculum dependencies', () => {
    const cyclic = [{ ...nodes[0], dependencies: ['a2'] }, nodes[1]];
    expect(CurriculumEngine.validateAcyclic(cyclic)).toBe(false);
  });

  it('maps aggregate skill evidence through all CEFR levels', () => {
    expect(CefrAssessmentEngine.levelForScore(0.1)).toBe('A1');
    expect(CefrAssessmentEngine.levelForScore(0.5)).toBe('A2');
    expect(CefrAssessmentEngine.levelForScore(0.6)).toBe('B1');
    expect(CefrAssessmentEngine.levelForScore(0.75)).toBe('B2');
    expect(CefrAssessmentEngine.levelForScore(0.85)).toBe('C1');
    expect(CefrAssessmentEngine.levelForScore(0.95)).toBe('C2');
  });

  it('assesses evidence across reading, writing, listening and speaking', () => {
    const result = CefrAssessmentEngine.assessSkills([
      { skill: 'Reading', score: 0.76 },
      { skill: 'Writing', score: 0.72 },
      { skill: 'Listening', score: 0.74 },
      { skill: 'Speaking', score: 0.70 },
    ]);
    expect(result.level).toBe('B2');
    expect(result.overallScore).toBe(0.73);
  });

  it('scores empty evidence safely and rewards richer target-language output', () => {
    expect(CefrAssessmentEngine.evaluate('', 'B1')).toBe(0);
    expect(CefrAssessmentEngine.evaluate('I work.', 'B1')).toBeLessThan(
      CefrAssessmentEngine.evaluate('I work with international teams, and I communicate clearly during our weekly planning meetings.', 'B1'),
    );
  });

  it('awards XP once per unique completion and persists progress', async () => {
    const save = vi.fn();
    const service = new LearningProgressService({ save } as never);
    const progress: LearningProgress = { userId: 'u1', courseId: 'c1', language: 'en', cefrLevel: 'A1', completedLessonIds: [], unlockedLessonIds: ['a1'], mastery: [], xp: 0, streakDays: 0, updatedAt: '', version: 1 };
    const next = await service.completeLesson(progress, 'a1', nodes, 10);
    expect(next.completedLessonIds).toEqual(['a1']);
    expect(next.unlockedLessonIds).toEqual(['a2']);
    expect(next.xp).toBe(10);
    expect(save).toHaveBeenCalledOnce();

    const repeated = await service.completeLesson(next, 'a1', nodes, 10);
    expect(repeated.xp).toBe(10);
  });
});
