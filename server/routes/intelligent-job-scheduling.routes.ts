import { Router, Request, Response } from 'express';
import { intelligentJobSchedulingService } from '../services/intelligent-job-scheduling.service';

const router = Router();

router.post('/jobs/define', async (req: Request, res: Response) => {
  try {
    const { name, schedule, handler, retryPolicy } = req.body;
    const job = await intelligentJobSchedulingService.defineJob(name, schedule, handler, retryPolicy);
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/jobs/execute', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.body;
    const execution = await intelligentJobSchedulingService.executeJob(jobId);
    res.status(201).json(execution);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const metrics = await intelligentJobSchedulingService.getSchedulerMetrics({ start: startDate, end: endDate });
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
