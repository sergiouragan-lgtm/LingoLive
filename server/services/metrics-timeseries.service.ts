import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface TimeSeriesMetric {
  metricId: string;
  name: string;
  value: number;
  timestamp: Date;
  labels: Record<string, string>;
  unit: string;
}

export interface SystemMetrics {
  metricsId: string;
  timestamp: Date;
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  diskUsage: number; // percentage
  networkBytesIn: number;
  networkBytesOut: number;
  activeConnections: number;
}

export interface ApplicationMetrics {
  metricsId: string;
  timestamp: Date;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  activeUsers: number;
  activeSessions: number;
}

export interface BusinessMetrics {
  metricsId: string;
  timestamp: Date;
  totalRevenue: number;
  activeSubscriptions: number;
  newUsers: number;
  churnRate: number; // percentage
  conversionRate: number; // percentage
  customMetrics: Record<string, number>;
}

export interface MetricTimeSeries {
  seriesId: string;
  metricName: string;
  dataPoints: TimeSeriesMetric[];
  aggregation: 'raw' | 'min' | 'max' | 'avg' | 'sum';
  interval: number; // seconds
  retentionDays: number;
}

export interface MetricDashboard {
  dashboardId: string;
  name: string;
  description: string;
  metrics: string[];
  refreshInterval: number; // seconds
  createdAt: Date;
  updatedAt: Date;
}

class MetricsTimeseriesService {
  private db = getFirestore();

