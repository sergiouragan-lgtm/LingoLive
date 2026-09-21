import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface Anomaly {
  id: string;
  type: 'engagement_drop' | 'revenue_change' | 'error_spike' | 'churn_spike' | 'performance_degradation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  expectedValue: number;
  actualValue: number;
  deviation: number; // percentage
  detectedAt: Date;
  resolved: boolean;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'change_percent';
  enabled: boolean;
  channels: string[]; // 'email', 'slack', 'in_app'
  createdAt: Date;
}

export interface Alert {
  id: string;
  ruleId: string;
  anomalyId: string;
  severity: string;
  message: string;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

class AnomalyDetectionService {
  private db: Firestore;
  private baselineWindow = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor() {
    this.db = getFirestore();
    this.startAnomalyMonitoring();
  }

  public async detectEngagementAnomaly(userId: string): Promise<Anomaly | null> {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - this.baselineWindow);
      const yesterdayStart = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const yesterdayEnd = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const baselineEvents = await this.db
        .collection('user_events')
        .where('userId', '==', userId)
        .where('timestamp', '>=', sevenDaysAgo)
        .where('timestamp', '<', yesterdayStart)
        .get();

      const yesterdayEvents = await this.db
        .collection('user_events')
        .where('userId', '==', userId)
        .where('timestamp', '>=', yesterdayStart)
        .where('timestamp', '<', yesterdayEnd)
        .get();

      const baselineAvg = baselineEvents.size > 0 ? baselineEvents.size / 6 : 10; // avg per day
      const actualValue = yesterdayEvents.size;
      const deviation = ((baselineAvg - actualValue) / baselineAvg) * 100;

      if (deviation > 50) {
        const anomaly: Anomaly = {
          id: `anomaly-${userId}-${Date.now()}`,
          type: 'engagement_drop',
          severity: deviation > 80 ? 'critical' : 'high',
          metric: 'daily_events',
          expectedValue: Math.round(baselineAvg),
          actualValue,
          deviation: Math.round(deviation),
          detectedAt: now,
          resolved: false,
        };

        await this.db
          .collection('anomalies')
          .doc(anomaly.id)
          .set(anomaly);

        return anomaly;
      }

