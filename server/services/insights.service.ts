import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface UserInsight {
  userId: string;
  type: 'strength' | 'struggle' | 'opportunity' | 'milestone';
  title: string;
  description: string;
  actionable: string[];
  confidenceScore: number; // 0-100
  createdAt: Date;
}

export interface DashboardMetric {
  label: string;
  value: number | string;
  trend?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
  unit?: string;
}

export interface DashboardSnapshot {
  userId: string;
  generatedAt: Date;
  metrics: Record<string, DashboardMetric>;
  insights: UserInsight[];
  recommendations: string[];
}

export interface PersonalizedRecommendation {
  userId: string;
  type: 'course' | 'skill' | 'practice' | 'review';
  content: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedValue: number; // 0-100
}

class InsightsService {
  private db: Firestore;

  constructor() {
    this.db = getFirestore();
    this.startDailyInsightGeneration();
  }

  public async generateInsights(userId: string): Promise<UserInsight[]> {
    try {
      const insights: UserInsight[] = [];

      // Get recent events
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const eventsSnapshot = await this.db
        .collection('user_events')
        .where('userId', '==', userId)
        .where('timestamp', '>=', weekAgo)
        .get();

      const events = eventsSnapshot.docs.map((doc) => doc.data());

      // Analyze for strengths
      const lessonCompletes = events.filter(
        (e: any) => e.eventType === 'lesson_complete'
      ).length;
      const quizAttempts = events.filter(
        (e: any) => e.eventType === 'quiz_attempt'
      ).length;

      if (lessonCompletes > 10) {
        insights.push({
          userId,
          type: 'strength',
          title: 'Consistent Learner',
          description: `You completed ${lessonCompletes} lessons this week. Your consistency is exceptional!`,
          actionable: [
            'Keep up the momentum',
            'Challenge yourself with harder levels',
            'Help other learners',
          ],
          confidenceScore: 95,
          createdAt: new Date(),
        });
      }

      // Analyze for struggles
      const failedQuizzes = events.filter(
        (e: any) =>
          e.eventType === 'quiz_attempt' &&
          (e.metadata?.score || 0) < 50
      ).length;

      if (failedQuizzes > 3 && quizAttempts > 5) {
        const failureRate = Math.round((failedQuizzes / quizAttempts) * 100);
        insights.push({
          userId,
          type: 'struggle',
          title: 'Quiz Challenge Detected',
          description: `You have a ${failureRate}% failure rate on quizzes. This might indicate areas needing review.`,
          actionable: [
            'Review foundational concepts',
            'Practice vocabulary more',
            'Use pronunciation guides',
          ],
          confidenceScore: 85,
          createdAt: new Date(),
        });
      }

      // Analyze for opportunities
      const skillMasterySnapshot = await this.db
        .collection('skill_mastery')
        .where('userId', '==', userId)
        .where('proficiencyLevel', '<', 50)
        .get();

      if (skillMasterySnapshot.size > 0) {
        insights.push({
          userId,
          type: 'opportunity',
          title: `${skillMasterySnapshot.size} Skills Ready for Improvement`,
          description: `You have ${skillMasterySnapshot.size} skills where you could make quick progress.`,
          actionable: [
            'Focus on weakest skills first',
            'Set daily practice goals',
            'Use spaced repetition',
          ],
          confidenceScore: 80,
          createdAt: new Date(),
        });
      }

      // Detect milestones
      const achievements = events.filter(
        (e: any) => e.eventType === 'achievement_unlocked'
      ).length;

      if (achievements > 0) {
        insights.push({
          userId,
          type: 'milestone',
          title: `${achievements} Achievements Unlocked!`,
          description: `Congratulations! You've earned ${achievements} new achievement(s) this week.`,
          actionable: [
            'Share your progress',
            'Celebrate your wins',
            'Set new goals',
          ],
          confidenceScore: 100,
          createdAt: new Date(),
        });
      }

      // Store insights
      const batch = this.db.batch();
      for (const insight of insights) {
        const docId = `${userId}-${insight.type}-${Date.now()}`;
        batch.set(
          this.db.collection('user_insights').doc(docId),
          insight
        );
      }
      await batch.commit();

      logSecurityEvent(
        'INSIGHTS_GENERATED' as any,
        'info' as any,
        `Insights generated for user`,
        { userId },
        { insightCount: insights.length }
      );

      return insights;
    } catch (error: any) {
      console.error('Error generating insights:', error);
      return [];
    }
  }

