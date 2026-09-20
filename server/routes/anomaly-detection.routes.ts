import express, { Request, Response } from 'express';
import { anomalyDetectionService } from '../services/anomaly-detection.service';
import { requireAuth } from '../middleware/requireAuth';

const router = express.Router();

router.post('/detect-engagement/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const anomaly = await anomalyDetectionService.detectEngagementAnomaly(userId);
    res.json(anomaly);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/detect-revenue', requireAuth, async (req: Request, res: Response) => {
  try {
    const anomaly = await anomalyDetectionService.detectRevenueAnomaly();
    res.json(anomaly);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/detect-errors', requireAuth, async (req: Request, res: Response) => {
  try {
    const anomaly = await anomalyDetectionService.detectErrorSpike();
    res.json(anomaly);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/rules', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, metric, threshold, operator, channels } = req.body;
    const rule = await anomalyDetectionService.createAlertRule(
      name,
      metric,
      threshold,
      operator,
      channels
    );
    res.status(201).json(rule);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/rules', requireAuth, async (req: Request, res: Response) => {
  try {
    const enabled = req.query.enabled === 'true' ? true : req.query.enabled === 'false' ? false : undefined;
    const rules = await anomalyDetectionService.getAlertRules(enabled);
    res.json(rules);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/alerts/:alertId/acknowledge', requireAuth, async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const userId = (req as any).userId;
    await anomalyDetectionService.acknowledgeAlert(alertId, userId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/anomalies', requireAuth, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const unresolved = req.query.unresolved !== 'false';
    const anomalies = await anomalyDetectionService.getAnomalies(limit, unresolved);
    res.json(anomalies);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/anomalies/:anomalyId/resolve', requireAuth, async (req: Request, res: Response) => {
  try {
    const { anomalyId } = req.params;
    await anomalyDetectionService.resolveAnomaly(anomalyId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
