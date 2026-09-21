import { Router, Request, Response } from 'express';
import { errorHandlingRecoveryService } from '../services/error-handling-recovery.service';
const router = Router();
router.post('/logs/create', async (req: Request, res: Response) => {
  try { const { severity, message, stack } = req.body; const log = await errorHandlingRecoveryService.logError(severity, message, stack); res.status(201).json(log); }
  catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
router.post('/strategies/create', async (req: Request, res: Response) => {
  try { const { errorType, retryCount, backoffMs } = req.body; const strategy = await errorHandlingRecoveryService.createRecoveryStrategy(errorType, retryCount, backoffMs); res.status(201).json(strategy); }
  catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
router.get('/metrics', async (req: Request, res: Response) => {
  try { const metrics = await errorHandlingRecoveryService.getMetrics(); res.status(200).json(metrics); }
  catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
export default router;
