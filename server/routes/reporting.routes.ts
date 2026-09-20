import express from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { reportingService } from '../services/reporting.service';

const router = express.Router();

/**
 * @swagger
 * /api/reporting/dashboard:
 *   get:
 *     summary: Get executive dashboard
 *     tags:
 *       - Reporting
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: startDate
 *         in: query
 *         type: string
 *       - name: endDate
 *         in: query
 *         type: string
 *     responses:
 *       200:
 *         description: Executive dashboard data
 */
router.get('/dashboard', requireAuth, async (req: any, res) => {
  const { startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate = new Date() } = req.query;

  const dashboard = await reportingService.generateExecutiveDashboard(
    new Date(startDate),
    new Date(endDate)
  );
  res.json(dashboard);
});

/**
 * @swagger
 * /api/reporting/engagement-trends:
 *   get:
 *     summary: Get engagement trends
 *     tags:
 *       - Reporting
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: days
 *         in: query
 *         type: number
 *     responses:
 *       200:
 *         description: Engagement trend data
 */
router.get('/engagement-trends', requireAuth, async (req: any, res) => {
  const { days = 30 } = req.query;
  const trends = await reportingService.getEngagementTrends(parseInt(days));
  res.json(trends);
});

/**
 * @swagger
 * /api/reporting/churn-analysis:
 *   get:
 *     summary: Get churn analysis
 *     tags:
 *       - Reporting
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: days
 *         in: query
 *         type: number
 *     responses:
 *       200:
 *         description: Churn analysis
 */
router.get('/churn-analysis', requireAuth, async (req: any, res) => {
  const { days = 30 } = req.query;
  const analysis = await reportingService.getChurnAnalysis(parseInt(days));
  res.json(analysis);
});

/**
 * @swagger
 * /api/reporting/cohort/{cohortId}:
 *   get:
 *     summary: Get cohort retention
 *     tags:
 *       - Reporting
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: cohortId
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Cohort retention data
 */
router.get('/cohort/:cohortId', requireAuth, async (req: any, res) => {
  const { cohortId } = req.params;
  const retention = await reportingService.getCohortRetention(cohortId);
  res.json(retention);
});

/**
 * @swagger
 * /api/reporting/custom-report:
 *   post:
 *     summary: Generate custom report
 *     tags:
 *       - Reporting
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reportType:
 *                 type: string
 *               filters:
 *                 type: object
 *     responses:
 *       200:
 *         description: Custom report generated
 */
router.post('/custom-report', requireAuth, async (req: any, res) => {
  const { reportType, filters } = req.body;

  if (!reportType) {
    return res.status(400).json({ error: 'reportType required' });
  }

  const report = await reportingService.generateCustomReport(reportType, filters || {});
  res.json(report);
});

export default router;
