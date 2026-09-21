import { Router, Request, Response } from 'express';
import { schedulingService } from '../services/scheduling.service';
const router = Router();
router.post('/create', async (req: Request, res: Response) => {
  try { const { jobName, cronExpression } = req.body; const s = await schedulingService.createSchedule(jobName, cronExpression); res.status(201).json(s); }
  catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
export default router;
