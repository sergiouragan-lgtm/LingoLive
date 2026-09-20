import { Router, Request, Response } from 'express';
import { batchProcessingService } from '../services/batch-processing.service';
const router = Router();
router.post('/batches/submit', async (req: Request, res: Response) => {
  try {
    const { type, itemCount } = req.body;
    const job = await batchProcessingService.submitBatch(type, itemCount);
    res.status(201).json(job);
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
export default router;
