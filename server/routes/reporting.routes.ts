import { Router, Request, Response } from 'express';
import { reportingService } from '../services/reporting.service';
const router = Router();
router.post('/generate', async (req: Request, res: Response) => {
  try { const { type } = req.body; const r = await reportingService.generateReport(type); res.status(201).json(r); }
  catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
export default router;
