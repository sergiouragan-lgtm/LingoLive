import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface EngagementMetrics {
  userId: string;
  engagementScore: number; // 0-100
  dau: boolean; // daily active user
  mau: boolean; // monthly active user
  streakDays: number;
  lessonsCompletedThisWeek: number;
  averageDailyMinutes: number;
  lastActiveAt: Date;
  retentionTier: 'high' | 'medium' | 'low' | 'at_risk';
  updatedAt: Date;
}

export interface CohortAnalysis {
  cohortId: string;
  cohortDate: Date; // when cohort was created
  cohortSize: number;
  retention: {
    day0: number;
    day7: number;
    day30: number;
  };
  avgEngagementScore: number;
  totalLessonsCompleted: number;
  churnRate: number;
}

export interface RetentionMetrics {
  dau: number;
  mau: number;
  dauMauRatio: number;
  retentionByDay: Record<number, number>; // day 0, 1, 7, 14, 30
  newUsers: number;
  churned: number;
  returningUsers: number;
}

class EngagementService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = getFirestore();
    this.startDailyAggregation();
  }

  public async calculateEngagementScore(userId: string): Promise<number> {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Fetch recent events
      const eventsSnapshot = await this.db
        .collection('user_events')
        .where('userId', '==', userId)
        .where('timestamp', '>=', sevenDaysAgo)
        .get();

      const events = eventsSnapshot.docs.map((doc) => doc.data());

      // Engagement score components
      let score = 0;

      // Events in last 7 days (0-25 points)
      const eventCount = Math.min(events.length, 25);
      score += eventCount;

      // Lesson completions (0-30 points)
      const lessonCompletes = events.filter(
        (e: any) => e.eventType === 'lesson_complete'
      ).length;
      score += Math.min(lessonCompletes * 6, 30);

      // Consistency (0-20 points)
      const activeDays = new Set(
        events.map((e: any) => e.timestamp.toDate().toDateString())
      ).size;
      score += Math.min(activeDays * 2.86, 20);

      // Quiz attempts (0-15 points)
      const quizAttempts = events.filter(
        (e: any) => e.eventType === 'quiz_attempt'
      ).length;
      score += Math.min(quizAttempts * 3, 15);

      // Achievements (0-10 points)
      const achievements = events.filter(
        (e: any) => e.eventType === 'achievement_unlocked'
      ).length;
      score += Math.min(achievements * 2, 10);

      return Math.min(Math.round(score), 100);
    } catch (error: any) {
      console.error('Error calculating engagement score:', error);
      return 0;
    }
  }

  public async updateEngagementMetrics(userId: string): Promise<EngagementMetrics> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Check activity in last 24 hours
      const daySnapshot = await this.db
        .collection('user_events')
        .where('userId', '==', userId)
        .where('timestamp', '>=', oneDayAgo)
        .get();
      const isDau = daySnapshot.size > 0;

      // Check activity in last 30 days
      const monthSnapshot = await this.db
        .collection('user_events')
        .where('userId', '==', userId)
        .where('timestamp', '>=', thirtyDaysAgo)
        .get();
      const isMau = monthSnapshot.size > 0;

      // Get last active date
      const lastActiveSnapshot = await this.db
        .collection('user_events')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

      const lastActiveAt = lastActiveSnapshot.empty
        ? new Date(0)
        : (lastActiveSnapshot.docs[0].data().timestamp as any);

      // Get lessons completed this week
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lessonSnapshot = await this.db
        .collection('user_events')
        .where('userId', '==', userId)
        .where('eventType', '==', 'lesson_complete')
        .where('timestamp', '>=', weekAgo)
        .get();

      // Calculate average daily minutes (from metadata)
      const thirtyDaysEvents = await this.db
        .collection('user_events')
        .where('userId', '==', userId)
        .where('timestamp', '>=', thirtyDaysAgo)
        .get();

      const totalMinutes = thirtyDaysEvents.docs.reduce((sum, doc) => {
        return sum + (doc.data().metadata?.durationMinutes || 0);
      }, 0);

      const averageDailyMinutes = Math.round(totalMinutes / 30);

      // Calculate engagement score
      const engagementScore = await this.calculateEngagementScore(userId);

      // Determine retention tier
      const daysSinceActive = (now.getTime() - lastActiveAt.getTime()) / (1000 * 60 * 60 * 24);
      let retentionTier: 'high' | 'medium' | 'low' | 'at_risk' = 'high';
      if (daysSinceActive > 30) retentionTier = 'at_risk';
      else if (daysSinceActive > 7) retentionTier = 'low';
      else if (daysSinceActive > 1) retentionTier = 'medium';

      // Get streak
      const userDoc = await this.db.collection('users').doc(userId).get();
      const streakDays = userDoc.data()?.streakDays || 0;

      const metrics: EngagementMetrics = {
        userId,
        engagementScore,
        dau: isDau,
        mau: isMau,
        streakDays,
        lessonsCompletedThisWeek: lessonSnapshot.size,
        averageDailyMinutes,
        lastActiveAt,
        retentionTier,
        updatedAt: now,
      };

      // Store metrics
      await this.db.collection('engagement_metrics').doc(userId).set(metrics);

      logSecurityEvent(
        'ENGAGEMENT_METRICS_UPDATED' as any,
        'info' as any,
        `Engagement metrics updated for user`,
        { userId },
        { score: engagementScore, tier: retentionTier }
      );

      return metrics;
    } catch (error: any) {
      console.error('Error updating engagement metrics:', error);
      throw error;
    }
  }

  public async getCohortAnalysis(cohortId: string): Promise<CohortAnalysis | null> {
    try {
      const docSnapshot = await this.db
        .collection('cohorts')
        .doc(cohortId)
        .get();

      if (!docSnapshot.exists) return null;

      return docSnapshot.data() as CohortAnalysis;
    } catch (error: any) {
      console.error('Error fetching cohort analysis:', error);
      return null;
    }
  }

  public async createCohort(cohortDate: Date): Promise<string> {
    try {
      const cohortId = `cohort-${cohortDate.toISOString().split('T')[0]}`;

      // Get all new users from that date
      const startOfDay = new Date(cohortDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(cohortDate);
      endOfDay.setHours(23, 59, 59, 999);

      const usersSnapshot = await this.db
        .collection('users')
        .where('createdAt', '>=', startOfDay)
        .where('createdAt', '<=', endOfDay)
        .get();

      const cohortAnalysis: CohortAnalysis = {
        cohortId,
        cohortDate,
        cohortSize: usersSnapshot.size,
        retention: { day0: usersSnapshot.size, day7: 0, day30: 0 },
        avgEngagementScore: 0,
        totalLessonsCompleted: 0,
        churnRate: 0,
      };

      await this.db.collection('cohorts').doc(cohortId).set(cohortAnalysis);

      // Store cohort members
      const batch = this.db.batch();
      for (const userDoc of usersSnapshot.docs) {
        const memberRef = this.db
          .collection('cohorts')
          .doc(cohortId)
          .collection('members')
          .doc(userDoc.id);
        batch.set(memberRef, { userId: userDoc.id, joinedAt: new Date() });
      }
      await batch.commit();

      return cohortId;
    } catch (error: any) {
      console.error('Error creating cohort:', error);
      throw error;
    }
  }

  public async getRetentionMetrics(): Promise<RetentionMetrics> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // DAU and MAU
      const dauSnapshot = await this.db
        .collection('user_events')
        .where('timestamp', '>=', oneDayAgo)
        .get();

      const mauSnapshot = await this.db
        .collection('user_events')
        .where('timestamp', '>=', thirtyDaysAgo)
        .get();

      const dau = new Set(
        dauSnapshot.docs.map((doc) => doc.data().userId)
      ).size;
      const mau = new Set(
        mauSnapshot.docs.map((doc) => doc.data().userId)
      ).size;

      const dauMauRatio = mau > 0 ? parseFloat((dau / mau).toFixed(2)) : 0;

      // Retention by day (basic)
      const retentionByDay: Record<number, number> = {};
      for (const day of [0, 1, 7, 14, 30]) {
        const cutoff = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
        const snapshot = await this.db
          .collection('user_events')
          .where('timestamp', '>=', cutoff)
          .get();
        retentionByDay[day] = new Set(
          snapshot.docs.map((doc) => doc.data().userId)
        ).size;
      }

      return {
        dau,
        mau,
        dauMauRatio,
        retentionByDay,
        newUsers: 0,
        churned: 0,
        returningUsers: 0,
      };
    } catch (error: any) {
      console.error('Error fetching retention metrics:', error);
      return {
        dau: 0,
        mau: 0,
        dauMauRatio: 0,
        retentionByDay: {},
        newUsers: 0,
        churned: 0,
        returningUsers: 0,
      };
    }
  }

  private startDailyAggregation(): void {
    setInterval(() => {
      this.aggregateDailyMetrics().catch((err) =>
        console.error('Daily aggregation error:', err)
      );
    }, 60 * 60 * 1000);
  }

  private async aggregateDailyMetrics(): Promise<void> {
    try {
      const snapshot = await this.db.collection('users').get();
      for (const userDoc of snapshot.docs) {
        await this.updateEngagementMetrics(userDoc.id);
      }
    } catch (error: any) {
      console.error('Error aggregating daily metrics:', error);
    }
  }
}

export const engagementService = new EngagementService();
