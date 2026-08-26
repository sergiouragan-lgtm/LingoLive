import { LearningProgress, SkillMastery } from '../../domain/learning/LearningProgress';

export class LearningProgressMerger {
  static merge(local: LearningProgress, remote: LearningProgress): LearningProgress {
    if (local.userId !== remote.userId || local.courseId !== remote.courseId) {
      throw new Error('Cannot merge progress from different users or courses');
    }
    const skills = new Set([...local.mastery.map(item => item.skill), ...remote.mastery.map(item => item.skill)]);
    const mastery: SkillMastery[] = Array.from(skills).map(skill => {
      const left = local.mastery.find(item => item.skill === skill);
      const right = remote.mastery.find(item => item.skill === skill);
      if (!left) return right!;
      if (!right) return left;
      return new Date(left.updatedAt) >= new Date(right.updatedAt) ? left : right;
    });
    const newest = new Date(local.updatedAt) >= new Date(remote.updatedAt) ? local : remote;
    return {
      ...newest,
      completedLessonIds: Array.from(new Set([...local.completedLessonIds, ...remote.completedLessonIds])),
      unlockedLessonIds: Array.from(new Set([...local.unlockedLessonIds, ...remote.unlockedLessonIds])),
      mastery,
      xp: Math.max(local.xp, remote.xp),
      streakDays: Math.max(local.streakDays, remote.streakDays),
      version: Math.max(local.version, remote.version) + 1,
    };
  }
}
