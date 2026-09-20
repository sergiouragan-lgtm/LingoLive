import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface ModelServer {
  id: string;
  name: string;
  modelId: string;
  version: string;
  endpoint: string;
  status: 'running' | 'stopped' | 'error';
  latency: number; // milliseconds
  throughput: number; // requests per second
  uptime: number; // percentage
  createdAt: Date;
  lastHealthCheck?: Date;
}

export interface ModelInferenceRequest {
  id: string;
  modelId: string;
  inputData: Record<string, any>;
  batchSize: number;
  priority: 'low' | 'normal' | 'high';
  requestedAt: Date;
}

export interface ModelInferenceResponse {
  requestId: string;
  modelId: string;
  predictions: number[] | Record<string, number>;
  confidence: number;
  latency: number;
  inferenceVersion: string;
  respondedAt: Date;
}

export interface ModelServingMetrics {
  modelId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  cacheHitRate: number;
  metricsAt: Date;
}

export interface InferenceCache {
  cacheKey: string;
  modelId: string;
  inputHash: string;
  prediction: any;
  confidence: number;
  expiresAt: Date;
  createdAt: Date;
}

class ModelServingService {
  private db: FirebaseFirestore.Firestore;
  private inferenceCache: Map<string, any> = new Map();

  constructor() {
    this.db = getFirestore();
    this.scheduleHealthChecks();
    this.cleanupExpiredCache();
  }

  public async startModelServer(
    modelId: string,
    version: string,
    endpoint: string
  ): Promise<ModelServer> {
    try {
      const serverId = `server-${modelId}-${Date.now()}`;

      const server: ModelServer = {
        id: serverId,
        name: `Model Server ${modelId}`,
        modelId,
        version,
        endpoint,
        status: 'running',
        latency: 0,
        throughput: 0,
        uptime: 100,
        createdAt: new Date(),
      };

      await this.db
        .collection('model_servers')
        .doc(serverId)
        .set(server);

      logSecurityEvent(
        'MODEL_SERVER_STARTED' as any,
        'info' as any,
        `Model server started for ${modelId}`,
        { version, endpoint },
        { serverId }
      );

      return server;
    } catch (error: any) {
      console.error('Error starting model server:', error);
      throw error;
    }
  }

  public async stopModelServer(serverId: string): Promise<void> {
    try {
      await this.db
        .collection('model_servers')
        .doc(serverId)
        .update({
          status: 'stopped',
        });

      logSecurityEvent(
        'MODEL_SERVER_STOPPED' as any,
        'info' as any,
        `Model server stopped`,
        { serverId },
        {}
      );
    } catch (error: any) {
      console.error('Error stopping model server:', error);
    }
  }

