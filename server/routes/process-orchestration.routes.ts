import { Router, Request, Response } from 'express';
import { processOrchestrationService } from '../services/process-orchestration.service';

const router = Router();

router.post('/processes/define', async (req: Request, res: Response) => {
  try {
    const { name, type, stages } = req.body;
    const process = await processOrchestrationService.defineProcess(name, type, stages);
    res.status(201).json(process);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/processes/execute', async (req: Request, res: Response) => {
  try {
    const { processId } = req.body;
    const execution = await processOrchestrationService.executeProcess(processId);
    res.status(201).json(execution);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const metrics = await processOrchestrationService.getProcessMetrics({ start: startDate, end: endDate });
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
