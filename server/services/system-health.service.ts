import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface HealthMetric {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  value: number | string;
  threshold?: number;
  unit?: string;
  lastChecked: Date;
}

export interface SystemHealth {
  overallStatus: 'healthy' | 'warning' | 'critical';
  timestamp: Date;
  metrics: Record<string, HealthMetric>;
  alerts: string[];
  uptime: number; // percentage
}

export interface PerformanceMetric {
  endpoint: string;
  method: string;
  avgResponseTime: number; // ms
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number; // percentage
  requestCount: number;
}

export interface ErrorLog {
  id: string;
  timestamp: Date;
  message: string;
  stack?: string;
  userId?: string;
  endpoint?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

class SystemHealthService {
  private db: Firestore;
  private startTime: Date = new Date();

  constructor() {
    this.db = getFirestore();
  }

  public async getSystemHealth(): Promise<SystemHealth> {
    try {
      const metrics: Record<string, HealthMetric> = {};
      const alerts: string[] = [];

      const firestoreHealth = await this.checkFirestoreHealth();
      metrics.firestore = firestoreHealth;
      if (firestoreHealth.status !== 'healthy') {
        alerts.push(`Firestore health: ${firestoreHealth.status}`);
      }

      const memoryHealth = this.checkMemoryHealth();
      metrics.memory = memoryHealth;
      if (memoryHealth.status !== 'healthy') {
        alerts.push(`Memory usage: ${memoryHealth.status}`);
      }

      const databaseHealth = await this.checkDatabaseConnectivity();
      metrics.database = databaseHealth;
      if (databaseHealth.status !== 'healthy') {
        alerts.push(`Database connectivity: ${databaseHealth.status}`);
      }

      const uptime = this.calculateUptime();

      const overallStatus =
        alerts.length > 2 ? 'critical' : alerts.length > 0 ? 'warning' : 'healthy';

      const health: SystemHealth = {
        overallStatus,
        timestamp: new Date(),
        metrics,
        alerts,
        uptime,
      };

      return health;
    } catch (error: any) {
      console.error('Error checking system health:', error);
      return {
        overallStatus: 'critical',
        timestamp: new Date(),
        metrics: {},
        alerts: ['System health check failed'],
        uptime: 0,
      };
    }
  }

  public async getPerformanceMetrics(hours: number = 24): Promise<PerformanceMetric[]> {
    try {
      const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

      const logs = await this.db
        .collection('api_performance_logs')
        .where('timestamp', '>=', startDate)
        .get();

      const metricsMap: Record<string, any> = {};

      logs.docs.forEach((doc) => {
        const data = doc.data();
        const key = `${data.endpoint}-${data.method}`;

        if (!metricsMap[key]) {
          metricsMap[key] = {
            endpoint: data.endpoint,
            method: data.method,
            responseTimes: [],
            errors: 0,
            total: 0,
          };
        }

        metricsMap[key].responseTimes.push(data.responseTime || 0);
        metricsMap[key].total++;
        if (data.statusCode >= 400) metricsMap[key].errors++;
      });

      return Object.values(metricsMap).map((m: any) => ({
        endpoint: m.endpoint,
        method: m.method,
        avgResponseTime: this.average(m.responseTimes),
        p95ResponseTime: this.percentile(m.responseTimes, 0.95),
        p99ResponseTime: this.percentile(m.responseTimes, 0.99),
        errorRate: (m.errors / m.total) * 100,
        requestCount: m.total,
      }));
    } catch (error: any) {
      console.error('Error fetching performance metrics:', error);
      return [];
    }
  }

