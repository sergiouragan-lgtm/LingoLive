import { Router, Request, Response } from 'express';
import { apiRateLimitingService } from '../services/api-rate-limiting.service';
const router = Router();
router.post('/rules/create', async (req: Request, res: Response) => {
  try { const { endpoint, requestsPerMinute, burst } = req.body; const rule = await apiRateLimitingService.createRateLimitRule(endpoint, requestsPerMinute, burst); res.status(201).json(rule); }
  catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
router.post('/violations/record', async (req: Request, res: Response) => {
  try { const { ruleId, clientId } = req.body; const violation = await apiRateLimitingService.recordViolation(ruleId, clientId); res.status(201).json(violation); }
  catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
router.get('/metrics', async (req: Request, res: Response) => {
  try { const metrics = await apiRateLimitingService.getMetrics(); res.status(200).json(metrics); }
  catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
export default router;
