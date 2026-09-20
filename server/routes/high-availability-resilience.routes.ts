import { Router, Request, Response } from 'express';
import { highAvailabilityResilienceService } from '../services/high-availability-resilience.service';

const router = Router();

router.post('/replicas/create', async (req: Request, res: Response) => {
  try {
    const { name, replicas, minReplicas, maxReplicas } = req.body;
    const replicaSet = await highAvailabilityResilienceService.createReplicaSet(name, replicas, minReplicas, maxReplicas);
    res.status(201).json(replicaSet);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/health-check/configure', async (req: Request, res: Response) => {
  try {
    const { endpoint, interval, timeout, healthyThreshold } = req.body;
    const config = await highAvailabilityResilienceService.configureHealthCheck(endpoint, interval, timeout, healthyThreshold);
    res.status(201).json(config);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/circuit-breaker/setup', async (req: Request, res: Response) => {
  try {
    const { serviceId, failureThreshold, resetTimeout } = req.body;
    const breaker = await highAvailabilityResilienceService.setupCircuitBreaker(serviceId, failureThreshold, resetTimeout);
    res.status(201).json(breaker);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await highAvailabilityResilienceService.getResilienceMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
