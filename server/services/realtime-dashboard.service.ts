import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';

export interface RealtimeDashboardData {
  timestamp: Date;
  metrics: {
    activeUsers: number;
    totalEvents: number;
    avgEngagement: number;
    revenue: number;
    churnRate: number;
  };
  anomalies: any[];
  alerts: any[];
  topUsers: any[];
  activityHeatmap: Record<string, number>;
}

export interface StreamUpdate {
  type: 'metric_update' | 'anomaly_detected' | 'alert_triggered' | 'user_activity';
  data: any;
  timestamp: Date;
}

class RealtimeDashboardService {
  private db: Firestore;
  private subscribers: Map<string, Set<Function>> = new Map();
  private lastUpdate: Map<string, Date> = new Map();

  constructor() {
    this.db = getFirestore();
    this.startRealtimeUpdates();
  }

  public subscribe(dashboardId: string, callback: Function): () => void {
    if (!this.subscribers.has(dashboardId)) {
      this.subscribers.set(dashboardId, new Set());
    }
    this.subscribers.get(dashboardId)!.add(callback);

    return () => {
      const callbacks = this.subscribers.get(dashboardId);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  public async getRealtimeDashboard(): Promise<RealtimeDashboardData> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Get active users
      const activeUsersSnapshot = await this.db
        .collection('user_events')
        .where('timestamp', '>=', oneHourAgo)
        .get();

      const uniqueUsers = new Set(activeUsersSnapshot.docs.map((d) => d.data().userId)).size;

      // Get engagement metrics
      const engagementMetrics = await this.db
        .collection('engagement_metrics')
        .get();

      const avgEngagement =
        engagementMetrics.size > 0
          ? Math.round(
              engagementMetrics.docs.reduce((sum, d) => sum + (d.data().engagementScore || 0), 0) /
              engagementMetrics.size
            )
          : 0;

      // Get recent revenue
      const paymentsSnapshot = await this.db
        .collection('payments')
        .where('timestamp', '>=', oneHourAgo)
        .where('status', '==', 'completed')
        .get();

      const revenue = paymentsSnapshot.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0);

      // Get churn rate
      const activeSubscriptions = await this.db
        .collection('subscriptions')
        .where('status', '==', 'active')
        .get();

      const cancelledThisHour = await this.db
        .collection('subscriptions')
        .where('status', '==', 'cancelled')
        .where('cancelledAt', '>=', oneHourAgo)
        .get();

      const churnRate =
        activeSubscriptions.size > 0
          ? Math.round((cancelledThisHour.size / activeSubscriptions.size) * 100)
          : 0;

      // Get anomalies
      const anomalies = await this.db
        .collection('anomalies')
        .where('resolved', '==', false)
        .get();

      // Get alerts
      const alerts = await this.db
        .collection('alerts')
        .where('acknowledged', '==', false)
        .get();

      // Get top users
      const userEvents = await this.db
        .collection('user_events')
        .where('timestamp', '>=', oneHourAgo)
        .get();

      const userEventCounts: Record<string, number> = {};
      userEvents.docs.forEach((doc) => {
        const userId = doc.data().userId;
        userEventCounts[userId] = (userEventCounts[userId] || 0) + 1;
      });

      const topUsers = Object.entries(userEventCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([userId, count]) => ({ userId, eventCount: count }));

      // Activity heatmap (by hour)
      const heatmap: Record<string, number> = {};
      for (let h = 0; h < 24; h++) {
        heatmap[h.toString()] = 0;
      }

      userEvents.docs.forEach((doc) => {
        const timestamp = doc.data().timestamp?.toDate?.() || new Date();
        const hour = timestamp.getHours();
        heatmap[hour.toString()]++;
      });

      return {
        timestamp: now,
        metrics: {
          activeUsers: uniqueUsers,
          totalEvents: activeUsersSnapshot.size,
          avgEngagement,
          revenue: Math.round(revenue * 100) / 100,
          churnRate,
        },
        anomalies: anomalies.docs.map((d) => d.data()),
        alerts: alerts.docs.map((d) => d.data()),
        topUsers,
        activityHeatmap: heatmap,
      };
    } catch (error: any) {
      console.error('Error getting realtime dashboard:', error);
      throw error;
    }
  }

  public async broadcastUpdate(update: StreamUpdate): Promise<void> {
    for (const [, callbacks] of this.subscribers) {
      callbacks.forEach((callback) => {
        try {
          callback(update);
        } catch (error) {
          console.error('Error broadcasting update:', error);
        }
      });
    }
  }

  public async getActivityStream(limit: number = 50): Promise<any[]> {
    try {
      const snapshot = await this.db
        .collection('user_events')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(),
      }));
    } catch (error: any) {
      console.error('Error fetching activity stream:', error);
      return [];
    }
  }

  public async getEngagementHeatmap(days: number = 7): Promise<Record<string, Record<string, number>>> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const events = await this.db
        .collection('user_events')
        .where('timestamp', '>=', startDate)
        .get();

      const heatmap: Record<string, Record<string, number>> = {};

      // Initialize heatmap
      for (let d = 0; d < days; d++) {
        const date = new Date(startDate.getTime() + d * 24 * 60 * 60 * 1000);
        const dateKey = date.toISOString().split('T')[0];
        heatmap[dateKey] = {};
        for (let h = 0; h < 24; h++) {
          heatmap[dateKey][h.toString()] = 0;
        }
      }

      // Populate heatmap
      events.docs.forEach((doc) => {
        const timestamp = doc.data().timestamp?.toDate?.() || new Date();
        const dateKey = timestamp.toISOString().split('T')[0];
        const hour = timestamp.getHours();

        if (heatmap[dateKey]) {
          heatmap[dateKey][hour.toString()]++;
        }
      });

      return heatmap;
    } catch (error: any) {
      console.error('Error generating engagement heatmap:', error);
      return {};
    }
  }

  public getSubscriberCount(): number {
    let total = 0;
    for (const [, callbacks] of this.subscribers) {
      total += callbacks.size;
    }
    return total;
  }

  private startRealtimeUpdates(): void {
    setInterval(async () => {
      try {
        const dashboard = await this.getRealtimeDashboard();

        const update: StreamUpdate = {
          type: 'metric_update',
          data: dashboard,
          timestamp: new Date(),
        };

        await this.broadcastUpdate(update);
      } catch (error: any) {
        console.error('Realtime update error:', error);
      }
    }, 30 * 1000); // Update every 30 seconds
  }
}

export const realtimeDashboardService = new RealtimeDashboardService();
