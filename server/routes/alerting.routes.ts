import { Router, Request, Response } from 'express';
import { alertingService } from '../services/alerting.service';
const router = Router();
router.post('/trigger', async (req: Request, res: Response) => {
  try { const { type, severity, message } = req.body; const a = await alertingService.triggerAlert(type, severity, message); res.status(201).json(a); }
  catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
export default router;
