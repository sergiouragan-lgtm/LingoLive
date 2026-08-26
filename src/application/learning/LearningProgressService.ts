import { CurriculumEngine } from '../curriculum/CurriculumEngine';
import { CurriculumNode } from '../../domain/curriculum/CurriculumNode';
import { LearningProgress } from '../../domain/learning/LearningProgress';
import { FirestoreLearningProgressRepository } from '../../infrastructure/persistence/learning/FirestoreLearningProgressRepository';

export class LearningProgressService {
  constructor(private readonly repository: FirestoreLearningProgressRepository) {}

  async completeLesson(progress: LearningProgress, lessonId: string, nodes: CurriculumNode[], earnedXp: number): Promise<LearningProgress> {
    const isFirstCompletion = !progress.completedLessonIds.includes(lessonId);
    const completedLessonIds = Array.from(new Set([...progress.completedLessonIds, lessonId]));
    const currentNodes = nodes.map(node => ({ ...node, isCompleted: completedLessonIds.includes(node.id) }));
    const unlockedLessonIds = CurriculumEngine.getUnlockedNodes(currentNodes).map(node => node.id);
    const next = {
      ...progress,
      completedLessonIds,
      unlockedLessonIds,
      xp: progress.xp + (isFirstCompletion ? Math.max(0, earnedXp) : 0),
      updatedAt: new Date().toISOString(),
      version: progress.version + 1,
    };
    await this.repository.save(next);
    return next;
  }
}