      return null;
    } catch (error: any) {
      console.error('Error detecting engagement anomaly:', error);
      return null;
    }
  }

  public async detectRevenueAnomaly(): Promise<Anomaly | null> {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - this.baselineWindow);
      const yesterdayStart = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const yesterdayEnd = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const baselinePayments = await this.db
        .collection('payments')
        .where('timestamp', '>=', sevenDaysAgo)
        .where('timestamp', '<', yesterdayStart)
        .where('status', '==', 'completed')
        .get();

      const yesterdayPayments = await this.db
        .collection('payments')
        .where('timestamp', '>=', yesterdayStart)
        .where('timestamp', '<', yesterdayEnd)
        .where('status', '==', 'completed')
        .get();

      const baselineRevenue = baselinePayments.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0) / 6;
      const actualRevenue = yesterdayPayments.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0);
      const deviation = ((baselineRevenue - actualRevenue) / baselineRevenue) * 100;

      if (Math.abs(deviation) > 40) {
        const anomaly: Anomaly = {
          id: `anomaly-revenue-${Date.now()}`,
          type: 'revenue_change',
          severity: Math.abs(deviation) > 70 ? 'critical' : 'high',
          metric: 'daily_revenue',
          expectedValue: Math.round(baselineRevenue),
          actualValue: Math.round(actualRevenue),
          deviation: Math.round(deviation),
          detectedAt: now,
          resolved: false,
        };

        await this.db
          .collection('anomalies')
          .doc(anomaly.id)
          .set(anomaly);

        return anomaly;
      }

      return null;
    } catch (error: any) {
      console.error('Error detecting revenue anomaly:', error);
      return null;
    }
  }

  public async detectErrorSpike(): Promise<Anomaly | null> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - this.baselineWindow);

      const baselineErrors = await this.db
        .collection('error_logs')
        .where('timestamp', '>=', sevenDaysAgo)
        .where('timestamp', '<', oneHourAgo)
        .get();

      const recentErrors = await this.db
        .collection('error_logs')
        .where('timestamp', '>=', oneHourAgo)
        .get();

      const baselineAvg = baselineErrors.size > 0 ? baselineErrors.size / (7 * 24) : 1; // avg per hour
      const actualValue = recentErrors.size;
      const deviation = ((actualValue - baselineAvg) / baselineAvg) * 100;

      if (deviation > 100) {
        const anomaly: Anomaly = {
          id: `anomaly-errors-${Date.now()}`,
          type: 'error_spike',
          severity: deviation > 200 ? 'critical' : 'high',
          metric: 'hourly_errors',
          expectedValue: Math.round(baselineAvg),
          actualValue,
          deviation: Math.round(deviation),
          detectedAt: now,
          resolved: false,
        };

        await this.db
          .collection('anomalies')
          .doc(anomaly.id)
          .set(anomaly);

        return anomaly;
      }

      return null;
    } catch (error: any) {
      console.error('Error detecting error spike:', error);
      return null;
    }
  }

  public async createAlertRule(
    name: string,
    metric: string,
    threshold: number,
    operator: 'gt' | 'lt' | 'change_percent',
    channels: string[]
  ): Promise<AlertRule> {
    try {
      const rule: AlertRule = {
        id: `rule-${Date.now()}`,
        name,
        metric,
        threshold,
        operator,
        enabled: true,
        channels,
        createdAt: new Date(),
      };

      await this.db
        .collection('alert_rules')
        .doc(rule.id)
        .set(rule);

      logSecurityEvent(
        'ALERT_RULE_CREATED' as any,
        'info' as any,
        `Alert rule created: ${name}`,
        { metric, threshold, operator },
        { ruleId: rule.id }
      );

      return rule;
    } catch (error: any) {
      console.error('Error creating alert rule:', error);
      throw error;
    }
  }

  public async getAlertRules(enabled?: boolean): Promise<AlertRule[]> {
    try {
      let query: any = this.db.collection('alert_rules');

      if (enabled !== undefined) {
        query = query.where('enabled', '==', enabled);
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      } as AlertRule));
    } catch (error: any) {
      console.error('Error fetching alert rules:', error);
      return [];
    }
  }

  public async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    try {
      await this.db
        .collection('alerts')
        .doc(alertId)
        .update({
          acknowledged: true,
          acknowledgedAt: new Date(),
          acknowledgedBy: userId,
        });

      logSecurityEvent(
        'ALERT_ACKNOWLEDGED' as any,
        'info' as any,
        `Alert acknowledged`,
        { alertId, acknowledgedBy: userId },
        {}
      );
    } catch (error: any) {
      console.error('Error acknowledging alert:', error);
    }
  }

  public async getAnomalies(limit: number = 100, unresolved: boolean = true): Promise<Anomaly[]> {
    try {
      let query = this.db
        .collection('anomalies')
        .orderBy('detectedAt', 'desc')
        .limit(limit);

      if (unresolved) {
        query = query.where('resolved', '==', false);
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        detectedAt: doc.data().detectedAt?.toDate?.() || new Date(),
      } as Anomaly));
    } catch (error: any) {
      console.error('Error fetching anomalies:', error);
      return [];
    }
  }

  public async resolveAnomaly(anomalyId: string): Promise<void> {
    try {
      await this.db
        .collection('anomalies')
        .doc(anomalyId)
        .update({ resolved: true, resolvedAt: new Date() });
    } catch (error: any) {
      console.error('Error resolving anomaly:', error);
    }
  }

  private startAnomalyMonitoring(): void {
    setInterval(async () => {
      try {
        await this.detectRevenueAnomaly();
        await this.detectErrorSpike();
      } catch (error: any) {
        console.error('Anomaly monitoring error:', error);
      }
    }, 60 * 60 * 1000); // Check hourly
  }
}

export const anomalyDetectionService = new AnomalyDetectionService();
