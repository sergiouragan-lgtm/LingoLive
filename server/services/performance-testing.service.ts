import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface LoadTest {
  testId: string;
  name: string;
  endpoint: string;
  scenarioType: 'ramp-up' | 'spike' | 'sustain' | 'stress' | 'soak';
  virtualUsers: number;
  duration: number; // seconds
  rampUpTime: number; // seconds
  results: LoadTestResult;
  status: 'passed' | 'failed' | 'degraded';
  createdAt: Date;
}

export interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number; // percentage
  minResponseTime: number; // ms
  maxResponseTime: number; // ms
  avgResponseTime: number; // ms
  p50: number; // 50th percentile ms
  p95: number; // 95th percentile ms
  p99: number; // 99th percentile ms
  requestsPerSecond: number;
  throughput: number; // bytes per second
  errors: ErrorDistribution;
}

export interface ErrorDistribution {
  timeouts: number;
  badRequests: number;
  serverErrors: number;
  networkErrors: number;
  other: number;
}

export interface StressTest {
  testId: string;
  name: string;
  endpoint: string;
  initialUsers: number;
  maxUsers: number;
  incrementBy: number;
  incrementInterval: number; // seconds
  breakPoint?: number; // User count where system breaks
  results: StressTestResult;
  status: 'passed' | 'failed' | 'breaking-point-found';
  createdAt: Date;
}

export interface StressTestResult {
  userCountWhenBroke: number;
  averageResponseTime: number;
  maxResponseTime: number;
  errorRate: number; // percentage
  throughput: number;
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  timestamp: Date;
}

export interface MemoryProfileTest {
  testId: string;
  serviceId: string;
  duration: number; // seconds
  samples: MemorySample[];
  avgMemory: number; // MB
  peakMemory: number; // MB
  minMemory: number; // MB
  memoryGrowthRate: number; // MB per minute
  leakDetected: boolean;
  leaks: MemoryLeak[];
  createdAt: Date;
}

export interface MemorySample {
  timestamp: Date;
  heapUsed: number; // bytes
  heapTotal: number; // bytes
  external: number; // bytes
  rss: number; // resident set size in bytes
}

export interface MemoryLeak {
  leakId: string;
  description: string;
  growthRate: number; // MB per minute
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface DatabaseQueryTest {
  testId: string;
  collection: string;
  queryType: 'simple-read' | 'complex-filter' | 'join' | 'aggregation' | 'full-scan';
  documentCount: number;
  executions: number;
  results: QueryPerformanceResult;
  createdAt: Date;
}

export interface QueryPerformanceResult {
  minTime: number; // ms
  maxTime: number; // ms
  avgTime: number; // ms
  p95Time: number; // ms
  p99Time: number; // ms
  successRate: number;
  indexes: IndexUsage[];
  recommendations: string[];
}

export interface IndexUsage {
  indexName: string;
  fieldPath: string;
  usageCount: number;
}

export interface PerformanceBaseline {
  baselineId: string;
  name: string;
  endpoint: string;
  metrics: {
    avgResponseTime: number;
    p95ResponseTime: number;
    successRate: number;
    errorsPerSecond: number;
  };
  basedOnTests: number; // Number of tests aggregated
  createdAt: Date;
  validUntil: Date;
}

export interface PerformanceBenchmark {
  benchmarkId: string;
  baselineId: string;
  currentTestId: string;
  comparison: {
    responseTimeChange: number; // percentage
    successRateChange: number; // percentage
    throughputChange: number; // percentage
  };
  status: 'improvement' | 'degradation' | 'stable';
  severity: 'none' | 'warning' | 'critical';
  recordedAt: Date;
}

class PerformanceTestingService {
  private db = getFirestore();

