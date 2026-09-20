import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface Span {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  operationName: string;
  serviceName: string;
  startTime: Date;
  endTime: Date;
  duration: number; // milliseconds
  tags: Record<string, any>;
  logs: SpanLog[];
  status: 'success' | 'error' | 'timeout';
  errorMessage?: string;
}

export interface SpanLog {
  timestamp: Date;
  message: string;
  level: string;
  fields: Record<string, any>;
}

export interface Trace {
  traceId: string;
  operationName: string;
  startTime: Date;
  endTime: Date;
  duration: number; // milliseconds
  spanCount: number;
  errorCount: number;
  status: 'success' | 'error' | 'partial';
  servicePath: string[];
  spans: Span[];
}

export interface TraceSampling {
  samplingId: string;
  serviceName: string;
  samplingRate: number; // percentage
  samplingStrategy: 'always' | 'never' | 'probabilistic' | 'rate-limiting';
  maxTracesPerSecond: number;
}

export interface TraceAnalysis {
  analysisId: string;
  traceId: string;
  criticalPath: Span[];
  bottlenecks: SpanBottleneck[];
  totalLatency: number;
  networkLatency: number;
  processingLatency: number;
  recommendations: string[];
}

export interface SpanBottleneck {
  spanId: string;
  operationName: string;
  duration: number;
  percentage: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class DistributedTracingService {
  private db = getFirestore();

  async createSpan(
    traceId: string,
    operationName: string,
    serviceName: string,
    parentSpanId?: string
  ): Promise<Span> {
    try {
      const spanId = `span_${Date.now()}`;
      const startTime = new Date();

      const span: Span = {
        spanId,
        traceId,
        parentSpanId,
        operationName,
        serviceName,
        startTime,
        endTime: startTime,
        duration: 0,
        tags: {},
        logs: [],
        status: 'success',
      };

      await this.db.collection('spans').doc(spanId).set(span);

      logSecurityEvent('SPAN_CREATED' as any, 'info' as any, 'Span created', {
        spanId,
        traceId,
        operationName,
        serviceName,
      });

      return span;
    } catch (error) {
      logSecurityEvent('SPAN_CREATION_FAILED' as any, 'error' as any, 'Failed to create span', {
        operationName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async completeSpan(
    spanId: string,
    status: 'success' | 'error' | 'timeout',
    errorMessage?: string
  ): Promise<Span> {
    try {
      const spanDoc = await this.db.collection('spans').doc(spanId).get();
      const span = spanDoc.data() as Span;

      if (!span) throw new Error('Span not found');

      const endTime = new Date();
      const duration = endTime.getTime() - span.startTime.getTime();

      const updatedSpan: Span = {
        ...span,
        endTime,
        duration,
        status,
        errorMessage,
      };

      await spanDoc.ref.update(updatedSpan);

      logSecurityEvent('SPAN_COMPLETED' as any, 'info' as any, 'Span completed', {
        spanId,
        duration,
        status,
      });

      return updatedSpan;
    } catch (error) {
      logSecurityEvent('SPAN_COMPLETION_FAILED' as any, 'error' as any, 'Failed to complete span', {
        spanId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async addSpanLog(
    spanId: string,
    message: string,
    level: string,
    fields?: Record<string, any>
  ): Promise<SpanLog> {
    try {
      const spanDoc = await this.db.collection('spans').doc(spanId).get();
      const span = spanDoc.data() as Span;

      if (!span) throw new Error('Span not found');

      const log: SpanLog = {
        timestamp: new Date(),
        message,
        level,
        fields: fields || {},
      };

      const updatedLogs = [...span.logs, log];
      await spanDoc.ref.update({ logs: updatedLogs });

      logSecurityEvent('SPAN_LOG_ADDED' as any, 'debug' as any, 'Span log added', {
        spanId,
        message,
        level,
      });

      return log;
    } catch (error) {
      logSecurityEvent('SPAN_LOG_ADDITION_FAILED' as any, 'error' as any, 'Failed to add span log', {
        spanId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createTrace(
    traceId: string,
    operationName: string
  ): Promise<Trace> {
    try {
      const startTime = new Date();

      const trace: Trace = {
        traceId,
        operationName,
        startTime,
        endTime: startTime,
        duration: 0,
        spanCount: 0,
        errorCount: 0,
        status: 'success',
        servicePath: [],
        spans: [],
      };

      await this.db.collection('traces').doc(traceId).set(trace);

      logSecurityEvent('TRACE_CREATED' as any, 'info' as any, 'Trace created', {
        traceId,
        operationName,
      });

      return trace;
    } catch (error) {
      logSecurityEvent('TRACE_CREATION_FAILED' as any, 'error' as any, 'Failed to create trace', {
        operationName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async completeTrace(
    traceId: string,
    status: 'success' | 'error' | 'partial'
  ): Promise<Trace> {
    try {
      const traceDoc = await this.db.collection('traces').doc(traceId).get();
      const trace = traceDoc.data() as Trace;

      if (!trace) throw new Error('Trace not found');

      const endTime = new Date();
      const duration = endTime.getTime() - trace.startTime.getTime();

      const spansSnapshot = await this.db.collection('spans')
        .where('traceId', '==', traceId)
        .get();

      const spans = spansSnapshot.docs.map((doc) => doc.data() as Span);
      const errorCount = spans.filter((s) => s.status === 'error').length;

      const updatedTrace: Trace = {
        ...trace,
        endTime,
        duration,
        status,
        spanCount: spans.length,
        errorCount,
        spans,
      };

      await traceDoc.ref.update(updatedTrace);

      logSecurityEvent('TRACE_COMPLETED' as any, 'info' as any, 'Trace completed', {
        traceId,
        duration,
        spanCount: spans.length,
        status,
      });

      return updatedTrace;
    } catch (error) {
      logSecurityEvent('TRACE_COMPLETION_FAILED' as any, 'error' as any, 'Failed to complete trace', {
        traceId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async setSampling(
    serviceName: string,
    samplingRate: number,
    strategy: 'always' | 'never' | 'probabilistic' | 'rate-limiting',
    maxTracesPerSecond?: number
  ): Promise<TraceSampling> {
    try {
      const samplingId = `sampling_${Date.now()}`;

      const sampling: TraceSampling = {
        samplingId,
        serviceName,
        samplingRate,
        samplingStrategy: strategy,
        maxTracesPerSecond: maxTracesPerSecond || 1000,
      };

      await this.db.collection('trace_sampling').doc(samplingId).set(sampling);

      logSecurityEvent('TRACE_SAMPLING_SET' as any, 'info' as any, 'Trace sampling configured', {
        samplingId,
        serviceName,
        samplingRate,
        strategy,
      });

      return sampling;
    } catch (error) {
      logSecurityEvent('TRACE_SAMPLING_CONFIGURATION_FAILED' as any, 'error' as any, 'Failed to configure trace sampling', {
        serviceName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async analyzeTrace(
    traceId: string
  ): Promise<TraceAnalysis> {
    try {
      const analysisId = `analysis_${Date.now()}`;

      const traceDoc = await this.db.collection('traces').doc(traceId).get();
      const trace = traceDoc.data() as Trace;

      if (!trace) throw new Error('Trace not found');

      const spansSnapshot = await this.db.collection('spans')
        .where('traceId', '==', traceId)
        .get();

      const spans = spansSnapshot.docs.map((doc) => doc.data() as Span);
      spans.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      const criticalPath = this.findCriticalPath(spans);
      const bottlenecks = this.identifyBottlenecks(spans);

      const analysis: TraceAnalysis = {
        analysisId,
        traceId,
        criticalPath,
        bottlenecks,
        totalLatency: trace.duration,
        networkLatency: this.calculateNetworkLatency(spans),
        processingLatency: this.calculateProcessingLatency(spans),
        recommendations: this.generateRecommendations(bottlenecks),
      };

      await this.db.collection('trace_analyses').doc(analysisId).set(analysis);

      logSecurityEvent('TRACE_ANALYZED' as any, 'info' as any, 'Trace analyzed', {
        analysisId,
        traceId,
        bottlenecks: bottlenecks.length,
      });

      return analysis;
    } catch (error) {
      logSecurityEvent('TRACE_ANALYSIS_FAILED' as any, 'error' as any, 'Failed to analyze trace', {
        traceId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private findCriticalPath(spans: Span[]): Span[] {
    return spans.filter((s) => !s.parentSpanId).slice(0, 5);
  }

  private identifyBottlenecks(spans: Span[]): SpanBottleneck[] {
    const totalDuration = Math.max(...spans.map((s) => s.endTime.getTime())) -
                         Math.min(...spans.map((s) => s.startTime.getTime()));

    return spans
      .map((span) => {
        const severity: 'low' | 'medium' | 'high' | 'critical' = span.duration > totalDuration * 0.5 ? 'critical' :
                 span.duration > totalDuration * 0.3 ? 'high' :
                 span.duration > totalDuration * 0.1 ? 'medium' : 'low';
        return {
          spanId: span.spanId,
          operationName: span.operationName,
          duration: span.duration,
          percentage: (span.duration / totalDuration) * 100,
          severity,
        };
      })
      .filter((b) => b.severity !== 'low')
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);
  }

  private calculateNetworkLatency(spans: Span[]): number {
    return spans
      .filter((s) => s.operationName.includes('network') || s.operationName.includes('http'))
      .reduce((sum, s) => sum + s.duration, 0);
  }

  private calculateProcessingLatency(spans: Span[]): number {
    return spans
      .filter((s) => !s.operationName.includes('network') && !s.operationName.includes('http'))
      .reduce((sum, s) => sum + s.duration, 0);
  }

  private generateRecommendations(bottlenecks: SpanBottleneck[]): string[] {
    return bottlenecks.map((b) => `Optimize ${b.operationName}: takes ${b.percentage.toFixed(1)}% of total time`);
  }
}

export const distributedTracingService = new DistributedTracingService();
