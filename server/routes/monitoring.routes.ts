import { Router, Request, Response } from 'express';
import { monitoringService } from '../services/monitoring.service';
const router = Router();
router.post('/create', async (req: Request, res: Response) => {
  try { const { name, interval } = req.body; const m = await monitoringService.createMonitor(name, interval); res.status(201).json(m); }
  catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
export default router;