  public async getModelServers(status?: string): Promise<ModelServer[]> {
    try {
      let query: any = this.db.collection('model_servers');

      if (status) {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        lastHealthCheck: doc.data().lastHealthCheck?.toDate?.() || undefined,
      } as ModelServer));
    } catch (error: any) {
      console.error('Error fetching model servers:', error);
      return [];
    }
  }

  public async performInference(
    modelId: string,
    inputData: Record<string, any>,
    batchSize: number = 1,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<ModelInferenceResponse> {
    try {
      const requestId = `infer-${modelId}-${Date.now()}`;
      const startTime = Date.now();

      // Check cache first
      const cacheKey = this.generateCacheKey(modelId, inputData);
      const cachedResult = this.getCachedPrediction(cacheKey);
      if (cachedResult) {
        const latency = Date.now() - startTime;
        await this.recordInferenceMetrics(modelId, latency, true);
        return cachedResult;
      }

      // Perform inference
      const predictions = this.runInference(inputData, modelId);
      const latency = Date.now() - startTime;

      const response: ModelInferenceResponse = {
        requestId,
        modelId,
        predictions,
        confidence: 0.92,
        latency,
        inferenceVersion: '1.0',
        respondedAt: new Date(),
      };

      // Cache result
      await this.cacheInference(cacheKey, modelId, inputData, response);
      await this.recordInferenceMetrics(modelId, latency, false);

      return response;
    } catch (error: any) {
      console.error('Error performing inference:', error);
      throw error;
    }
  }

  public async batchInference(
    modelId: string,
    requests: Array<{ inputData: Record<string, any>; priority?: string }>
  ): Promise<ModelInferenceResponse[]> {
    try {
      const responses: ModelInferenceResponse[] = [];

      for (const req of requests) {
        const response = await this.performInference(
          modelId,
          req.inputData,
          1,
          (req.priority as 'low' | 'normal' | 'high') || 'normal'
        );
        responses.push(response);
      }

      return responses;
    } catch (error: any) {
      console.error('Error performing batch inference:', error);
      throw error;
    }
  }

  public async getServingMetrics(modelId: string): Promise<ModelServingMetrics> {
    try {
      const metrics = await this.db
        .collection('inference_metrics')
        .where('modelId', '==', modelId)
        .limit(1000)
        .get();

      const docs = metrics.docs.map((d) => d.data());
      const successCount = docs.filter((d) => d.success).length;
      const failedCount = docs.filter((d) => !d.success).length;
      const latencies = docs.map((d) => d.latency || 0).sort((a, b) => a - b);

      const p95Index = Math.floor(latencies.length * 0.95);
      const p99Index = Math.floor(latencies.length * 0.99);

      return {
        modelId,
        totalRequests: docs.length,
        successfulRequests: successCount,
        failedRequests: failedCount,
        averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
        p95Latency: latencies[p95Index] || 0,
        p99Latency: latencies[p99Index] || 0,
        errorRate: (failedCount / docs.length) * 100,
        cacheHitRate: (docs.filter((d) => d.cached).length / docs.length) * 100,
        metricsAt: new Date(),
      };
    } catch (error: any) {
      console.error('Error getting serving metrics:', error);
      throw error;
    }
  }

  public async scaleModelServer(serverId: string, replicas: number): Promise<void> {
    try {
      await this.db
        .collection('model_servers')
        .doc(serverId)
        .update({
          replicas,
          throughput: replicas * 100,
        });

      logSecurityEvent(
        'MODEL_SERVER_SCALED' as any,
        'info' as any,
        `Model server scaled to ${replicas} replicas`,
        { serverId, replicas },
        {}
      );
    } catch (error: any) {
      console.error('Error scaling model server:', error);
    }
  }

  public async getInferenceHistory(modelId: string, limit: number = 100): Promise<ModelInferenceRequest[]> {
    try {
      const snapshot = await this.db
        .collection('inference_requests')
        .where('modelId', '==', modelId)
        .orderBy('requestedAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate?.() || new Date(),
      } as ModelInferenceRequest));
    } catch (error: any) {
      console.error('Error fetching inference history:', error);
      return [];
    }
  }

  private generateCacheKey(modelId: string, inputData: Record<string, any>): string {
    const hash = JSON.stringify(inputData)
      .split('')
      .reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
    return `${modelId}-${hash}`;
  }

  private getCachedPrediction(cacheKey: string): ModelInferenceResponse | null {
    const cached = this.inferenceCache.get(cacheKey);
    if (!cached || cached.expiresAt < Date.now()) {
      return null;
    }
    return cached.response;
  }

  private runInference(inputData: Record<string, any>, modelId: string): number[] {
    // Simulated inference - in production would call actual model
    const baseScore = Object.values(inputData).reduce((sum, val) => {
      return sum + (typeof val === 'number' ? val : 0);
    }, 0);

    return [baseScore * 0.01, 1 - baseScore * 0.01];
  }

  private async cacheInference(
    cacheKey: string,
    modelId: string,
    inputData: Record<string, any>,
    response: ModelInferenceResponse
  ): Promise<void> {
    const cache: InferenceCache = {
      cacheKey,
      modelId,
      inputHash: JSON.stringify(inputData),
      prediction: response.predictions,
      confidence: response.confidence,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      createdAt: new Date(),
    };

    this.inferenceCache.set(cacheKey, { ...cache, response });

    try {
      await this.db
        .collection('inference_cache')
        .doc(cacheKey)
        .set(cache);
    } catch (error) {
      console.error('Error caching inference:', error);
    }
  }

  private async recordInferenceMetrics(modelId: string, latency: number, cached: boolean): Promise<void> {
    try {
      await this.db
        .collection('inference_metrics')
        .add({
          modelId,
          latency,
          cached,
          success: true,
          timestamp: new Date(),
        });
    } catch (error) {
      console.error('Error recording metrics:', error);
    }
  }

  private scheduleHealthChecks(): void {
    setInterval(async () => {
      try {
        const servers = await this.getModelServers('running');

        for (const server of servers) {
          const metrics = await this.getServingMetrics(server.modelId);
          const uptime = 100 - metrics.errorRate;

          await this.db
            .collection('model_servers')
            .doc(server.id)
            .update({
              uptime: Math.max(0, uptime),
              lastHealthCheck: new Date(),
              latency: metrics.averageLatency,
              throughput: metrics.totalRequests / 60, // per minute
            });
        }
      } catch (error: any) {
        console.error('Health check error:', error);
      }
    }, 60 * 1000); // Every minute
  }

  private cleanupExpiredCache(): void {
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, value] of this.inferenceCache.entries()) {
        if (value.expiresAt < now) {
          this.inferenceCache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`Cleaned ${cleaned} expired cache entries`);
      }
    }, 10 * 60 * 1000); // Every 10 minutes
  }
}

export const modelServingService = new ModelServingService();
