import { Router } from 'express';
import { anomalyInterpretabilityService } from '../services/anomaly-interpretability.service';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/threshold', requireAuth, async (req, res) => {
  try {
    const { metric, lowerBound, upperBound, sensitivity, adaptive } = req.body;
    const threshold = await anomalyInterpretabilityService.setCustomThreshold(
      metric,
      lowerBound,
      upperBound,
      sensitivity,
      adaptive
    );
    res.json(threshold);
  } catch (error: any) {
    console.error('Error setting custom threshold:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/thresholds', requireAuth, async (req, res) => {
  try {
    const { metric } = req.query;
    const thresholds = await anomalyInterpretabilityService.getCustomThresholds(
      metric as string
    );
    res.json(thresholds);
  } catch (error: any) {
    console.error('Error fetching custom thresholds:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/explain/:anomalyId', requireAuth, async (req, res) => {
  try {
    const { anomalyId } = req.params;
    const explanation = await anomalyInterpretabilityService.explainAnomaly(anomalyId);
    res.json(explanation);
  } catch (error: any) {
    console.error('Error explaining anomaly:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/feature-importance/:anomalyId', requireAuth, async (req, res) => {
  try {
    const { anomalyId } = req.params;
    const importance = await anomalyInterpretabilityService.getFeatureImportance(anomalyId);
    res.json(importance);
  } catch (error: any) {
    console.error('Error calculating feature importance:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/interpretability-report', requireAuth, async (req, res) => {
  try {
    const { metric, startDate, endDate } = req.body;
    const report = await anomalyInterpretabilityService.generateInterpretabilityReport(
      metric,
      new Date(startDate),
      new Date(endDate)
    );
    res.json(report);
  } catch (error: any) {
    console.error('Error generating interpretability report:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/update-adaptive-threshold/:metric', requireAuth, async (req, res) => {
  try {
    const { metric } = req.params;
    const { lower, upper } = req.body;
    await anomalyInterpretabilityService.updateAdaptiveThreshold(metric, {
      lower,
      upper,
    });
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating adaptive threshold:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
