import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface QueryPerformance {
  queryId: string;
  queryText: string;
  executionTime: number; // milliseconds
  rowsScanned: number;
  rowsReturned: number;
  indexUsed: boolean;
  index?: string;
  timestamp: Date;
}

export interface CacheMetrics {
  metricsId: string;
  cacheType: 'memory' | 'redis' | 'cdn';
  hitCount: number;
  missCount: number;
  hitRate: number; // percentage
  avgAccessTime: number; // milliseconds
  totalSize: number; // bytes
  evictionCount: number;
  timestamp: Date;
}

export interface ResourceUtilization {
  utilizationId: string;
  resourceType: 'cpu' | 'memory' | 'disk' | 'network';
  usage: number; // percentage
  peak: number; // percentage
  average: number; // percentage
  timeRange: { start: Date; end: Date };
  bottlenecks: string[];
}

export interface PerformanceBottleneck {
  bottleneckId: string;
  type: 'query' | 'cache' | 'resource' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  currentValue: number;
  threshold: number;
  estimatedImprovement: number;
  recommendation: string;
  detectedAt: Date;
}

export interface OptimizationSuggestion {
  suggestionId: string;
  title: string;
  description: string;
  estimatedImpact: number; // percentage improvement
  effort: 'low' | 'medium' | 'high';
  category: 'query' | 'caching' | 'indexing' | 'compression' | 'parallelization';
  implementation: string;
  priority: number;
}

export interface PerformanceReport {
  reportId: string;
  timeRange: { start: Date; end: Date };
  overallScore: number; // 0-100
  bottlenecks: PerformanceBottleneck[];
  suggestions: OptimizationSuggestion[];
  metrics: {
    slowQueries: number;
    cacheHitRate: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  generatedAt: Date;
}

export interface IndexRecommendation {
  recommendationId: string;
  table: string;
  columns: string[];
  estimatedBenefit: number;
  queryCount: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'implemented' | 'rejected';
}

class PerformanceOptimizationService {
  private db = getFirestore();

