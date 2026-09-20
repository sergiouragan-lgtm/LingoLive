import express from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { insightsService } from '../services/insights.service';

const router = express.Router();

/**
 * @swagger
 * /api/insights/generate:
 *   post:
 *     summary: Generate user insights
 *     tags:
 *       - Insights
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Insights generated
 */
router.post('/generate', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  const insights = await insightsService.generateInsights(userId);
  res.json(insights);
});

/**
 * @swagger
 * /api/insights/dashboard:
 *   get:
 *     summary: Get dashboard snapshot
 *     tags:
 *       - Insights
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard snapshot
 */
router.get('/dashboard', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  const snapshot = await insightsService.generateDashboardSnapshot(userId);
  res.json(snapshot);
});

/**
 * @swagger
 * /api/insights/metrics:
 *   get:
 *     summary: Get dashboard metrics
 *     tags:
 *       - Insights
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics
 */
router.get('/metrics', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  const metrics = await insightsService.getDashboardMetrics(userId);
  res.json(metrics);
});

/**
 * @swagger
 * /api/insights/personalized:
 *   get:
 *     summary: Get personalized recommendations
 *     tags:
 *       - Insights
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         type: number
 *     responses:
 *       200:
 *         description: Personalized recommendations
 */
router.get('/personalized', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  const { limit = 5 } = req.query;
  
  const recommendations = await insightsService.getPersonalizedRecommendations(
    userId,
    parseInt(limit as string)
  );
  res.json(recommendations);
});

export default router;
