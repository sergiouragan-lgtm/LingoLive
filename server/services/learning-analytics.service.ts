import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface SkillMastery {
  userId: string;
  skillId: string;
  proficiencyLevel: number; // 0-100
  practiceCount: number;
  lastPracticeAt: Date;
  averageScore: number;
  masteredAt?: Date;
}

export interface CourseAnalytics {
  courseId: string;
  courseName: string;
  totalEnrolled: number;
  completed: number;
  completionRate: number;
  averageTimeToComplete: number; // in minutes
  averageScore: number;
  dropoutRate: number;
}

export interface LearningRecommendation {
  userId: string;
  recommendedSkillId: string;
  reason: 'skill_gap' | 'readiness' | 'interest' | 'next_in_path';
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
}

export interface ProgressMetrics {
  userId: string;
  totalSkillsAttempted: number;
  masteredSkills: number;
  currentLevel: number;
  estimatedTimeToNextLevel: number; // in hours
  weeklyProgressPercentage: number;
  learningVelocity: number; // lessons per day
}

class LearningAnalyticsService {
  private db: Firestore;

  constructor() {
    this.db = getFirestore();
  }

  public async trackSkillPractice(
    userId: string,
    skillId: string,
    score: number,
    durationMinutes: number
  ): Promise<SkillMastery> {
    try {
      const docId = `${userId}-${skillId}`;
      const docRef = this.db.collection('skill_mastery').doc(docId);
      const docSnapshot = await docRef.get();

      let mastery: SkillMastery;

      if (docSnapshot.exists) {
        const existing = docSnapshot.data() as SkillMastery;
        const newCount = existing.practiceCount + 1;
        const newAvgScore =
          (existing.averageScore * existing.practiceCount + score) / newCount;

        // Calculate new proficiency (weighted by practice count and consistency)
        const proficiency = Math.min(
          newAvgScore * 0.7 + (Math.min(newCount, 20) / 20) * 30,
          100
        );

        mastery = {
          ...existing,
          proficiencyLevel: Math.round(proficiency),
          practiceCount: newCount,
          lastPracticeAt: new Date(),
          averageScore: Math.round(newAvgScore),
          masteredAt: proficiency >= 80 ? new Date() : existing.masteredAt,
        };
      } else {
        mastery = {
          userId,
          skillId,
          proficiencyLevel: Math.round(score * 0.6),
          practiceCount: 1,
          lastPracticeAt: new Date(),
          averageScore: score,
        };
      }

      await docRef.set(mastery);

      logSecurityEvent(
        'SKILL_PRACTICE_TRACKED' as any,
        'info' as any,
        `Skill practice tracked for user`,
        { userId },
        { skillId, score, proficiency: mastery.proficiencyLevel }
      );

      return mastery;
    } catch (error: any) {
      console.error('Error tracking skill practice:', error);
      throw error;
    }
  }

  public async getSkillMastery(
    userId: string,
    skillId?: string
  ): Promise<SkillMastery[]> {
    try {
      let query = this.db
        .collection('skill_mastery')
        .where('userId', '==', userId);

      if (skillId) {
        query = query.where('skillId', '==', skillId);
      }

      const snapshot = await query.orderBy('proficiencyLevel', 'desc').get();

      return snapshot.docs.map((doc) => doc.data() as SkillMastery);
    } catch (error: any) {
      console.error('Error fetching skill mastery:', error);
      return [];
    }
  }

