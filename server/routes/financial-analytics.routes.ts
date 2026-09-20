import express from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { financialAnalyticsService } from '../services/financial-analytics.service';

const router = express.Router();

/**
 * @swagger
 * /api/financial-analytics/revenue:
 *   get:
 *     summary: Get revenue metrics
 *     tags:
 *       - Financial Analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: month
 *         in: query
 *         type: string
 *     responses:
 *       200:
 *         description: Revenue metrics
 */
router.get('/revenue', requireAuth, async (req: any, res) => {
  const { month } = req.query;

  const metrics = await financialAnalyticsService.calculateRevenueMetrics(
    month ? new Date(month) : undefined
  );
  res.json(metrics);
});

/**
 * @swagger
 * /api/financial-analytics/cohort/{cohortMonth}:
 *   get:
 *     summary: Get cohort analysis
 *     tags:
 *       - Financial Analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: cohortMonth
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Cohort analysis
 */
router.get('/cohort/:cohortMonth', requireAuth, async (req: any, res) => {
  const { cohortMonth } = req.params;

  const analysis = await financialAnalyticsService.getCohortAnalysis(cohortMonth);
  res.json(analysis);
});

/**
 * @swagger
 * /api/financial-analytics/cac:
 *   get:
 *     summary: Get customer acquisition cost
 *     tags:
 *       - Financial Analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: month
 *         in: query
 *         type: string
 *     responses:
 *       200:
 *         description: CAC metrics
 */
router.get('/cac', requireAuth, async (req: any, res) => {
  const { month = new Date().toISOString() } = req.query;

  const cac = await financialAnalyticsService.calculateCustomerAcquisitionCost(new Date(month));
  res.json(cac);
});

/**
 * @swagger
 * /api/financial-analytics/subscriptions:
 *   get:
 *     summary: Get subscription analytics
 *     tags:
 *       - Financial Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription analytics
 */
router.get('/subscriptions', requireAuth, async (req: any, res) => {
  const analytics = await financialAnalyticsService.getSubscriptionAnalytics();
  res.json(analytics);
});

/**
 * @swagger
 * /api/financial-analytics/ltv:
 *   get:
 *     summary: Get lifetime value metrics
 *     tags:
 *       - Financial Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: LTV metrics
 */
router.get('/ltv', requireAuth, async (req: any, res) => {
  const metrics = await financialAnalyticsService.getLifetimeValueMetrics();
  res.json(metrics);
});

/**
 * @swagger
 * /api/financial-analytics/events:
 *   post:
 *     summary: Track financial event
 *     tags:
 *       - Financial Analytics
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventType:
 *                 type: string
 *               amount:
 *                 type: number
 *               details:
 *                 type: object
 *     responses:
 *       200:
 *         description: Financial event tracked
 */
router.post('/events', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  const { eventType, amount, details } = req.body;

  if (!eventType || !amount) {
    return res.status(400).json({ error: 'eventType and amount required' });
  }

  await financialAnalyticsService.trackFinancialEvent(
    eventType,
    userId,
    amount,
    details || {}
  );
  res.json({ success: true });
});

export default router;
