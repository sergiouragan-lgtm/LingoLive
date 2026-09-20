import express from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { rateLimitService } from '../services/ratelimit.service';
import { paymentService } from '../services/payment.service';

const router = express.Router();

/**
 * @swagger
 * /api/rate-limit/check:
 *   post:
 *     summary: Check rate limit status for user
 *     tags:
 *       - Rate Limiting
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               endpoint:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rate limit status
 */
router.post('/check', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  const { endpoint } = req.body;

  if (!endpoint) {
    return res.status(400).json({ error: 'endpoint required' });
  }

  // Get user tier
  const subscription = await paymentService.getSubscription(userId);
  const tier = subscription?.tier || 'free';

  const status = await rateLimitService.checkLimit(userId, endpoint, tier as any);

  res.set('X-RateLimit-Limit', '100');
  res.set('X-RateLimit-Remaining', status.remaining.toString());
  res.set('X-RateLimit-Reset', new Date(status.resetAt).toISOString());

  res.json(status);
});

/**
 * @swagger
 * /api/rate-limit/status:
 *   get:
 *     summary: Get rate limit status for all endpoints
 *     tags:
 *       - Rate Limiting
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rate limit status for all endpoints
 */
router.get('/status', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  const subscription = await paymentService.getSubscription(userId);
  const tier = subscription?.tier || 'free';

  const statuses = await rateLimitService.getUserLimitStatus(userId, tier as any);

  res.json(statuses);
});

/**
 * @swagger
 * /api/rate-limit/reset:
 *   post:
 *     summary: Reset rate limit for endpoint
 *     tags:
 *       - Rate Limiting
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               endpoint:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rate limit reset
 */
router.post('/reset', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  const { endpoint } = req.body;

  if (!endpoint) {
    return res.status(400).json({ error: 'endpoint required' });
  }

  await rateLimitService.resetLimit(userId, endpoint);
  res.json({ success: true });
});

/**
 * @swagger
 * /api/rate-limit/stats:
 *   get:
 *     summary: Get global rate limit statistics
 *     tags:
 *       - Rate Limiting
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Global rate limit stats
 */
router.get('/stats', requireAuth, async (req: any, res) => {
  const stats = await rateLimitService.getGlobalStats();
  res.json(stats);
});

export default router;