  public async getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
    try {
      // Get course basic info
      const courseDoc = await this.db.collection('courses').doc(courseId).get();
      const courseData = courseDoc.data();

      // Get enrollments
      const enrollmentSnapshot = await this.db
        .collection('enrollments')
        .where('courseId', '==', courseId)
        .get();

      const totalEnrolled = enrollmentSnapshot.size;

      // Get completions
      const completedSnapshot = await this.db
        .collection('enrollments')
        .where('courseId', '==', courseId)
        .where('status', '==', 'completed')
        .get();

      const completed = completedSnapshot.size;
      const completionRate =
        totalEnrolled > 0 ? parseFloat(((completed / totalEnrolled) * 100).toFixed(2)) : 0;

      // Calculate average metrics
      let totalTime = 0;
      let totalScore = 0;
      let scoreCount = 0;

      for (const doc of completedSnapshot.docs) {
        const enrollment = doc.data();
        totalTime += enrollment.totalTimeMinutes || 0;
        if (enrollment.finalScore) {
          totalScore += enrollment.finalScore;
          scoreCount++;
        }
      }

      const averageTimeToComplete =
        completed > 0 ? Math.round(totalTime / completed) : 0;
      const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

      const dropoutRate =
        totalEnrolled > 0
          ? parseFloat((((totalEnrolled - completed) / totalEnrolled) * 100).toFixed(2))
          : 0;

      return {
        courseId,
        courseName: courseData?.name || 'Unknown Course',
        totalEnrolled,
        completed,
        completionRate,
        averageTimeToComplete,
        averageScore,
        dropoutRate,
      };
    } catch (error: any) {
      console.error('Error fetching course analytics:', error);
      return {
        courseId,
        courseName: 'Unknown',
        totalEnrolled: 0,
        completed: 0,
        completionRate: 0,
        averageTimeToComplete: 0,
        averageScore: 0,
        dropoutRate: 0,
      };
    }
  }

  public async recommendNextLessons(
    userId: string,
    limit: number = 5
  ): Promise<LearningRecommendation[]> {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      const currentLevel = userData?.level || 1;

      // Get skill gaps
      const masterySnapshot = await this.db
        .collection('skill_mastery')
        .where('userId', '==', userId)
        .orderBy('proficiencyLevel', 'asc')
        .limit(10)
        .get();

      const lowProficiencySkills = masterySnapshot.docs
        .filter((doc) => {
          const skill = doc.data() as SkillMastery;
          return skill.proficiencyLevel < 60;
        })
        .map((doc) => (doc.data() as SkillMastery).skillId);

      // Get available skills for next level
      const skillsSnapshot = await this.db
        .collection('skills')
        .where('recommendedLevel', '==', currentLevel + 1)
        .get();

      const recommendations: LearningRecommendation[] = [];

      // Add skill gap recommendations
      for (const skillId of lowProficiencySkills.slice(0, Math.ceil(limit / 2))) {
        recommendations.push({
          userId,
          recommendedSkillId: skillId,
          reason: 'skill_gap',
          priority: 'high',
          createdAt: new Date(),
        });
      }

      // Add readiness recommendations
      for (const skillDoc of skillsSnapshot.docs.slice(0, Math.floor(limit / 2))) {
        recommendations.push({
          userId,
          recommendedSkillId: skillDoc.id,
          reason: 'readiness',
          priority: 'medium',
          createdAt: new Date(),
        });
      }

      // Store recommendations
      const batch = this.db.batch();
      for (const rec of recommendations) {
        const docId = `${userId}-${rec.recommendedSkillId}`;
        batch.set(
          this.db.collection('learning_recommendations').doc(docId),
          rec
        );
      }
      await batch.commit();

      return recommendations.slice(0, limit);
    } catch (error: any) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  public async getProgressMetrics(userId: string): Promise<ProgressMetrics> {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      const currentLevel = userData?.level || 1;

      // Get skill attempts
      const masterySnapshot = await this.db
        .collection('skill_mastery')
        .where('userId', '==', userId)
        .get();

      const totalSkillsAttempted = masterySnapshot.size;
      const masteredSkills = masterySnapshot.docs.filter(
        (doc) => (doc.data() as SkillMastery).proficiencyLevel >= 80
      ).length;

      // Get weekly progress
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weeklySnapshot = await this.db
        .collection('user_events')
        .where('userId', '==', userId)
        .where('eventType', '==', 'lesson_complete')
        .where('timestamp', '>=', weekAgo)
        .get();

      const weeklyProgressPercentage = Math.round(
        (weeklySnapshot.size / 7) * 10
      );

      // Calculate learning velocity
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const thirtyDaysSnapshot = await this.db
        .collection('user_events')
        .where('userId', '==', userId)
        .where('eventType', '==', 'lesson_complete')
        .where('timestamp', '>=', thirtyDaysAgo)
        .get();

      const learningVelocity = parseFloat(
        (thirtyDaysSnapshot.size / 30).toFixed(2)
      );

      // Estimate time to next level
      const avgLessonsPerLevel = 50;
      const lessonsNeeded = avgLessonsPerLevel;
      const estimatedDays =
        learningVelocity > 0 ? lessonsNeeded / learningVelocity : 0;
      const estimatedTimeToNextLevel = Math.round(estimatedDays * 24);

      return {
        userId,
        totalSkillsAttempted,
        masteredSkills,
        currentLevel,
        estimatedTimeToNextLevel,
        weeklyProgressPercentage,
        learningVelocity,
      };
    } catch (error: any) {
      console.error('Error fetching progress metrics:', error);
      return {
        userId,
        totalSkillsAttempted: 0,
        masteredSkills: 0,
        currentLevel: 1,
        estimatedTimeToNextLevel: 0,
        weeklyProgressPercentage: 0,
        learningVelocity: 0,
      };
    }
  }

  public async getCourseCompletionStats(): Promise<
    Array<{ courseId: string; completionRate: number }>
  > {
    try {
      const coursesSnapshot = await this.db.collection('courses').get();
      const stats = [];

      for (const courseDoc of coursesSnapshot.docs) {
        const analytics = await this.getCourseAnalytics(courseDoc.id);
        stats.push({
          courseId: courseDoc.id,
          completionRate: analytics.completionRate,
        });
      }

      return stats.sort((a, b) => b.completionRate - a.completionRate);
    } catch (error: any) {
      console.error('Error fetching course completion stats:', error);
      return [];
    }
  }
}

export const learningAnalyticsService = new LearningAnalyticsService();
