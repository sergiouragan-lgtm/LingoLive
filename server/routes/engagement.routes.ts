import express from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { engagementService } from '../services/engagement.service';

const router = express.Router();

/**
 * @swagger
 * /api/engagement/metrics:
 *   get:
 *     summary: Get user engagement metrics
 *     tags:
 *       - Engagement
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Engagement metrics
 */
router.get('/metrics', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  const metrics = await engagementService.updateEngagementMetrics(userId);
  res.json(metrics);
});

/**
 * @swagger
 * /api/engagement/cohort/{cohortId}:
 *   get:
 *     summary: Get cohort analysis
 *     tags:
 *       - Engagement
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cohort analysis
 */
router.get('/cohort/:cohortId', requireAuth, async (req: any, res) => {
  const { cohortId } = req.params;
  const cohort = await engagementService.getCohortAnalysis(cohortId);
  
  if (!cohort) {
    return res.status(404).json({ error: 'Cohort not found' });
  }
  
  res.json(cohort);
});

/**
 * @swagger
 * /api/engagement/retention:
 *   get:
 *     summary: Get platform retention metrics
 *     tags:
 *       - Engagement
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Retention metrics
 */
router.get('/retention', requireAuth, async (req: any, res) => {
  const metrics = await engagementService.getRetentionMetrics();
  res.json(metrics);
});

/**
 * @swagger
 * /api/engagement/create-cohort:
 *   post:
 *     summary: Create new cohort
 *     tags:
 *       - Engagement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cohortDate:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cohort created
 */
router.post('/create-cohort', requireAuth, async (req: any, res) => {
  const { cohortDate } = req.body;
  
  if (!cohortDate) {
    return res.status(400).json({ error: 'cohortDate required' });
  }
  
  const cohortId = await engagementService.createCohort(new Date(cohortDate));
  res.status(201).json({ cohortId });
});

export default router;
