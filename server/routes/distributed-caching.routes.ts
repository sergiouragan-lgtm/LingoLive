import { Router, Request, Response } from 'express';
import { distributedCachingService } from '../services/distributed-caching.service';

const router = Router();

router.post('/clusters/create', async (req: Request, res: Response) => {
  try {
    const { name, nodes, replicas, ttl } = req.body;
    const cluster = await distributedCachingService.createCacheCluster(name, nodes, replicas, ttl);
    res.status(201).json(cluster);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const metrics = await distributedCachingService.getCacheMetrics({ start: startDate, end: endDate });
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