  public async logError(
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    stack?: string,
    userId?: string,
    endpoint?: string
  ): Promise<ErrorLog> {
    try {
      const errorLog: ErrorLog = {
        id: `error-${Date.now()}`,
        timestamp: new Date(),
        message,
        stack,
        userId,
        endpoint,
        severity,
        resolved: false,
      };

      await this.db
        .collection('error_logs')
        .doc(errorLog.id)
        .set(errorLog);

      if (severity === 'critical') {
        logSecurityEvent(
          'CRITICAL_ERROR' as any,
          'error' as any,
          `Critical error occurred: ${message}`,
          { endpoint, userId },
          { severity }
        );
      }

      return errorLog;
    } catch (error: any) {
      console.error('Error logging error:', error);
      throw error;
    }
  }

  public async getErrorLogs(limit: number = 100, severity?: string): Promise<ErrorLog[]> {
    try {
      let query = this.db
        .collection('error_logs')
        .orderBy('timestamp', 'desc')
        .limit(limit);

      if (severity) {
        query = query.where('severity', '==', severity);
      }

      const snapshot = await query.get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(),
      } as ErrorLog));
    } catch (error: any) {
      console.error('Error fetching error logs:', error);
      return [];
    }
  }

  public async markErrorResolved(errorId: string): Promise<void> {
    try {
      await this.db
        .collection('error_logs')
        .doc(errorId)
        .update({ resolved: true, resolvedAt: new Date() });
    } catch (error: any) {
      console.error('Error marking error as resolved:', error);
    }
  }

  public async getUpstreamServiceStatus(): Promise<Record<string, any>> {
    try {
      const services: Record<string, any> = {
        firebase: { status: 'unknown', lastChecked: new Date() },
        openai: { status: 'unknown', lastChecked: new Date() },
        stripe: { status: 'unknown', lastChecked: new Date() },
      };

      const snapshot = await this.db.collection('users').limit(1).get();
      if (snapshot.size > 0) {
        services.firebase.status = 'healthy';
      }

      return services;
    } catch (error: any) {
      console.error('Error checking upstream services:', error);
      return {};
    }
  }

  public async logPerformanceMetric(
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number
  ): Promise<void> {
    try {
      await this.db
        .collection('api_performance_logs')
        .add({
          endpoint,
          method,
          responseTime,
          statusCode,
          timestamp: new Date(),
        });
    } catch (error: any) {
      console.error('Error logging performance metric:', error);
    }
  }

  private async checkFirestoreHealth(): Promise<HealthMetric> {
    try {
      const startTime = Date.now();
      await this.db.collection('users').limit(1).get();
      const latency = Date.now() - startTime;

      return {
        name: 'Firestore',
        status: latency < 1000 ? 'healthy' : 'warning',
        value: latency,
        unit: 'ms',
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        name: 'Firestore',
        status: 'critical',
        value: -1,
        lastChecked: new Date(),
      };
    }
  }

  private checkMemoryHealth(): HealthMetric {
    const used = process.memoryUsage();
    const usedPercent = (used.heapUsed / used.heapTotal) * 100;

    return {
      name: 'Memory',
      status: usedPercent > 90 ? 'critical' : usedPercent > 75 ? 'warning' : 'healthy',
      value: Math.round(usedPercent),
      threshold: 80,
      unit: '%',
      lastChecked: new Date(),
    };
  }

  private async checkDatabaseConnectivity(): Promise<HealthMetric> {
    try {
      const startTime = Date.now();
      const docRef = this.db.collection('_health').doc('ping');
      await docRef.set({ timestamp: new Date() }, { merge: true });
      const latency = Date.now() - startTime;

      return {
        name: 'Database',
        status: latency < 500 ? 'healthy' : 'warning',
        value: latency,
        unit: 'ms',
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        name: 'Database',
        status: 'critical',
        value: -1,
        lastChecked: new Date(),
      };
    }
  }

  private calculateUptime(): number {
    const elapsed = Date.now() - this.startTime.getTime();
    const expectedUptime = 24 * 60 * 60 * 1000; // 24 hours baseline
    return Math.min(100, (elapsed / expectedUptime) * 100);
  }

  private average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const sorted = arr.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }
}

export const systemHealthService = new SystemHealthService();
