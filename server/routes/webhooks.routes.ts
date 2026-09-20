import express from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { webhooksService, WebhookEvent } from '../services/webhooks.service';
import crypto from 'crypto';

const router = express.Router();

/**
 * @swagger
 * /api/webhooks/endpoints:
 *   post:
 *     summary: Create webhook endpoint
 *     tags:
 *       - Webhooks
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               events:
 *                 type: array
 *     responses:
 *       201:
 *         description: Webhook endpoint created
 */
router.post('/endpoints', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  const { url, events } = req.body;

  if (!url || !events || events.length === 0) {
    return res.status(400).json({ error: 'url and events required' });
  }

  const endpoint = await webhooksService.createEndpoint(userId, url, events);
  res.status(201).json(endpoint);
});

/**
 * @swagger
 * /api/webhooks/endpoints:
 *   get:
 *     summary: Get user's webhook endpoints
 *     tags:
 *       - Webhooks
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of webhook endpoints
 */
router.get('/endpoints', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  const endpoints = await webhooksService.getUserEndpoints(userId);
  res.json(endpoints);
});

/**
 * @swagger
 * /api/webhooks/endpoints/{id}:
 *   patch:
 *     summary: Update webhook endpoint
 *     tags:
 *       - Webhooks
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Endpoint updated
 */
router.patch('/endpoints/:id', requireAuth, async (req: any, res) => {
  const { id } = req.params;
  const updates = req.body;

  await webhooksService.updateEndpoint(id, updates);
  res.json({ success: true });
});

/**
 * @swagger
 * /api/webhooks/endpoints/{id}:
 *   delete:
 *     summary: Delete webhook endpoint
 *     tags:
 *       - Webhooks
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Endpoint deleted
 */
router.delete('/endpoints/:id', requireAuth, async (req: any, res) => {
  const { id } = req.params;
  await webhooksService.deleteEndpoint(id);
  res.json({ success: true });
});

/**
 * @swagger
 * /api/webhooks/deliveries/{endpointId}:
 *   get:
 *     summary: Get webhook deliveries for endpoint
 *     tags:
 *       - Webhooks
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of deliveries
 */
router.get('/deliveries/:endpointId', requireAuth, async (req: any, res) => {
  const { endpointId } = req.params;
  const { limit = 100 } = req.query;

  const deliveries = await webhooksService.getDeliveries(endpointId, parseInt(limit as string));
  res.json(deliveries);
});

/**
 * @swagger
 * /api/webhooks/stats:
 *   get:
 *     summary: Get webhook statistics
 *     tags:
 *       - Webhooks
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Webhook stats
 */
router.get('/stats', requireAuth, async (req: any, res) => {
  const stats = await webhooksService.getStats();
  res.json(stats);
});

/**
 * @swagger
 * /api/webhooks/test:
 *   post:
 *     summary: Test webhook endpoint
 *     tags:
 *       - Webhooks
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               endpointId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Test payload sent
 */
router.post('/test', requireAuth, async (req: any, res) => {
  const { endpointId } = req.body;

  if (!endpointId) {
    return res.status(400).json({ error: 'endpointId required' });
  }

  const testEvent: WebhookEvent = 'user.created';
  const payloadId = crypto.randomUUID();

  // Simulate webhook dispatch
  await webhooksService.dispatchEvent({
    event: testEvent,
    data: { test: true, timestamp: new Date() },
    timestamp: new Date(),
    id: payloadId,
  });

  res.json({ success: true, message: 'Test payload sent' });
});

export default router;
