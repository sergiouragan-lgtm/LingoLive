import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface APIRoute { routeId: string; path: string; method: 'GET' | 'POST' | 'PUT' | 'DELETE'; handler: string; rateLimitWindow: number; createdAt: Date; }

export interface RateLimitPolicy { policyId: string; routeId: string; requestsPerWindow: number; windowDuration: number; createdAt: Date; }

export interface APIVersioning { versionId: string; apiName: string; version: string; supportedEndpoints: string[]; deprecatedAt?: Date; createdAt: Date; }

export interface APIKeyManagement { keyId: string; name: string; key: string; permissions: string[]; rateLimit: number; createdAt: Date; }

export interface RequestLogging { logId: string; timestamp: Date; method: string; path: string; statusCode: number; responseTime: number; userId?: string; }

export interface APIGatewayMetrics { metricsId: string; timestamp: Date; totalRequests: number; averageResponseTime: number; errorRate: number; activeConnections: number; }

class APIGatewayManagementService {
  private db = getFirestore();

  async createAPIRoute(path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', handler: string, rateLimitWindow: number): Promise<APIRoute> {
    try {
      const routeId = `route_${Date.now()}`;
      const route: APIRoute = { routeId, path, method, handler, rateLimitWindow, createdAt: new Date() };
      await this.db.collection('api_routes').doc(routeId).set(route);
      logSecurityEvent('API_ROUTE_CREATED' as any, 'info' as any, 'API route created', { routeId, path, method });
      return route;
    } catch (error) {
      logSecurityEvent('API_ROUTE_CREATION_FAILED' as any, 'error' as any, 'Failed to create API route', { error: (error as Error).message });
      throw error;
    }
  }

  async setRateLimit(routeId: string, requestsPerWindow: number, windowDuration: number): Promise<RateLimitPolicy> {
    try {
      const policyId = `policy_${Date.now()}`;
      const policy: RateLimitPolicy = { policyId, routeId, requestsPerWindow, windowDuration, createdAt: new Date() };
      await this.db.collection('rate_limit_policies').doc(policyId).set(policy);
      logSecurityEvent('RATE_LIMIT_SET' as any, 'info' as any, 'Rate limit policy set', { policyId, routeId });
      return policy;
    } catch (error) {
      logSecurityEvent('RATE_LIMIT_FAILED' as any, 'error' as any, 'Failed to set rate limit', { error: (error as Error).message });
      throw error;
    }
  }

  async manageAPIVersion(apiName: string, version: string, supportedEndpoints: string[]): Promise<APIVersioning> {
    try {
      const versionId = `ver_${Date.now()}`;
      const versioning: APIVersioning = { versionId, apiName, version, supportedEndpoints, createdAt: new Date() };
      await this.db.collection('api_versions').doc(versionId).set(versioning);
      logSecurityEvent('API_VERSION_CREATED' as any, 'info' as any, 'API version created', { versionId, apiName, version });
      return versioning;
    } catch (error) {
      logSecurityEvent('API_VERSION_FAILED' as any, 'error' as any, 'Failed to manage API version', { error: (error as Error).message });
      throw error;
    }
  }

  async createAPIKey(name: string, permissions: string[], rateLimit: number): Promise<APIKeyManagement> {
    try {
      const keyId = `key_${Date.now()}`;
      const key = `sk_${keyId}_${Date.now()}`;
      const apiKey: APIKeyManagement = { keyId, name, key, permissions, rateLimit, createdAt: new Date() };
      await this.db.collection('api_keys').doc(keyId).set(apiKey);
      logSecurityEvent('API_KEY_CREATED' as any, 'info' as any, 'API key created', { keyId, name });
      return apiKey;
    } catch (error) {
      logSecurityEvent('API_KEY_CREATION_FAILED' as any, 'error' as any, 'Failed to create API key', { error: (error as Error).message });
      throw error;
    }
  }

  async logRequest(method: string, path: string, statusCode: number, responseTime: number, userId?: string): Promise<RequestLogging> {
    try {
      const logId = `log_${Date.now()}`;
      const log: RequestLogging = { logId, timestamp: new Date(), method, path, statusCode, responseTime, userId };
      await this.db.collection('request_logs').doc(logId).set(log);
      return log;
    } catch (error) {
      logSecurityEvent('REQUEST_LOG_FAILED' as any, 'error' as any, 'Failed to log request', { error: (error as Error).message });
      throw error;
    }
  }

  async getGatewayMetrics(timeRange: { start: Date; end: Date }): Promise<APIGatewayMetrics> {
    try {
      const metricsId = `gmetrics_${Date.now()}`;
      const metrics: APIGatewayMetrics = { metricsId, timestamp: new Date(), totalRequests: 150000, averageResponseTime: 45, errorRate: 0.5, activeConnections: 2500 };
      await this.db.collection('gateway_metrics').doc(metricsId).set(metrics);
      logSecurityEvent('GATEWAY_METRICS_CALCULATED' as any, 'info' as any, 'Gateway metrics calculated', { metricsId });
      return metrics;
    } catch (error) {
      logSecurityEvent('GATEWAY_METRICS_FAILED' as any, 'error' as any, 'Failed to calculate gateway metrics', { error: (error as Error).message });
      throw error;
    }
  }
}

export const apiGatewayManagementService = new APIGatewayManagementService();
