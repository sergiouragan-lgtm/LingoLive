import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers24h: number;
  activeUsers7d: number;
  totalLessonsCompleted: number;
  averageLessonTime: number;
  totalPaymentRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  engagementRate: number;
  timestamp: Date;
}

export interface UserMetrics {
  userId: string;
  lessonsCompleted: number;
  vocabularyLearned: number;
  streakDays: number;
  averageScorePercentage: number;
  timeSpentMinutes: number;
  lastActiveAt: Date;
  createdAt: Date;
}

export interface EventTimeseries {
  timestamp: Date;
  eventType: string;
  count: number;
  userId?: string;
}

class AnalyticsDashboardService {
  private db: Firestore;
  private metricsCache: Map<string, any> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.db = getFirestore();
  }

  public async getDashboardMetrics(timeRange: '24h' | '7d' | '30d' = '7d'): Promise<DashboardMetrics> {
    const cacheKey = `dashboard_${timeRange}`;
    const cached = this.metricsCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    try {
      const cutoffDate = this.getDateCutoff(timeRange);

      const usersSnapshot = await this.db.collection('users').get();
      const totalUsers = usersSnapshot.size;

      const activeUsersSnapshot = await this.db
        .collection('user_activity')
        .where('lastActiveAt', '>=', cutoffDate)
        .get();
      const activeUsersCount = new Set(activeUsersSnapshot.docs.map((d) => d.data().userId)).size;

      const lessonsSnapshot = await this.db
        .collectionGroup('lessons')
        .where('completedAt', '>=', cutoffDate)
        .get();
      const totalLessonsCompleted = lessonsSnapshot.size;

      const avgLessonTime = lessonsSnapshot.empty
        ? 0
        : lessonsSnapshot.docs.reduce((sum, d) => sum + (d.data().durationMinutes || 0), 0) /
          lessonsSnapshot.size;

      const paymentsSnapshot = await this.db
        .collection('payment_history')
        .where('timestamp', '>=', cutoffDate)
        .where('status', '==', 'success')
        .get();
      const totalRevenue = paymentsSnapshot.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0);

      const subscriptionSnapshot = await this.db
        .collection('subscriptions')
        .where('status', '==', 'active')
        .get();
      const activeSubscriptions = subscriptionSnapshot.size;

      const metrics: DashboardMetrics = {
        totalUsers,
        activeUsers24h: activeUsersCount,
        activeUsers7d: activeUsersCount,
        totalLessonsCompleted,
        averageLessonTime: Math.round(avgLessonTime * 100) / 100,
        totalPaymentRevenue: Math.round(totalRevenue * 100) / 100,
        activeSubscriptions,
        churnRate: totalUsers > 0 ? ((totalUsers - activeUsersCount) / totalUsers) * 100 : 0,
        engagementRate: totalUsers > 0 ? (activeUsersCount / totalUsers) * 100 : 0,
        timestamp: new Date(),
      };

      this.metricsCache.set(cacheKey, { data: metrics, timestamp: Date.now() });

      logSecurityEvent(
        'DASHBOARD_METRICS_GENERATED' as any,
        'info' as any,
        `Dashboard metrics generated for ${timeRange}`,
        {},
        { totalUsers, activeUsers: activeUsersCount, revenue: metrics.totalPaymentRevenue }
      );

      return metrics;
    } catch (error: any) {
      logSecurityEvent(
        'DASHBOARD_METRICS_FAILED' as any,
        'warning' as any,
        `Failed to generate dashboard metrics: ${error.message}`,
        {},
        { error: error.message }
      );
      throw error;
    }
  }

  public async getUserMetrics(userId: string): Promise<UserMetrics> {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const lessonsSnapshot = await this.db
        .collection('users')
        .doc(userId)
        .collection('lessons')
        .where('completed', '==', true)
        .get();

      const vocabSnapshot = await this.db
        .collection('users')
        .doc(userId)
        .collection('vocabulary')
        .get();

      const activityDoc = await this.db.collection('user_activity').doc(userId).get();
      const activityData = activityDoc.data() || {};

      const metrics: UserMetrics = {
        userId,
        lessonsCompleted: lessonsSnapshot.size,
        vocabularyLearned: vocabSnapshot.size,
        streakDays: activityData.streakDays || 0,
        averageScorePercentage: activityData.averageScore || 0,
        timeSpentMinutes: activityData.totalTimeSpentMinutes || 0,
        lastActiveAt: activityData.lastActiveAt?.toDate() || new Date(),
        createdAt: userDoc.data()?.createdAt?.toDate() || new Date(),
      };

      return metrics;
    } catch (error: any) {
      logSecurityEvent(
        'USER_METRICS_FETCH_FAILED' as any,
        'warning' as any,
        `Failed to fetch user metrics: ${error.message}`,
        { userId },
        { error: error.message }
      );
      throw error;
    }
  }

  public async getEventTimeseries(
    eventType: string,
    timeRange: '24h' | '7d' | '30d' = '7d'
  ): Promise<EventTimeseries[]> {
    try {
      const cutoffDate = this.getDateCutoff(timeRange);

      const snapshot = await this.db
        .collection('events')
        .where('type', '==', eventType)
        .where('timestamp', '>=', cutoffDate)
        .orderBy('timestamp', 'desc')
        .get();

      const timeseries: EventTimeseries[] = [];
      const eventsByDate = new Map<string, number>();

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const dateKey = new Date(data.timestamp.toDate()).toISOString().split('T')[0];
        eventsByDate.set(dateKey, (eventsByDate.get(dateKey) || 0) + 1);
      });

      eventsByDate.forEach((count, dateStr) => {
        timeseries.push({
          timestamp: new Date(dateStr),
          eventType,
          count,
        });
      });

      return timeseries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error: any) {
      console.error('Error fetching event timeseries:', error);
      return [];
    }
  }

  public async getTopFeatures(limit: number = 10): Promise<Array<{ feature: string; usage: number }>> {
    try {
      const snapshot = await this.db
        .collection('feature_usage')
        .orderBy('usageCount', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        feature: doc.data().feature,
        usage: doc.data().usageCount,
      }));
    } catch (error: any) {
      console.error('Error fetching top features:', error);
      return [];
    }
  }

  public async getCohortAnalysis(cohortDays: number = 7): Promise<any[]> {
    try {
      const cohorts: any[] = [];
      const now = new Date();

      for (let i = 0; i < 4; i++) {
        const cohortStart = new Date(now.getTime() - (i + 1) * cohortDays * 24 * 60 * 60 * 1000);
        const cohortEnd = new Date(now.getTime() - i * cohortDays * 24 * 60 * 60 * 1000);

        const snapshot = await this.db
          .collection('users')
          .where('createdAt', '>=', cohortStart)
          .where('createdAt', '<', cohortEnd)
          .get();

        const activeSnapshot = await this.db
          .collection('user_activity')
          .where('lastActiveAt', '>=', cohortStart)
          .where('lastActiveAt', '<', cohortEnd)
          .get();

        cohorts.push({
          cohortStart,
          cohortEnd,
          newUsers: snapshot.size,
          activeUsers: activeSnapshot.size,
          retentionRate: snapshot.size > 0 ? (activeSnapshot.size / snapshot.size) * 100 : 0,
        });
      }

      return cohorts;
    } catch (error: any) {
      console.error('Error calculating cohort analysis:', error);
      return [];
    }
  }

  private getDateCutoff(timeRange: '24h' | '7d' | '30d'): Date {
    const now = new Date();
    const cutoff = new Date(now);

    switch (timeRange) {
      case '24h':
        cutoff.setHours(cutoff.getHours() - 24);
        break;
      case '7d':
        cutoff.setDate(cutoff.getDate() - 7);
        break;
      case '30d':
        cutoff.setDate(cutoff.getDate() - 30);
        break;
    }

    return cutoff;
  }

  public clearCache(): void {
    this.metricsCache.clear();
  }
}

export const analyticsDashboardService = new AnalyticsDashboardService();
