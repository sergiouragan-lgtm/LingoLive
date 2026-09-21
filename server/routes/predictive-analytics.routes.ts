import express from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { predictiveAnalyticsService } from '../services/predictive-analytics.service';

const router = express.Router();

/**
 * @swagger
 * /api/predictive-analytics/churn/{userId}:
 *   get:
 *     summary: Predict user churn risk
 *     tags:
 *       - Predictive Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Churn prediction
 */
router.get('/churn/:userId', requireAuth, async (req: any, res) => {
  const { userId } = req.params;
  
  const prediction = await predictiveAnalyticsService.predictChurnRisk(userId);
  res.json(prediction);
});

/**
 * @swagger
 * /api/predictive-analytics/ltv/{userId}:
 *   get:
 *     summary: Estimate user lifetime value
 *     tags:
 *       - Predictive Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: LTV estimation
 */
router.get('/ltv/:userId', requireAuth, async (req: any, res) => {
  const { userId } = req.params;
  
  const ltv = await predictiveAnalyticsService.estimateLTV(userId);
  res.json(ltv);
});

/**
 * @swagger
 * /api/predictive-analytics/accuracy:
 *   post:
 *     summary: Track prediction accuracy
 *     tags:
 *       - Predictive Analytics
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               predictionId:
 *                 type: string
 *               churnActual:
 *                 type: boolean
 *               churnPredicted:
 *                 type: boolean
 *               riskScorePredicted:
 *                 type: number
 *     responses:
 *       200:
 *         description: Accuracy tracked
 */
router.post('/accuracy', requireAuth, async (req: any, res) => {
  const { predictionId, churnActual, churnPredicted, riskScorePredicted } =
    req.body;

  if (
    predictionId === undefined ||
    churnActual === undefined ||
    churnPredicted === undefined ||
    riskScorePredicted === undefined
  ) {
    return res.status(400).json({
      error: 'predictionId, churnActual, churnPredicted, riskScorePredicted required',
    });
  }

  await predictiveAnalyticsService.trackPredictionAccuracy(
    predictionId,
    churnActual,
    churnPredicted,
    riskScorePredicted
  );

  res.json({ success: true });
});

/**
 * @swagger
 * /api/predictive-analytics/model-performance:
 *   get:
 *     summary: Get predictive model performance
 *     tags:
 *       - Predictive Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Model performance metrics
 */
router.get('/model-performance', requireAuth, async (req: any, res) => {
  const performance = await predictiveAnalyticsService.getModelPerformance();
  res.json(performance);
});

export default router;
