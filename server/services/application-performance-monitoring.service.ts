import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface PerformanceMetric {
  metricId: string;
  endpoint: string;
  method: string;
  responseTime: number; // milliseconds
  statusCode: number;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

export interface LatencyPercentile {
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface APMReport {
  reportId: string;
  timeRange: { start: Date; end: Date };
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  latencyPercentiles: LatencyPercentile;
  throughput: number; // requests per second
  errorRate: number; // percentage
  slowRequests: number; // requests > 1s
  endpoints: EndpointMetrics[];
  generatedAt: Date;
}

export interface EndpointMetrics {
  endpoint: string;
  method: string;
  requestCount: number;
  successCount: number;
  errorCount: number;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  latencyPercentiles: LatencyPercentile;
  errorRate: number;
}

export interface ErrorMetric {
  errorId: string;
  endpoint: string;
  errorType: string;
  statusCode: number;
  message: string;
  stackTrace?: string;
  timestamp: Date;
  userId?: string;
  frequency: number;
}

export interface ThroughputMetric {
  metricId: string;
  timestamp: Date;
  requestsPerSecond: number;
  successPerSecond: number;
  failurePerSecond: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

class ApplicationPerformanceMonitoringService {
  private db = getFirestore();

  async recordPerformanceMetric(
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number,
    userId?: string,
    sessionId?: string
  ): Promise<PerformanceMetric> {
    try {
      const metricId = `perf_${Date.now()}`;

      const metric: PerformanceMetric = {
        metricId,
        endpoint,
        method,
        responseTime,
        statusCode,
        timestamp: new Date(),
        userId,
        sessionId,
      };

      await this.db.collection('performance_metrics').doc(metricId).set(metric);

      logSecurityEvent('PERFORMANCE_METRIC_RECORDED' as any, 'info' as any, 'Performance metric recorded', {
        metricId,
        endpoint,
        method,
        responseTime,
        statusCode,
      });

      return metric;
    } catch (error) {
      logSecurityEvent('PERFORMANCE_METRIC_RECORDING_FAILED' as any, 'error' as any, 'Failed to record performance metric', {
        endpoint,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recordErrorMetric(
    endpoint: string,
    errorType: string,
    statusCode: number,
    message: string,
    userId?: string,
    stackTrace?: string
  ): Promise<ErrorMetric> {
    try {
      const errorId = `error_${Date.now()}`;

      const error: ErrorMetric = {
        errorId,
        endpoint,
        errorType,
        statusCode,
        message,
        stackTrace,
        timestamp: new Date(),
        userId,
        frequency: 1,
      };

      await this.db.collection('error_metrics').doc(errorId).set(error);

      logSecurityEvent('ERROR_METRIC_RECORDED' as any, 'warn' as any, 'Error metric recorded', {
        errorId,
        endpoint,
        errorType,
        statusCode,
      });

      return error;
    } catch (error) {
      logSecurityEvent('ERROR_METRIC_RECORDING_FAILED' as any, 'error' as any, 'Failed to record error metric', {
        endpoint,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recordThroughputMetric(
    requestsPerSecond: number,
    successPerSecond: number,
    failurePerSecond: number,
    avgResponseTime: number,
    p95ResponseTime: number,
    p99ResponseTime: number
  ): Promise<ThroughputMetric> {
    try {
      const metricId = `throughput_${Date.now()}`;

      const metric: ThroughputMetric = {
        metricId,
        timestamp: new Date(),
        requestsPerSecond,
        successPerSecond,
        failurePerSecond,
        avgResponseTime,
        p95ResponseTime,
        p99ResponseTime,
      };

      await this.db.collection('throughput_metrics').doc(metricId).set(metric);

      logSecurityEvent('THROUGHPUT_METRIC_RECORDED' as any, 'info' as any, 'Throughput metric recorded', {
        metricId,
        requestsPerSecond,
        avgResponseTime,
      });

      return metric;
    } catch (error) {
      logSecurityEvent('THROUGHPUT_METRIC_RECORDING_FAILED' as any, 'error' as any, 'Failed to record throughput metric', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async generateAPMReport(
    startTime: Date,
    endTime: Date
  ): Promise<APMReport> {
    try {
      const reportId = `apm_report_${Date.now()}`;

      const snapshot = await this.db.collection('performance_metrics')
        .where('timestamp', '>=', startTime)
        .where('timestamp', '<=', endTime)
        .get();

      const metrics = snapshot.docs.map((doc) => doc.data() as PerformanceMetric);
      const totalRequests = metrics.length;
      const successfulRequests = metrics.filter((m) => m.statusCode < 400).length;
      const failedRequests = totalRequests - successfulRequests;
      const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;

      const responseTimes = metrics.map((m) => m.responseTime).sort((a, b) => a - b);
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      const report: APMReport = {
        reportId,
        timeRange: { start: startTime, end: endTime },
        totalRequests,
        successfulRequests,
        failedRequests,
        averageResponseTime: avgResponseTime,
        latencyPercentiles: this.calculatePercentiles(responseTimes),
        throughput: totalRequests / ((endTime.getTime() - startTime.getTime()) / 1000),
        errorRate,
        slowRequests: metrics.filter((m) => m.responseTime > 1000).length,
        endpoints: [],
        generatedAt: new Date(),
      };

      await this.db.collection('apm_reports').doc(reportId).set(report);

      logSecurityEvent('APM_REPORT_GENERATED' as any, 'info' as any, 'APM report generated', {
        reportId,
        totalRequests,
        errorRate: errorRate.toFixed(2),
      });

      return report;
    } catch (error) {
      logSecurityEvent('APM_REPORT_GENERATION_FAILED' as any, 'error' as any, 'Failed to generate APM report', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getEndpointMetrics(
    endpoint: string,
    startTime: Date,
    endTime: Date
  ): Promise<EndpointMetrics> {
    try {
      const snapshot = await this.db.collection('performance_metrics')
        .where('endpoint', '==', endpoint)
        .where('timestamp', '>=', startTime)
        .where('timestamp', '<=', endTime)
        .get();

      const metrics = snapshot.docs.map((doc) => doc.data() as PerformanceMetric);
      const requestCount = metrics.length;
      const successCount = metrics.filter((m) => m.statusCode < 400).length;
      const errorCount = requestCount - successCount;

      const responseTimes = metrics.map((m) => m.responseTime).sort((a, b) => a - b);

      const endpointMetrics: EndpointMetrics = {
        endpoint,
        method: metrics[0]?.method || 'UNKNOWN',
        requestCount,
        successCount,
        errorCount,
        avgResponseTime: responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : 0,
        maxResponseTime: responseTimes.length > 0 ? responseTimes[responseTimes.length - 1] : 0,
        minResponseTime: responseTimes.length > 0 ? responseTimes[0] : 0,
        latencyPercentiles: this.calculatePercentiles(responseTimes),
        errorRate: requestCount > 0 ? (errorCount / requestCount) * 100 : 0,
      };

      logSecurityEvent('ENDPOINT_METRICS_RETRIEVED' as any, 'info' as any, 'Endpoint metrics retrieved', {
        endpoint,
        requestCount,
        errorRate: endpointMetrics.errorRate.toFixed(2),
      });

      return endpointMetrics;
    } catch (error) {
      logSecurityEvent('ENDPOINT_METRICS_RETRIEVAL_FAILED' as any, 'error' as any, 'Failed to retrieve endpoint metrics', {
        endpoint,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private calculatePercentiles(sortedValues: number[]): LatencyPercentile {
    if (sortedValues.length === 0) {
      return { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 };
    }

    const getPercentile = (values: number[], percentile: number) => {
      const index = Math.ceil((percentile / 100) * values.length) - 1;
      return values[Math.max(0, index)];
    };

    return {
      p50: getPercentile(sortedValues, 50),
      p75: getPercentile(sortedValues, 75),
      p90: getPercentile(sortedValues, 90),
      p95: getPercentile(sortedValues, 95),
      p99: getPercentile(sortedValues, 99),
    };
  }
}

export const applicationPerformanceMonitoringService = new ApplicationPerformanceMonitoringService();
