import express, { Request, Response } from 'express';
import { mlModelsService } from '../services/ml-models.service';
import { requireAuth } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/engagement-prediction/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const prediction = await mlModelsService.predictEngagementTrend(userId);
    res.json(prediction);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/revenue-forecast', requireAuth, async (req: Request, res: Response) => {
  try {
    const months = parseInt(req.query.months as string) || 3;
    const forecasts = await mlModelsService.forecastRevenue(months);
    res.json(forecasts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/learning-outcome/:userId/:skillId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, skillId } = req.params;
    const prediction = await mlModelsService.predictLearningOutcome(userId, skillId);
    res.json(prediction);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/churn-probability/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const prediction = await mlModelsService.predictChurnProbabilityML(userId);
    res.json(prediction);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/model-performance', requireAuth, async (req: Request, res: Response) => {
  try {
    const metrics = await mlModelsService.getModelPerformanceMetrics();
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/retrain', requireAuth, async (req: Request, res: Response) => {
  try {
    await mlModelsService.retrainModels();
    res.json({ success: true, message: 'Models retraining initiated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
