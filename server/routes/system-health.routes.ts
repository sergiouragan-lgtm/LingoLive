import express from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { systemHealthService } from '../services/system-health.service';

const router = express.Router();

/**
 * @swagger
 * /api/system-health/status:
 *   get:
 *     summary: Get system health status
 *     tags:
 *       - System Health
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current system health
 */
router.get('/status', requireAuth, async (req: any, res) => {
  const health = await systemHealthService.getSystemHealth();
  res.json(health);
});

/**
 * @swagger
 * /api/system-health/performance:
 *   get:
 *     summary: Get performance metrics
 *     tags:
 *       - System Health
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: hours
 *         in: query
 *         type: number
 *     responses:
 *       200:
 *         description: Performance metrics
 */
router.get('/performance', requireAuth, async (req: any, res) => {
  const { hours = 24 } = req.query;

  const metrics = await systemHealthService.getPerformanceMetrics(parseInt(hours));
  res.json(metrics);
});

/**
 * @swagger
 * /api/system-health/errors:
 *   get:
 *     summary: Get error logs
 *     tags:
 *       - System Health
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         type: number
 *       - name: severity
 *         in: query
 *         type: string
 *     responses:
 *       200:
 *         description: Error logs
 */
router.get('/errors', requireAuth, async (req: any, res) => {
  const { limit = 100, severity } = req.query;

  const errors = await systemHealthService.getErrorLogs(parseInt(limit), severity);
  res.json(errors);
});

/**
 * @swagger
 * /api/system-health/errors/{errorId}/resolve:
 *   post:
 *     summary: Mark error as resolved
 *     tags:
 *       - System Health
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: errorId
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Error marked resolved
 */
router.post('/errors/:errorId/resolve', requireAuth, async (req: any, res) => {
  const { errorId } = req.params;

  await systemHealthService.markErrorResolved(errorId);
  res.json({ success: true });
});

/**
 * @swagger
 * /api/system-health/upstream-services:
 *   get:
 *     summary: Get upstream service status
 *     tags:
 *       - System Health
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upstream service status
 */
router.get('/upstream-services', requireAuth, async (req: any, res) => {
  const services = await systemHealthService.getUpstreamServiceStatus();
  res.json(services);
});

export default router;