  public async getDashboardMetrics(userId: string): Promise<Record<string, DashboardMetric>> {
    try {
      const metrics: Record<string, DashboardMetric> = {};

      // Current engagement score
      const metricsDoc = await this.db
        .collection('engagement_metrics')
        .doc(userId)
        .get();

      const engagementData = metricsDoc.data();
      metrics.engagementScore = {
        label: 'Engagement Score',
        value: engagementData?.engagementScore || 0,
        unit: '/100',
        trend: 'up',
      };

      // Learning velocity
      const progressDoc = await this.db
        .collection('user_events')
        .where('userId', '==', userId)
        .where('eventType', '==', 'lesson_complete')
        .get();

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentLessons = progressDoc.docs.filter(
        (doc) => doc.data().timestamp >= thirtyDaysAgo
      ).length;

      metrics.lessonsPer30Days = {
        label: 'Lessons Completed (30 days)',
        value: recentLessons,
        unit: 'lessons',
      };

      // Streak
      metrics.currentStreak = {
        label: 'Current Streak',
        value: engagementData?.streakDays || 0,
        unit: 'days',
        trend: engagementData?.streakDays > 7 ? 'up' : 'down',
      };

      // Skills mastered
      const masterySnapshot = await this.db
        .collection('skill_mastery')
        .where('userId', '==', userId)
        .where('proficiencyLevel', '>=', 80)
        .get();

      metrics.skillsMastered = {
        label: 'Skills Mastered',
        value: masterySnapshot.size,
        trend: 'up',
      };

      // Average score
      const averageScore =
        (progressDoc.docs.reduce((sum, doc) => {
          return sum + (doc.data().metadata?.score || 0);
        }, 0) / Math.max(progressDoc.size, 1)) || 0;

      metrics.averageScore = {
        label: 'Average Score',
        value: Math.round(averageScore),
        unit: '%',
      };

      // Time invested (hours)
      const totalMinutes = progressDoc.docs.reduce((sum, doc) => {
        return sum + (doc.data().metadata?.durationMinutes || 0);
      }, 0);

      metrics.totalHours = {
        label: 'Total Learning Time',
        value: Math.round(totalMinutes / 60),
        unit: 'hours',
      };

      return metrics;
    } catch (error: any) {
      console.error('Error fetching dashboard metrics:', error);
      return {};
    }
  }

  public async generateDashboardSnapshot(userId: string): Promise<DashboardSnapshot> {
    try {
      const metrics = await this.getDashboardMetrics(userId);
      const insights = await this.generateInsights(userId);

      // Generate recommendations
      const recommendations = this.getRecommendations(insights);

      const snapshot: DashboardSnapshot = {
        userId,
        generatedAt: new Date(),
        metrics,
        insights,
        recommendations,
      };

      // Store snapshot
      await this.db
        .collection('dashboard_snapshots')
        .doc(`${userId}-${Date.now()}`)
        .set(snapshot);

      return snapshot;
    } catch (error: any) {
      console.error('Error generating dashboard snapshot:', error);
      return {
        userId,
        generatedAt: new Date(),
        metrics: {},
        insights: [],
        recommendations: [],
      };
    }
  }

  public async getPersonalizedRecommendations(
    userId: string,
    limit: number = 5
  ): Promise<PersonalizedRecommendation[]> {
    try {
      const recommendations: PersonalizedRecommendation[] = [];

      // Get user's skill mastery
      const masterySnapshot = await this.db
        .collection('skill_mastery')
        .where('userId', '==', userId)
        .orderBy('proficiencyLevel', 'asc')
        .limit(3)
        .get();

      // Recommend skills for improvement
      for (const skillDoc of masterySnapshot.docs) {
        const skill = skillDoc.data();
        if (skill.proficiencyLevel < 60) {
          recommendations.push({
            userId,
            type: 'skill',
            content: `Improve ${skill.skillId}`,
            reason: `You're at ${skill.proficiencyLevel}% proficiency. Practice more to reach mastery.`,
            priority: 'high',
            estimatedValue: 85,
          });
        }
      }

      // Get learning velocity
      const eventsSnapshot = await this.db
        .collection('user_events')
        .where('userId', '==', userId)
        .where('eventType', '==', 'lesson_complete')
        .get();

      if (eventsSnapshot.size > 50) {
        recommendations.push({
          userId,
          type: 'course',
          content: 'Enroll in Advanced Course',
          reason: 'You have strong fundamentals. Challenge yourself with advanced content.',
          priority: 'medium',
          estimatedValue: 75,
        });
      }

      // Recommend practice for weak areas
      if (masterySnapshot.size > 0) {
        recommendations.push({
          userId,
          type: 'practice',
          content: 'Daily Practice Routine',
          reason: 'Consistent practice is key to mastery.',
          priority: 'high',
          estimatedValue: 90,
        });
      }

      // Store recommendations
      const batch = this.db.batch();
      for (const rec of recommendations) {
        batch.set(
          this.db
            .collection('personalized_recommendations')
            .doc(`${userId}-${rec.type}-${Date.now()}`),
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

  private getRecommendations(insights: UserInsight[]): string[] {
    const recommendations: string[] = [];

    for (const insight of insights) {
      recommendations.push(...insight.actionable);
    }

    return recommendations.slice(0, 5);
  }

  private startDailyInsightGeneration(): void {
    setInterval(() => {
      this.generateDailyInsights().catch((err) =>
        console.error('Daily insight generation error:', err)
      );
    }, 24 * 60 * 60 * 1000);
  }

  private async generateDailyInsights(): Promise<void> {
    try {
      const usersSnapshot = await this.db.collection('users').get();
      for (const userDoc of usersSnapshot.docs) {
        await this.generateDashboardSnapshot(userDoc.id);
      }
    } catch (error: any) {
      console.error('Error generating daily insights:', error);
    }
  }
}

export const insightsService = new InsightsService();