  async recordQueryPerformance(
    queryText: string,
    executionTime: number,
    rowsScanned: number,
    rowsReturned: number,
    indexUsed: boolean,
    index?: string
  ): Promise<QueryPerformance> {
    try {
      const queryId = `query_${Date.now()}`;

      const query: QueryPerformance = {
        queryId,
        queryText,
        executionTime,
        rowsScanned,
        rowsReturned,
        indexUsed,
        index,
        timestamp: new Date(),
      };

      await this.db.collection('query_performance').doc(queryId).set(query);

      logSecurityEvent('QUERY_PERFORMANCE_RECORDED' as any, 'info' as any, 'Query performance recorded', {
        queryId,
        executionTime,
        rowsScanned,
      });

      return query;
    } catch (error) {
      logSecurityEvent('QUERY_PERFORMANCE_RECORDING_FAILED' as any, 'error' as any, 'Failed to record query performance', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recordCacheMetrics(
    cacheType: 'memory' | 'redis' | 'cdn',
    hitCount: number,
    missCount: number,
    avgAccessTime: number,
    totalSize: number,
    evictionCount: number
  ): Promise<CacheMetrics> {
    try {
      const metricsId = `cache_${Date.now()}`;
      const totalCount = hitCount + missCount;
      const hitRate = totalCount > 0 ? (hitCount / totalCount) * 100 : 0;

      const metrics: CacheMetrics = {
        metricsId,
        cacheType,
        hitCount,
        missCount,
        hitRate,
        avgAccessTime,
        totalSize,
        evictionCount,
        timestamp: new Date(),
      };

      await this.db.collection('cache_metrics').doc(metricsId).set(metrics);

      logSecurityEvent('CACHE_METRICS_RECORDED' as any, 'info' as any, 'Cache metrics recorded', {
        metricsId,
        cacheType,
        hitRate: hitRate.toFixed(2),
      });

      return metrics;
    } catch (error) {
      logSecurityEvent('CACHE_METRICS_RECORDING_FAILED' as any, 'error' as any, 'Failed to record cache metrics', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async trackResourceUtilization(
    resourceType: 'cpu' | 'memory' | 'disk' | 'network',
    usage: number,
    peak: number,
    average: number,
    bottlenecks: string[]
  ): Promise<ResourceUtilization> {
    try {
      const utilizationId = `resource_${Date.now()}`;

      const utilization: ResourceUtilization = {
        utilizationId,
        resourceType,
        usage,
        peak,
        average,
        timeRange: { start: new Date(Date.now() - 3600000), end: new Date() },
        bottlenecks,
      };

      await this.db.collection('resource_utilization').doc(utilizationId).set(utilization);

      logSecurityEvent('RESOURCE_UTILIZATION_TRACKED' as any, 'info' as any, 'Resource utilization tracked', {
        utilizationId,
        resourceType,
        usage: usage.toFixed(2),
      });

      return utilization;
    } catch (error) {
      logSecurityEvent('RESOURCE_UTILIZATION_TRACKING_FAILED' as any, 'error' as any, 'Failed to track resource utilization', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async identifyBottleneck(
    type: 'query' | 'cache' | 'resource' | 'network',
    severity: 'low' | 'medium' | 'high' | 'critical',
    component: string,
    currentValue: number,
    threshold: number,
    estimatedImprovement: number,
    recommendation: string
  ): Promise<PerformanceBottleneck> {
    try {
      const bottleneckId = `bottleneck_${Date.now()}`;

      const bottleneck: PerformanceBottleneck = {
        bottleneckId,
        type,
        severity,
        component,
        currentValue,
        threshold,
        estimatedImprovement,
        recommendation,
        detectedAt: new Date(),
      };

      await this.db.collection('performance_bottlenecks').doc(bottleneckId).set(bottleneck);

      logSecurityEvent('BOTTLENECK_IDENTIFIED' as any, 'warn' as any, 'Performance bottleneck identified', {
        bottleneckId,
        type,
        severity,
        component,
      });

      return bottleneck;
    } catch (error) {
      logSecurityEvent('BOTTLENECK_IDENTIFICATION_FAILED' as any, 'error' as any, 'Failed to identify bottleneck', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async generateOptimizationSuggestion(
    title: string,
    description: string,
    estimatedImpact: number,
    effort: 'low' | 'medium' | 'high',
    category: 'query' | 'caching' | 'indexing' | 'compression' | 'parallelization',
    implementation: string,
    priority: number
  ): Promise<OptimizationSuggestion> {
    try {
      const suggestionId = `suggestion_${Date.now()}`;

      const suggestion: OptimizationSuggestion = {
        suggestionId,
        title,
        description,
        estimatedImpact,
        effort,
        category,
        implementation,
        priority,
      };

      await this.db.collection('optimization_suggestions').doc(suggestionId).set(suggestion);

      logSecurityEvent('OPTIMIZATION_SUGGESTION_GENERATED' as any, 'info' as any, 'Optimization suggestion generated', {
        suggestionId,
        category,
        estimatedImpact: estimatedImpact.toFixed(2),
      });

      return suggestion;
    } catch (error) {
      logSecurityEvent('OPTIMIZATION_SUGGESTION_GENERATION_FAILED' as any, 'error' as any, 'Failed to generate optimization suggestion', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async generatePerformanceReport(
    startTime: Date,
    endTime: Date
  ): Promise<PerformanceReport> {
    try {
      const reportId = `report_${Date.now()}`;

      const queriesSnapshot = await this.db.collection('query_performance')
        .where('timestamp', '>=', startTime)
        .where('timestamp', '<=', endTime)
        .get();

      const queries = queriesSnapshot.docs.map((doc) => doc.data() as QueryPerformance);
      const slowQueries = queries.filter((q) => q.executionTime > 1000).length;

      const cacheSnapshot = await this.db.collection('cache_metrics')
        .where('timestamp', '>=', startTime)
        .where('timestamp', '<=', endTime)
        .get();

      const cacheMetrics = cacheSnapshot.docs.map((doc) => doc.data() as CacheMetrics);
      const avgCacheHitRate = cacheMetrics.length > 0
        ? cacheMetrics.reduce((sum, c) => sum + c.hitRate, 0) / cacheMetrics.length
        : 0;

      const bottlenecksSnapshot = await this.db.collection('performance_bottlenecks')
        .where('detectedAt', '>=', startTime)
        .where('detectedAt', '<=', endTime)
        .get();

      const bottlenecks = bottlenecksSnapshot.docs.map((doc) => doc.data() as PerformanceBottleneck);

      const suggestionsSnapshot = await this.db.collection('optimization_suggestions').get();
      const suggestions = suggestionsSnapshot.docs.map((doc) => doc.data() as OptimizationSuggestion)
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 10);

      const responseTimes = queries.map((q) => q.executionTime).sort((a, b) => a - b);
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      const getPercentile = (values: number[], percentile: number) => {
        const index = Math.ceil((percentile / 100) * values.length) - 1;
        return values[Math.max(0, index)];
      };

      const overallScore = Math.max(0, Math.min(100,
        100 - (slowQueries * 5) - ((100 - avgCacheHitRate) * 0.5) - (bottlenecks.length * 10)
      ));

      const report: PerformanceReport = {
        reportId,
        timeRange: { start: startTime, end: endTime },
        overallScore,
        bottlenecks,
        suggestions,
        metrics: {
          slowQueries,
          cacheHitRate: avgCacheHitRate,
          avgResponseTime,
          p95ResponseTime: getPercentile(responseTimes, 95),
          p99ResponseTime: getPercentile(responseTimes, 99),
        },
        generatedAt: new Date(),
      };

      await this.db.collection('performance_reports').doc(reportId).set(report);

      logSecurityEvent('PERFORMANCE_REPORT_GENERATED' as any, 'info' as any, 'Performance report generated', {
        reportId,
        overallScore: overallScore.toFixed(2),
        slowQueries,
      });

      return report;
    } catch (error) {
      logSecurityEvent('PERFORMANCE_REPORT_GENERATION_FAILED' as any, 'error' as any, 'Failed to generate performance report', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recommendIndex(
    table: string,
    columns: string[],
    estimatedBenefit: number,
    queryCount: number,
    priority: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<IndexRecommendation> {
    try {
      const recommendationId = `index_rec_${Date.now()}`;

      const recommendation: IndexRecommendation = {
        recommendationId,
        table,
        columns,
        estimatedBenefit,
        queryCount,
        priority,
        status: 'pending',
      };

      await this.db.collection('index_recommendations').doc(recommendationId).set(recommendation);

      logSecurityEvent('INDEX_RECOMMENDATION_CREATED' as any, 'info' as any, 'Index recommendation created', {
        recommendationId,
        table,
        columns: columns.join(','),
        priority,
      });

      return recommendation;
    } catch (error) {
      logSecurityEvent('INDEX_RECOMMENDATION_CREATION_FAILED' as any, 'error' as any, 'Failed to create index recommendation', {
        table,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getOptimizationInsights(
    timeRange: { start: Date; end: Date }
  ): Promise<{
    bottlenecks: PerformanceBottleneck[];
    suggestions: OptimizationSuggestion[];
    cacheAnalysis: CacheMetrics[];
  }> {
    try {
      const bottlenecksSnapshot = await this.db.collection('performance_bottlenecks')
        .where('detectedAt', '>=', timeRange.start)
        .where('detectedAt', '<=', timeRange.end)
        .orderBy('severity')
        .get();

      const bottlenecks = bottlenecksSnapshot.docs.map((doc) => doc.data() as PerformanceBottleneck);

      const suggestionsSnapshot = await this.db.collection('optimization_suggestions')
        .orderBy('priority')
        .limit(10)
        .get();

      const suggestions = suggestionsSnapshot.docs.map((doc) => doc.data() as OptimizationSuggestion);

      const cacheSnapshot = await this.db.collection('cache_metrics')
        .where('timestamp', '>=', timeRange.start)
        .where('timestamp', '<=', timeRange.end)
        .get();

      const cacheAnalysis = cacheSnapshot.docs.map((doc) => doc.data() as CacheMetrics);

      logSecurityEvent('OPTIMIZATION_INSIGHTS_RETRIEVED' as any, 'info' as any, 'Optimization insights retrieved', {
        bottleneckCount: bottlenecks.length,
        suggestionCount: suggestions.length,
      });

      return { bottlenecks, suggestions, cacheAnalysis };
    } catch (error) {
      logSecurityEvent('OPTIMIZATION_INSIGHTS_RETRIEVAL_FAILED' as any, 'error' as any, 'Failed to retrieve optimization insights', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const performanceOptimizationService = new PerformanceOptimizationService();
