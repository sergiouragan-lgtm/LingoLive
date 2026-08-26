import { ActivityFeedback, LearningActivityAttempt } from '../../domain/learning/LearningActivity';
import { LearningProgress, SkillMastery } from '../../domain/learning/LearningProgress';

const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30];

export class LearningActivityEngine {
  static scoreAnswers(questions: Array<{ id: string; correctAnswer: number }>, answers: Record<string, number>): number {
    if (questions.length === 0) return 0;
    const correct = questions.filter(question => answers[question.id] === question.correctAnswer).length;
    return Number((correct / questions.length).toFixed(3));
  }

  static evaluate(attempt: LearningActivityAttempt, previousAttempts: number, now = new Date()): ActivityFeedback {
    const score = Math.max(0, Math.min(attempt.score, 1));
    const mastered = score >= 0.8;
    const intervalIndex = mastered ? Math.min(previousAttempts, REVIEW_INTERVALS_DAYS.length - 1) : 0;
    const nextReview = new Date(now);
    nextReview.setUTCDate(nextReview.getUTCDate() + REVIEW_INTERVALS_DAYS[intervalIndex]);
    return {
      mastered,
      normalizedScore: score,
      earnedXp: score >= 0.9 ? 20 : score >= 0.8 ? 15 : score >= 0.6 ? 8 : 3,
      nextReviewAt: nextReview.toISOString(),
      messageKey: mastered ? 'mastered' : score >= 0.6 ? 'progressing' : 'retry',
    };
  }

  static updateMastery(progress: LearningProgress, attempt: LearningActivityAttempt): LearningProgress {
    const current = progress.mastery.find(item => item.skill === attempt.skill);
    const attempts = (current?.attempts ?? 0) + 1;
    const score = current ? (current.score * current.attempts + attempt.score) / attempts : attempt.score;
    const mastery: SkillMastery = {
      skill: attempt.skill,
      score: Number(Math.max(0, Math.min(score, 1)).toFixed(3)),
      attempts,
      updatedAt: attempt.completedAt,
    };
    return {
      ...progress,
      mastery: [...progress.mastery.filter(item => item.skill !== attempt.skill), mastery],
      updatedAt: attempt.completedAt,
      version: progress.version + 1,
    };
  }
}
