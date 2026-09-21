import { Router, Request, Response } from 'express';
import { apiSecurityRateLimitingService } from '../services/api-security-rate-limiting.service';

const router = Router();

router.post('/policies/rate-limit/define', async (req: Request, res: Response) => {
  try {
    const { endpoint, method, requestsPerMinute, requestsPerHour, requestsPerDay } = req.body;
    const policy = await apiSecurityRateLimitingService.defineRateLimitPolicy(
      endpoint,
      method,
      requestsPerMinute,
      requestsPerHour,
      requestsPerDay
    );
    res.status(201).json(policy);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/violations/record', async (req: Request, res: Response) => {
  try {
    const { clientId, endpoint, requestCount, limit, ipAddress, severity } = req.body;
    const violation = await apiSecurityRateLimitingService.recordRateLimitViolation(
      clientId,
      endpoint,
      requestCount,
      limit,
      ipAddress,
      severity
    );
    res.status(201).json(violation);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/keys/create', async (req: Request, res: Response) => {
  try {
    const { clientName, scopes, rateLimitTier, expiresAt } = req.body;
    const key = await apiSecurityRateLimitingService.createAPIKey(
      clientName,
      scopes,
      rateLimitTier,
      expiresAt ? new Date(expiresAt) : undefined
    );
    res.status(201).json(key);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/policies/security/define', async (req: Request, res: Response) => {
  try {
    const { name, rules } = req.body;
    const policy = await apiSecurityRateLimitingService.defineAPISecurityPolicy(
      name,
      rules
    );
    res.status(201).json(policy);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/signatures/verify', async (req: Request, res: Response) => {
  try {
    const { clientId, method, endpoint, signatureAlgorithm, publicKeyFingerprint, signatureValid } = req.body;
    const signature = await apiSecurityRateLimitingService.verifyRequestSignature(
      clientId,
      method,
      endpoint,
      signatureAlgorithm,
      publicKeyFingerprint,
      signatureValid
    );
    res.status(201).json(signature);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/metrics/record', async (req: Request, res: Response) => {
  try {
    const { clientId, totalRequests, successfulRequests, failedRequests, rateLimitedRequests, averageResponseTime, bandwidthUsed } = req.body;
    const metrics = await apiSecurityRateLimitingService.recordAPIUsageMetrics(
      clientId,
      totalRequests,
      successfulRequests,
      failedRequests,
      rateLimitedRequests,
      averageResponseTime,
      bandwidthUsed
    );
    res.status(201).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/keys/:keyId/revoke', async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;
    const revoked = await apiSecurityRateLimitingService.revokeAPIKey(keyId);
    res.status(200).json(revoked);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