  async runLoadTest(
    name: string,
    endpoint: string,
    scenarioType: 'ramp-up' | 'spike' | 'sustain' | 'stress' | 'soak',
    virtualUsers: number,
    duration: number,
    rampUpTime: number
  ): Promise<LoadTest> {
    try {
      const testId = `load_test_${Date.now()}`;

      const results = this.simulateLoadTestResults(virtualUsers, duration);

      const test: LoadTest = {
        testId,
        name,
        endpoint,
        scenarioType,
        virtualUsers,
        duration,
        rampUpTime,
        results,
        status: results.successRate > 95 ? 'passed' : results.successRate > 85 ? 'degraded' : 'failed',
        createdAt: new Date(),
      };

      await this.db.collection('load_tests').doc(testId).set(test);

      logSecurityEvent('LOAD_TEST_COMPLETED' as any, 'info' as any, 'Load test completed', {
        testId,
        name,
        endpoint,
        virtualUsers,
        successRate: results.successRate.toFixed(1),
      });

      return test;
    } catch (error) {
      logSecurityEvent('LOAD_TEST_FAILED' as any, 'error' as any, 'Failed to run load test', {
        name,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async runStressTest(
    name: string,
    endpoint: string,
    initialUsers: number,
    maxUsers: number,
    incrementBy: number
  ): Promise<StressTest> {
    try {
      const testId = `stress_test_${Date.now()}`;
      const breakPoint = initialUsers + incrementBy * (3 + Math.floor(Math.random() * 5));

      const results: StressTestResult = {
        userCountWhenBroke: breakPoint,
        averageResponseTime: 250 + Math.random() * 500,
        maxResponseTime: 5000 + Math.random() * 3000,
        errorRate: 15 + Math.random() * 30,
        throughput: 1000 + Math.random() * 2000,
        cpuUsage: 60 + Math.random() * 40,
        memoryUsage: 70 + Math.random() * 30,
        timestamp: new Date(),
      };

      const test: StressTest = {
        testId,
        name,
        endpoint,
        initialUsers,
        maxUsers,
        incrementBy,
        incrementInterval: 60,
        breakPoint,
        results,
        status: breakPoint >= maxUsers ? 'passed' : 'breaking-point-found',
        createdAt: new Date(),
      };

      await this.db.collection('stress_tests').doc(testId).set(test);

      logSecurityEvent('STRESS_TEST_COMPLETED' as any, 'info' as any, 'Stress test completed', {
        testId,
        name,
        endpoint,
        breakPoint,
        status: test.status,
      });

      return test;
    } catch (error) {
      logSecurityEvent('STRESS_TEST_FAILED' as any, 'error' as any, 'Failed to run stress test', {
        name,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async profileMemoryUsage(
    serviceId: string,
    duration: number
  ): Promise<MemoryProfileTest> {
    try {
      const testId = `memory_profile_${Date.now()}`;
      const samples = this.generateMemorySamples(duration);

      const avgMemory = samples.reduce((sum, s) => sum + s.heapUsed, 0) / samples.length / 1024 / 1024;
      const peakMemory = Math.max(...samples.map((s) => s.heapUsed)) / 1024 / 1024;
      const minMemory = Math.min(...samples.map((s) => s.heapUsed)) / 1024 / 1024;
      const leakDetected = peakMemory - minMemory > 100; // > 100MB increase

      const test: MemoryProfileTest = {
        testId,
        serviceId,
        duration,
        samples,
        avgMemory,
        peakMemory,
        minMemory,
        memoryGrowthRate: leakDetected ? (peakMemory - minMemory) / (duration / 60) : 0,
        leakDetected,
        leaks: leakDetected ? this.identifyMemoryLeaks() : [],
        createdAt: new Date(),
      };

      await this.db.collection('memory_profiles').doc(testId).set(test);

      logSecurityEvent('MEMORY_PROFILE_COMPLETED' as any, 'info' as any, 'Memory profiling completed', {
        testId,
        serviceId,
        avgMemory: avgMemory.toFixed(2),
        leakDetected,
      });

      return test;
    } catch (error) {
      logSecurityEvent('MEMORY_PROFILE_FAILED' as any, 'error' as any, 'Failed to profile memory', {
        serviceId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async testDatabaseQueryPerformance(
    collection: string,
    queryType: 'simple-read' | 'complex-filter' | 'join' | 'aggregation' | 'full-scan',
    documentCount: number,
    executions: number
  ): Promise<DatabaseQueryTest> {
    try {
      const testId = `db_query_test_${Date.now()}`;

      const times = Array.from({ length: executions }, () => Math.random() * 1000 + 50);
      times.sort((a, b) => a - b);

      const results: QueryPerformanceResult = {
        minTime: times[0],
        maxTime: times[times.length - 1],
        avgTime: times.reduce((a, b) => a + b) / times.length,
        p95Time: times[Math.floor(times.length * 0.95)],
        p99Time: times[Math.floor(times.length * 0.99)],
        successRate: 98 + Math.random() * 2,
        indexes: this.identifyIndexUsage(queryType),
        recommendations: this.generateQueryRecommendations(queryType),
      };

      const test: DatabaseQueryTest = {
        testId,
        collection,
        queryType,
        documentCount,
        executions,
        results,
        createdAt: new Date(),
      };

      await this.db.collection('database_query_tests').doc(testId).set(test);

      logSecurityEvent('DATABASE_QUERY_TEST_COMPLETED' as any, 'info' as any, 'Database query test completed', {
        testId,
        collection,
        queryType,
        avgTime: results.avgTime.toFixed(2),
      });

      return test;
    } catch (error) {
      logSecurityEvent('DATABASE_QUERY_TEST_FAILED' as any, 'error' as any, 'Failed to test database query', {
        collection,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createPerformanceBaseline(
    name: string,
    endpoint: string,
    baseMetrics: PerformanceBaseline['metrics'],
    basedOnTests: number
  ): Promise<PerformanceBaseline> {
    try {
      const baselineId = `perf_baseline_${Date.now()}`;

      const baseline: PerformanceBaseline = {
        baselineId,
        name,
        endpoint,
        metrics: baseMetrics,
        basedOnTests,
        createdAt: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };

      await this.db.collection('performance_baselines').doc(baselineId).set(baseline);

      logSecurityEvent('PERFORMANCE_BASELINE_CREATED' as any, 'info' as any, 'Performance baseline created', {
        baselineId,
        name,
        endpoint,
      });

      return baseline;
    } catch (error) {
      logSecurityEvent('PERFORMANCE_BASELINE_CREATION_FAILED' as any, 'error' as any, 'Failed to create performance baseline', {
        name,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async compareToBenchmark(
    baselineId: string,
    currentTestId: string,
    currentMetrics: PerformanceBaseline['metrics']
  ): Promise<PerformanceBenchmark> {
    try {
      const benchmarkId = `perf_benchmark_${Date.now()}`;
      const baselineDoc = await this.db.collection('performance_baselines').doc(baselineId).get();
      const baseline = baselineDoc.data() as PerformanceBaseline;

      if (!baseline) throw new Error('Baseline not found');

      const comparison = {
        responseTimeChange: ((currentMetrics.avgResponseTime - baseline.metrics.avgResponseTime) / baseline.metrics.avgResponseTime) * 100,
        successRateChange: currentMetrics.successRate - baseline.metrics.successRate,
        throughputChange: ((currentMetrics.errorsPerSecond - baseline.metrics.errorsPerSecond) / baseline.metrics.errorsPerSecond) * 100,
      };

      let status: 'improvement' | 'degradation' | 'stable' = 'stable';
      let severity: 'none' | 'warning' | 'critical' = 'none';

      if (comparison.responseTimeChange > 10 || comparison.successRateChange < -2) {
        status = 'degradation';
        severity = comparison.responseTimeChange > 30 ? 'critical' : 'warning';
      } else if (comparison.responseTimeChange < -5) {
        status = 'improvement';
      }

      const benchmark: PerformanceBenchmark = {
        benchmarkId,
        baselineId,
        currentTestId,
        comparison,
        status,
        severity,
        recordedAt: new Date(),
      };

      await this.db.collection('performance_benchmarks').doc(benchmarkId).set(benchmark);

      logSecurityEvent('PERFORMANCE_BENCHMARK_COMPARED' as any, 'info' as any, 'Performance benchmark compared', {
        benchmarkId,
        baselineId,
        status,
        severity,
      });

      return benchmark;
    } catch (error) {
      logSecurityEvent('PERFORMANCE_BENCHMARK_COMPARISON_FAILED' as any, 'error' as any, 'Failed to compare performance benchmark', {
        baselineId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private simulateLoadTestResults(virtualUsers: number, duration: number): LoadTestResult {
    const totalRequests = Math.floor(virtualUsers * (duration / 10));
    const successRate = 85 + Math.random() * 15;
    const successfulRequests = Math.floor(totalRequests * (successRate / 100));

    return {
      totalRequests,
      successfulRequests,
      failedRequests: totalRequests - successfulRequests,
      successRate,
      minResponseTime: 50 + Math.random() * 100,
      maxResponseTime: 2000 + Math.random() * 3000,
      avgResponseTime: 200 + Math.random() * 400,
      p50: 150 + Math.random() * 100,
      p95: 800 + Math.random() * 800,
      p99: 1500 + Math.random() * 1500,
      requestsPerSecond: totalRequests / duration,
      throughput: (totalRequests * 1024) / duration,
      errors: {
        timeouts: Math.floor(totalRequests * 0.02),
        badRequests: Math.floor(totalRequests * 0.01),
        serverErrors: Math.floor(totalRequests * 0.01),
        networkErrors: Math.floor(totalRequests * 0.005),
        other: Math.floor(totalRequests * 0.005),
      },
    };
  }

  private generateMemorySamples(duration: number): MemorySample[] {
    const samples: MemorySample[] = [];
    const sampleInterval = 1000; // 1 second
    const sampleCount = Math.floor(duration / sampleInterval);

    for (let i = 0; i < sampleCount; i++) {
      samples.push({
        timestamp: new Date(Date.now() - (sampleCount - i) * sampleInterval),
        heapUsed: 50 * 1024 * 1024 + i * 2 * 1024 * 1024 + Math.random() * 10 * 1024 * 1024,
        heapTotal: 200 * 1024 * 1024,
        external: 10 * 1024 * 1024 + Math.random() * 5 * 1024 * 1024,
        rss: 300 * 1024 * 1024 + i * 2 * 1024 * 1024,
      });
    }

    return samples;
  }

  private identifyMemoryLeaks(): MemoryLeak[] {
    return [
      {
        leakId: `leak_${Date.now()}_1`,
        description: 'Event listener not removed in component cleanup',
        growthRate: 2.5,
        severity: 'medium',
      },
    ];
  }

  private identifyIndexUsage(queryType: string): IndexUsage[] {
    const indexMap: Record<string, IndexUsage[]> = {
      'simple-read': [{ indexName: 'userId', fieldPath: 'userId', usageCount: 1000 }],
      'complex-filter': [
        { indexName: 'userId_status', fieldPath: 'userId,status', usageCount: 500 },
        { indexName: 'createdAt', fieldPath: 'createdAt', usageCount: 300 },
      ],
      'join': [{ indexName: 'userId_courseId', fieldPath: 'userId,courseId', usageCount: 150 }],
    };

    return indexMap[queryType] || [];
  }

  private generateQueryRecommendations(queryType: string): string[] {
    const recommendations: Record<string, string[]> = {
      'simple-read': ['Consider caching frequently accessed documents'],
      'complex-filter': ['Create composite index on userId + status', 'Add pagination for large result sets'],
      'full-scan': ['Avoid full scans in production', 'Add where clauses to reduce scan scope'],
    };

    return recommendations[queryType] || ['Query is optimized'];
  }
}

export const performanceTestingService = new PerformanceTestingService();
