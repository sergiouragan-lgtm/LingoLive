import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface RateLimitPolicy {
  policyId: string;
  endpoint: string;
  method: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface RateLimitViolation {
  violationId: string;
  clientId: string;
  endpoint: string;
  timestamp: Date;
  requestCount: number;
  limit: number;
  ipAddress?: string;
  severity: 'warning' | 'block';
}

export interface APIKey {
  keyId: string;
  clientName: string;
  keyHash: string;
  createdAt: Date;
  expiresAt?: Date;
  scopes: string[];
  status: 'active' | 'inactive' | 'revoked';
  rateLimitTier: 'free' | 'pro' | 'enterprise';
}

export interface APISecurityPolicy {
  policyId: string;
  name: string;
  rules: SecurityRule[];
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface SecurityRule {
  ruleId: string;
  type: 'ip-whitelist' | 'ip-blacklist' | 'require-tls' | 'require-api-key' | 'cors-policy';
  value: string;
  effect: 'allow' | 'deny';
}

export interface RequestSignature {
  signatureId: string;
  clientId: string;
  timestamp: Date;
  method: string;
  endpoint: string;
  signatureAlgorithm: string;
  signatureValid: boolean;
  publicKeyFingerprint: string;
}

export interface APIUsageMetrics {
  metricsId: string;
  clientId: string;
  timestamp: Date;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitedRequests: number;
  averageResponseTime: number;
  bandwidthUsed: number;
}

class APISecurityRateLimitingService {
  private db = getFirestore();

  async defineRateLimitPolicy(
    endpoint: string,
    method: string,
    requestsPerMinute: number,
    requestsPerHour: number,
    requestsPerDay: number
  ): Promise<RateLimitPolicy> {
    try {
      const policyId = `policy_${Date.now()}`;

      const policy: RateLimitPolicy = {
        policyId,
        endpoint,
        method,
        requestsPerMinute,
        requestsPerHour,
        requestsPerDay,
        status: 'active',
        createdAt: new Date(),
      };

      await this.db.collection('rate_limit_policies').doc(policyId).set(policy);

      logSecurityEvent('RATE_LIMIT_POLICY_DEFINED' as any, 'info' as any, 'Rate limit policy defined', {
        policyId,
        endpoint,
        method,
      });

      return policy;
    } catch (error) {
      logSecurityEvent('RATE_LIMIT_POLICY_DEFINITION_FAILED' as any, 'error' as any, 'Failed to define rate limit policy', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recordRateLimitViolation(
    clientId: string,
    endpoint: string,
    requestCount: number,
    limit: number,
    ipAddress?: string,
    severity: 'warning' | 'block' = 'warning'
  ): Promise<RateLimitViolation> {
    try {
      const violationId = `violation_${Date.now()}`;

      const violation: RateLimitViolation = {
        violationId,
        clientId,
        endpoint,
        timestamp: new Date(),
        requestCount,
        limit,
        ipAddress,
        severity,
      };

      await this.db.collection('rate_limit_violations').doc(violationId).set(violation);

      logSecurityEvent('RATE_LIMIT_VIOLATION_RECORDED' as any, 'warn' as any, 'Rate limit violation recorded', {
        violationId,
        clientId,
        endpoint,
        severity,
      });

      return violation;
    } catch (error) {
      logSecurityEvent('RATE_LIMIT_VIOLATION_RECORDING_FAILED' as any, 'error' as any, 'Failed to record rate limit violation', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createAPIKey(
    clientName: string,
    scopes: string[],
    rateLimitTier: 'free' | 'pro' | 'enterprise',
    expiresAt?: Date
  ): Promise<APIKey> {
    try {
      const keyId = `key_${Date.now()}`;
      const keyHash = Buffer.from(keyId).toString('base64');

      const apiKey: APIKey = {
        keyId,
        clientName,
        keyHash,
        createdAt: new Date(),
        expiresAt,
        scopes,
        status: 'active',
        rateLimitTier,
      };

      await this.db.collection('api_keys').doc(keyId).set(apiKey);

      logSecurityEvent('API_KEY_CREATED' as any, 'info' as any, 'API key created', {
        keyId,
        clientName,
        rateLimitTier,
        scopes: scopes.join(','),
      });

      return apiKey;
    } catch (error) {
      logSecurityEvent('API_KEY_CREATION_FAILED' as any, 'error' as any, 'Failed to create API key', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async defineAPISecurityPolicy(
    name: string,
    rules: SecurityRule[]
  ): Promise<APISecurityPolicy> {
    try {
      const policyId = `sec_policy_${Date.now()}`;

      const policy: APISecurityPolicy = {
        policyId,
        name,
        rules,
        status: 'active',
        createdAt: new Date(),
      };

      await this.db.collection('api_security_policies').doc(policyId).set(policy);

      logSecurityEvent('API_SECURITY_POLICY_DEFINED' as any, 'info' as any, 'API security policy defined', {
        policyId,
        name,
        ruleCount: rules.length,
      });

      return policy;
    } catch (error) {
      logSecurityEvent('API_SECURITY_POLICY_DEFINITION_FAILED' as any, 'error' as any, 'Failed to define API security policy', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async verifyRequestSignature(
    clientId: string,
    method: string,
    endpoint: string,
    signatureAlgorithm: string,
    publicKeyFingerprint: string,
    signatureValid: boolean
  ): Promise<RequestSignature> {
    try {
      const signatureId = `sig_${Date.now()}`;

      const signature: RequestSignature = {
        signatureId,
        clientId,
        timestamp: new Date(),
        method,
        endpoint,
        signatureAlgorithm,
        signatureValid,
        publicKeyFingerprint,
      };

      await this.db.collection('request_signatures').doc(signatureId).set(signature);

      if (!signatureValid) {
        logSecurityEvent('INVALID_REQUEST_SIGNATURE' as any, 'warn' as any, 'Invalid request signature', {
          signatureId,
          clientId,
          endpoint,
        });
      }

      return signature;
    } catch (error) {
      logSecurityEvent('REQUEST_SIGNATURE_VERIFICATION_FAILED' as any, 'error' as any, 'Failed to verify request signature', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recordAPIUsageMetrics(
    clientId: string,
    totalRequests: number,
    successfulRequests: number,
    failedRequests: number,
    rateLimitedRequests: number,
    averageResponseTime: number,
    bandwidthUsed: number
  ): Promise<APIUsageMetrics> {
    try {
      const metricsId = `metrics_${Date.now()}`;

      const metrics: APIUsageMetrics = {
        metricsId,
        clientId,
        timestamp: new Date(),
        totalRequests,
        successfulRequests,
        failedRequests,
        rateLimitedRequests,
        averageResponseTime,
        bandwidthUsed,
      };

      await this.db.collection('api_usage_metrics').doc(metricsId).set(metrics);

      logSecurityEvent('API_USAGE_METRICS_RECORDED' as any, 'info' as any, 'API usage metrics recorded', {
        metricsId,
        clientId,
        totalRequests,
        rateLimitedRequests,
      });

      return metrics;
    } catch (error) {
      logSecurityEvent('API_USAGE_METRICS_RECORDING_FAILED' as any, 'error' as any, 'Failed to record API usage metrics', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async revokeAPIKey(
    keyId: string
  ): Promise<APIKey> {
    try {
      const keyDoc = await this.db.collection('api_keys').doc(keyId).get();
      const key = keyDoc.data() as APIKey;

      if (!key) throw new Error('API key not found');

      const revokedKey: APIKey = {
        ...key,
        status: 'revoked',
      };

      await keyDoc.ref.update(revokedKey);

      logSecurityEvent('API_KEY_REVOKED' as any, 'warn' as any, 'API key revoked', {
        keyId,
        clientName: key.clientName,
      });

      return revokedKey;
    } catch (error) {
      logSecurityEvent('API_KEY_REVOCATION_FAILED' as any, 'error' as any, 'Failed to revoke API key', {
        keyId,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const apiSecurityRateLimitingService = new APISecurityRateLimitingService();
