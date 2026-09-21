import { Router, Request, Response } from 'express';
import { networkOptimizationService } from '../services/network-optimization.service';

const router = Router();

router.post('/profiles/create', async (req: Request, res: Response) => {
  try {
    const { name, bandwidth, latency, jitter } = req.body;
    const profile = await networkOptimizationService.createNetworkProfile(name, bandwidth, latency, jitter);
    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/load-balancer/configure', async (req: Request, res: Response) => {
  try {
    const { name, algorithm, healthCheckInterval } = req.body;
    const lb = await networkOptimizationService.configureLoadBalancer(name, algorithm, healthCheckInterval);
    res.status(201).json(lb);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/optimize/bandwidth', async (req: Request, res: Response) => {
  try {
    const optimization = await networkOptimizationService.optimizeBandwidth();
    res.status(201).json(optimization);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await networkOptimizationService.getNetworkMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
