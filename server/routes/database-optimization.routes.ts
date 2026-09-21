import { Router, Request, Response } from 'express';
import { databaseOptimizationService } from '../services/database-optimization.service';
const router = Router();
router.post('/indexes/create', async (req: Request, res: Response) => {
  try { const { collection, fields } = req.body; const config = await databaseOptimizationService.createIndex(collection, fields); res.status(201).json(config); }
  catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
router.post('/queries/optimize', async (req: Request, res: Response) => {
  try { const { query } = req.body; const optimization = await databaseOptimizationService.optimizeQuery(query); res.status(201).json(optimization); }
  catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
router.get('/metrics', async (req: Request, res: Response) => {
  try { const metrics = await databaseOptimizationService.getMetrics(); res.status(200).json(metrics); }
  catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
export default router;
