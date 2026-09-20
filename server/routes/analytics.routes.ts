import express from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { analyticsService } from '../services/analytics.service';
import crypto from 'crypto';

const router = express.Router();

/**
 * @swagger
 * /api/analytics/track-event:
 *   post:
 *     summary: Track user event
 *     tags:
 *       - Analytics
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
 *               metadata:
 *                 type: object
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Event tracked
 */
router.post('/track-event', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  const { eventType, metadata = {}, sessionId = crypto.randomUUID() } = req.body;

  if (!eventType) {
    return res.status(400).json({ error: 'eventType required' });
  }

  await analyticsService.trackEvent(userId, eventType, metadata, sessionId);
  res.json({ success: true });
});

/**
 * @swagger
 * /api/analytics/history:
 *   get:
 *     summary: Get user event history
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         type: number
 *       - name: eventType
 *         in: query
 *         type: string
 *     responses:
 *       200:
 *         description: Event history
 */
router.get('/history', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  const { limit = 100, eventType } = req.query;

  const history = await analyticsService.getEventHistory(
    userId,
    parseInt(limit as string),
    eventType
  );
  res.json(history);
});

/**
 * @swagger
 * /api/analytics/timeline:
 *   get:
 *     summary: Get user event timeline
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: days
 *         in: query
 *         type: number
 *     responses:
 *       200:
 *         description: Event timeline by day
 */
router.get('/timeline', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  const { days = 30 } = req.query;

  const timeline = await analyticsService.getUserEventTimeline(
    userId,
    parseInt(days as string)
  );
  res.json(timeline);
});

/**
 * @swagger
 * /api/analytics/stats:
 *   get:
 *     summary: Get platform event statistics
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: timeWindow
 *         in: query
 *         type: number
 *     responses:
 *       200:
 *         description: Event statistics
 */
router.get('/stats', requireAuth, async (req: any, res) => {
  const { timeWindow = 7 } = req.query;

  const stats = await analyticsService.getEventStats(
    parseInt(timeWindow as string)
  );
  res.json(stats);
});

/**
 * @swagger
 * /api/analytics/flush:
 *   post:
 *     summary: Flush event buffer to storage
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Buffer flushed
 */
router.post('/flush', requireAuth, async (req: any, res) => {
  await analyticsService.ensureFlushed();
  res.json({ success: true, message: 'Event buffer flushed' });
});

export default router;
