import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface RealtimeLearnerMetric {
  metricId: string;
  userId: string;
  metricType: 'engagement' | 'performance' | 'progress' | 'retention' | 'activity';
  metricName: string;
  currentValue: number;
  targetValue: number;
  lastUpdated: Date;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface LearnerActivityFeed {
  feedId: string;
  userId: string;
  activities: ActivityEvent[];
  lastActivity: Date;
  activeSessionCount: number;
  dailyActiveUsers: number;
}

export interface ActivityEvent {
  eventId: string;
  eventType: 'login' | 'assessment' | 'practice' | 'reading' | 'discussion' | 'achievement';
  description: string;
  duration: number;
  score?: number;
  timestamp: Date;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

export interface LearnerEngagementScore {
  scoreId: string;
  userId: string;
  overallEngagement: number;
  participationScore: number;
  consistencyScore: number;
  progressScore: number;
  calculatedAt: Date;
  scoreBreakdown: ScoreComponent[];
}

export interface ScoreComponent {
  componentName: string;
  weight: number;
  currentScore: number;
  targetScore: number;
}

export interface LearningVelocity {
  velocityId: string;
  userId: string;
  conceptId: string;
  conceptName: string;
  lessonsCompletedPerWeek: number;
  assessmentsTakenPerWeek: number;
  averageScoreImprovement: number;
  estimatedMasteryDate: Date;
  velocity: 'accelerating' | 'steady' | 'declining';
}

export interface RealtimeDashboard {
  dashboardId: string;
  userId: string;
  generatedAt: Date;
  metrics: RealtimeLearnerMetric[];
  engagementScore: LearnerEngagementScore;
  activityFeed: LearnerActivityFeed;
  learningVelocity: LearningVelocity[];
  recentAlerts: Alert[];
}

export interface Alert {
  alertId: string;
  alertType: 'warning' | 'success' | 'info' | 'critical';
  message: string;
  timestamp: Date;
  actionRequired: boolean;
  actionUrl?: string;
}

export interface MetricSnapshot {
  snapshotId: string;
  userId: string;
  snapshotTime: Date;
  metrics: Record<string, number>;
  timestamp: Date;
}

class RealtimeLearnerAnalyticsService {
  private db = getFirestore();

  async calculateRealtimeMetrics(userId: string): Promise<RealtimeLearnerMetric[]> {
    try {
      const metrics: RealtimeLearnerMetric[] = [];

      // Get user assessment data
      const assessmentQuery = await this.db
        .collection('formative_assessments')
        .where('userId', '==', userId)
        .orderBy('completedAt', 'desc')
        .limit(10)
        .get();

      const assessments = assessmentQuery.docs.map((doc) => doc.data() as any);

      if (assessments.length > 0) {
        const avgScore = assessments.reduce((sum, a) => sum + a.overallScore, 0) / assessments.length;

        metrics.push({
          metricId: `metric_perf_${userId}_${Date.now()}`,
          userId,
          metricType: 'performance',
          metricName: 'Average Assessment Score',
          currentValue: avgScore,
          targetValue: 80,
          lastUpdated: new Date(),
          trend: avgScore >= 75 ? 'up' : 'down',
          trendPercentage: avgScore / 80,
        });
      }

      // Get engagement data
      const activityQuery = await this.db
        .collection('user_activities')
        .where('userId', '==', userId)
        .where('createdAt', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .get();

      metrics.push({
        metricId: `metric_eng_${userId}_${Date.now()}`,
        userId,
        metricType: 'engagement',
        metricName: 'Weekly Activity Count',
        currentValue: activityQuery.size,
        targetValue: 15,
        lastUpdated: new Date(),
        trend: activityQuery.size >= 12 ? 'up' : 'stable',
        trendPercentage: activityQuery.size / 15,
      });

      await this.db.collection('realtime_metrics').add({
        userId,
        metrics,
        calculatedAt: new Date(),
      });

      logSecurityEvent('METRICS_CALCULATED' as any, 'info' as any, 'Real-time metrics calculated', {
        userId,
        metricCount: metrics.length,
      });

      return metrics;
    } catch (error) {
      logSecurityEvent('METRICS_CALCULATION_FAILED' as any, 'error' as any, 'Failed to calculate metrics', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async buildActivityFeed(userId: string): Promise<LearnerActivityFeed> {
    try {
      const feedId = `feed_${userId}_${Date.now()}`;

      const activityQuery = await this.db
        .collection('user_activities')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();

      const activities: ActivityEvent[] = activityQuery.docs.map((doc) => doc.data() as ActivityEvent);

      const lastActivity = activities.length > 0 ? activities[0].timestamp : new Date();

      const feed: LearnerActivityFeed = {
        feedId,
        userId,
        activities,
        lastActivity,
        activeSessionCount: this.countActiveSessions(activities),
        dailyActiveUsers: activities.length,
      };

      await this.db.collection('activity_feeds').doc(feedId).set(feed);

      logSecurityEvent('ACTIVITY_FEED_BUILT' as any, 'info' as any, 'Activity feed built', {
        userId,
        activityCount: activities.length,
      });

      return feed;
    } catch (error) {
      logSecurityEvent('ACTIVITY_FEED_FAILED' as any, 'error' as any, 'Failed to build activity feed', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async calculateEngagementScore(userId: string): Promise<LearnerEngagementScore> {
    try {
      const scoreId = `engagement_${userId}_${Date.now()}`;

      const activityQuery = await this.db
        .collection('user_activities')
        .where('userId', '==', userId)
        .where('timestamp', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .get();

      const participationScore = Math.min(100, (activityQuery.size / 30) * 100);
      const consistencyScore = 75; // Placeholder
      const progressScore = 80; // Placeholder

      const overallEngagement = (participationScore + consistencyScore + progressScore) / 3;

      const score: LearnerEngagementScore = {
        scoreId,
        userId,
        overallEngagement,
        participationScore,
        consistencyScore,
        progressScore,
        calculatedAt: new Date(),
        scoreBreakdown: [
          { componentName: 'Participation', weight: 0.4, currentScore: participationScore, targetScore: 85 },
          { componentName: 'Consistency', weight: 0.3, currentScore: consistencyScore, targetScore: 85 },
          { componentName: 'Progress', weight: 0.3, currentScore: progressScore, targetScore: 85 },
        ],
      };

      await this.db.collection('engagement_scores').doc(scoreId).set(score);

      logSecurityEvent('ENGAGEMENT_SCORE_CALCULATED' as any, 'info' as any, 'Engagement score calculated', {
        userId,
        overallEngagement,
      });

      return score;
    } catch (error) {
      logSecurityEvent('ENGAGEMENT_SCORE_FAILED' as any, 'error' as any, 'Failed to calculate engagement score', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async calculateLearningVelocity(userId: string, conceptId: string): Promise<LearningVelocity> {
    try {
      const velocityId = `velocity_${userId}_${conceptId}_${Date.now()}`;

      const assessmentQuery = await this.db
        .collection('formative_assessments')
        .where('userId', '==', userId)
        .where('conceptId', '==', conceptId)
        .where('completedAt', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .get();

      const assessments = assessmentQuery.docs.map((doc) => doc.data() as any);

      const lessonsCompletedPerWeek = assessments.length;
      const assessmentsTakenPerWeek = assessments.length;
      const averageScoreImprovement = assessments.length > 1 ? 5 : 0;

      const velocity: LearningVelocity = {
        velocityId,
        userId,
        conceptId,
        conceptName: 'Current Concept',
        lessonsCompletedPerWeek,
        assessmentsTakenPerWeek,
        averageScoreImprovement,
        estimatedMasteryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        velocity: lessonsCompletedPerWeek >= 3 ? 'accelerating' : 'steady',
      };

      await this.db.collection('learning_velocities').doc(velocityId).set(velocity);

      logSecurityEvent('VELOCITY_CALCULATED' as any, 'info' as any, 'Learning velocity calculated', {
        userId,
        conceptId,
        velocity: velocity.velocity,
      });

      return velocity;
    } catch (error) {
      logSecurityEvent('VELOCITY_CALCULATION_FAILED' as any, 'error' as any, 'Failed to calculate learning velocity', {
        userId,
        conceptId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async buildRealtimeDashboard(userId: string): Promise<RealtimeDashboard> {
    try {
      const dashboardId = `dashboard_realtime_${userId}_${Date.now()}`;

      const metrics = await this.calculateRealtimeMetrics(userId);
      const engagementScore = await this.calculateEngagementScore(userId);
      const activityFeed = await this.buildActivityFeed(userId);
      const learningVelocity = await this.calculateLearningVelocity(userId, 'default_concept');

      const alerts = this.generateAlerts(metrics, engagementScore, activityFeed);

      const dashboard: RealtimeDashboard = {
        dashboardId,
        userId,
        generatedAt: new Date(),
        metrics,
        engagementScore,
        activityFeed,
        learningVelocity: [learningVelocity],
        recentAlerts: alerts,
      };

      await this.db.collection('realtime_dashboards').doc(dashboardId).set(dashboard);

      logSecurityEvent('DASHBOARD_BUILT' as any, 'info' as any, 'Real-time dashboard built', {
        userId,
        metricCount: metrics.length,
        alertCount: alerts.length,
      });

      return dashboard;
    } catch (error) {
      logSecurityEvent('DASHBOARD_BUILD_FAILED' as any, 'error' as any, 'Failed to build dashboard', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recordMetricSnapshot(userId: string, metrics: Record<string, number>): Promise<MetricSnapshot> {
    try {
      const snapshotId = `snapshot_${userId}_${Date.now()}`;

      const snapshot: MetricSnapshot = {
        snapshotId,
        userId,
        snapshotTime: new Date(),
        metrics,
        timestamp: new Date(),
      };

      await this.db.collection('metric_snapshots').doc(snapshotId).set(snapshot);

      logSecurityEvent('SNAPSHOT_RECORDED' as any, 'info' as any, 'Metric snapshot recorded', {
        userId,
        snapshotId,
        metricCount: Object.keys(metrics).length,
      });

      return snapshot;
    } catch (error) {
      logSecurityEvent('SNAPSHOT_RECORDING_FAILED' as any, 'error' as any, 'Failed to record snapshot', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private countActiveSessions(activities: ActivityEvent[]): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return activities.filter((a) => {
      const actDate = new Date(a.timestamp);
      actDate.setHours(0, 0, 0, 0);
      return actDate.getTime() === today.getTime();
    }).length;
  }

  private generateAlerts(
    metrics: RealtimeLearnerMetric[],
    engagementScore: LearnerEngagementScore,
    activityFeed: LearnerActivityFeed
  ): Alert[] {
    const alerts: Alert[] = [];

    if (engagementScore.overallEngagement < 50) {
      alerts.push({
        alertId: `alert_${Date.now()}_1`,
        alertType: 'warning',
        message: 'Low engagement detected. Consider reviewing learning materials.',
        timestamp: new Date(),
        actionRequired: true,
        actionUrl: '/dashboard/learning-resources',
      });
    }

    const performanceMetric = metrics.find((m) => m.metricType === 'performance');
    if (performanceMetric && performanceMetric.currentValue < 60) {
      alerts.push({
        alertId: `alert_${Date.now()}_2`,
        alertType: 'critical',
        message: 'Performance below target. Additional support recommended.',
        timestamp: new Date(),
        actionRequired: true,
        actionUrl: '/support',
      });
    }

    return alerts;
  }
}

export const realtimeLearnerAnalyticsService = new RealtimeLearnerAnalyticsService();
