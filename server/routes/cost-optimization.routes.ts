import { Router, Request, Response } from 'express';
import { costOptimizationService } from '../services/cost-optimization.service';

const router = Router();

router.post('/budgets/create', async (req: Request, res: Response) => {
  try {
    const { name, monthlyLimit, alertThreshold } = req.body;
    const budget = await costOptimizationService.createBudget(name, monthlyLimit, alertThreshold);
    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/usage/track', async (req: Request, res: Response) => {
  try {
    const { resourceType, quantity, costPerUnit } = req.body;
    const usage = await costOptimizationService.trackResourceUsage(resourceType, quantity, costPerUnit);
    res.status(201).json(usage);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/recommendations/generate', async (req: Request, res: Response) => {
  try {
    const { type, description, estimatedSavings } = req.body;
    const recommendation = await costOptimizationService.generateOptimizationRecommendation(type, description, estimatedSavings);
    res.status(201).json(recommendation);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await costOptimizationService.getCostMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