  async recordSystemMetrics(
    cpuUsage: number,
    memoryUsage: number,
    diskUsage: number,
    networkBytesIn: number,
    networkBytesOut: number,
    activeConnections: number
  ): Promise<SystemMetrics> {
    try {
      const metricsId = `sys_metrics_${Date.now()}`;

      const metrics: SystemMetrics = {
        metricsId,
        timestamp: new Date(),
        cpuUsage,
        memoryUsage,
        diskUsage,
        networkBytesIn,
        networkBytesOut,
        activeConnections,
      };

      await this.db.collection('system_metrics').doc(metricsId).set(metrics);

      logSecurityEvent('SYSTEM_METRICS_RECORDED' as any, 'info' as any, 'System metrics recorded', {
        metricsId,
        cpuUsage: cpuUsage.toFixed(1),
        memoryUsage: memoryUsage.toFixed(1),
      });

      return metrics;
    } catch (error) {
      logSecurityEvent('SYSTEM_METRICS_RECORDING_FAILED' as any, 'error' as any, 'Failed to record system metrics', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recordApplicationMetrics(
    totalRequests: number,
    successfulRequests: number,
    failedRequests: number,
    avgResponseTime: number,
    activeUsers: number,
    activeSessions: number
  ): Promise<ApplicationMetrics> {
    try {
      const metricsId = `app_metrics_${Date.now()}`;

      const metrics: ApplicationMetrics = {
        metricsId,
        timestamp: new Date(),
        totalRequests,
        successfulRequests,
        failedRequests,
        avgResponseTime,
        activeUsers,
        activeSessions,
      };

      await this.db.collection('application_metrics').doc(metricsId).set(metrics);

      logSecurityEvent('APPLICATION_METRICS_RECORDED' as any, 'info' as any, 'Application metrics recorded', {
        metricsId,
        totalRequests,
        avgResponseTime: avgResponseTime.toFixed(2),
      });

      return metrics;
    } catch (error) {
      logSecurityEvent('APPLICATION_METRICS_RECORDING_FAILED' as any, 'error' as any, 'Failed to record application metrics', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recordBusinessMetrics(
    totalRevenue: number,
    activeSubscriptions: number,
    newUsers: number,
    churnRate: number,
    conversionRate: number,
    customMetrics?: Record<string, number>
  ): Promise<BusinessMetrics> {
    try {
      const metricsId = `biz_metrics_${Date.now()}`;

      const metrics: BusinessMetrics = {
        metricsId,
        timestamp: new Date(),
        totalRevenue,
        activeSubscriptions,
        newUsers,
        churnRate,
        conversionRate,
        customMetrics: customMetrics || {},
      };

      await this.db.collection('business_metrics').doc(metricsId).set(metrics);

      logSecurityEvent('BUSINESS_METRICS_RECORDED' as any, 'info' as any, 'Business metrics recorded', {
        metricsId,
        totalRevenue: totalRevenue.toFixed(2),
        activeSubscriptions,
      });

      return metrics;
    } catch (error) {
      logSecurityEvent('BUSINESS_METRICS_RECORDING_FAILED' as any, 'error' as any, 'Failed to record business metrics', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recordCustomMetric(
    name: string,
    value: number,
    unit: string,
    labels?: Record<string, string>
  ): Promise<TimeSeriesMetric> {
    try {
      const metricId = `custom_metric_${Date.now()}`;

      const metric: TimeSeriesMetric = {
        metricId,
        name,
        value,
        timestamp: new Date(),
        labels: labels || {},
        unit,
      };

      await this.db.collection('custom_metrics').doc(metricId).set(metric);

      logSecurityEvent('CUSTOM_METRIC_RECORDED' as any, 'info' as any, 'Custom metric recorded', {
        metricId,
        name,
        value: value.toFixed(2),
        unit,
      });

      return metric;
    } catch (error) {
      logSecurityEvent('CUSTOM_METRIC_RECORDING_FAILED' as any, 'error' as any, 'Failed to record custom metric', {
        name,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createMetricTimeSeries(
    metricName: string,
    aggregation: 'raw' | 'min' | 'max' | 'avg' | 'sum',
    interval: number,
    retentionDays: number
  ): Promise<MetricTimeSeries> {
    try {
      const seriesId = `series_${Date.now()}`;

      const series: MetricTimeSeries = {
        seriesId,
        metricName,
        dataPoints: [],
        aggregation,
        interval,
        retentionDays,
      };

      await this.db.collection('metric_timeseries').doc(seriesId).set(series);

      logSecurityEvent('METRIC_TIMESERIES_CREATED' as any, 'info' as any, 'Metric time series created', {
        seriesId,
        metricName,
        aggregation,
        interval,
      });

      return series;
    } catch (error) {
      logSecurityEvent('METRIC_TIMESERIES_CREATION_FAILED' as any, 'error' as any, 'Failed to create metric time series', {
        metricName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createMetricDashboard(
    name: string,
    description: string,
    metrics: string[],
    refreshInterval: number
  ): Promise<MetricDashboard> {
    try {
      const dashboardId = `dashboard_${Date.now()}`;

      const dashboard: MetricDashboard = {
        dashboardId,
        name,
        description,
        metrics,
        refreshInterval,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.db.collection('metric_dashboards').doc(dashboardId).set(dashboard);

      logSecurityEvent('METRIC_DASHBOARD_CREATED' as any, 'info' as any, 'Metric dashboard created', {
        dashboardId,
        name,
        metrics: metrics.length,
      });

      return dashboard;
    } catch (error) {
      logSecurityEvent('METRIC_DASHBOARD_CREATION_FAILED' as any, 'error' as any, 'Failed to create metric dashboard', {
        name,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getMetricHistory(
    metricName: string,
    startTime: Date,
    endTime: Date,
    aggregation?: 'raw' | 'min' | 'max' | 'avg' | 'sum'
  ): Promise<TimeSeriesMetric[]> {
    try {
      let query = this.db.collection('custom_metrics')
        .where('name', '==', metricName)
        .where('timestamp', '>=', startTime)
        .where('timestamp', '<=', endTime);

      const snapshot = await query.get();
      const metrics = snapshot.docs.map((doc) => doc.data() as TimeSeriesMetric);

      logSecurityEvent('METRIC_HISTORY_RETRIEVED' as any, 'info' as any, 'Metric history retrieved', {
        metricName,
        count: metrics.length,
        aggregation: aggregation || 'none',
      });

      return metrics;
    } catch (error) {
      logSecurityEvent('METRIC_HISTORY_RETRIEVAL_FAILED' as any, 'error' as any, 'Failed to retrieve metric history', {
        metricName,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const metricsTimeseriesService = new MetricsTimeseriesService();
