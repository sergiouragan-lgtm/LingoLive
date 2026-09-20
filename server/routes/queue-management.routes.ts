import { Router, Request, Response } from 'express';
import { queueManagementService } from '../services/queue-management.service';
const router = Router();
router.post('/jobs/enqueue', async (req: Request, res: Response) => {
  try {
    const { type } = req.body;
    const job = await queueManagementService.enqueue(type);
    res.status(201).json(job);
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
export default router;
