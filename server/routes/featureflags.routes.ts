import express from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { featureFlagsService } from '../services/featureflags.service';
import { paymentService } from '../services/payment.service';

const router = express.Router();

/**
 * @swagger
 * /api/feature-flags/create:
 *   post:
 *     summary: Create feature flag
 *     tags:
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               variants:
 *                 type: array
 *     responses:
 *       201:
 *         description: Feature flag created
 */
router.post('/create', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  const { name, description, variants = [] } = req.body;

  if (!name || !description) {
    return res.status(400).json({ error: 'name and description required' });
  }

  const flag = await featureFlagsService.createFlag(name, description, variants, userId);
  res.status(201).json(flag);
});

/**
 * @swagger
 * /api/feature-flags/evaluate:
 *   post:
 *     summary: Evaluate feature flag for user
 *     tags:
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               flagId:
 *                 type: string
 *               region:
 *                 type: string
 *     responses:
 *       200:
 *         description: Flag evaluation result
 */
router.post('/evaluate', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  const { flagId, region = 'US' } = req.body;

  if (!flagId) {
    return res.status(400).json({ error: 'flagId required' });
  }

  // Get user tier
  const subscription = await paymentService.getSubscription(userId);
  const tier = subscription?.tier || 'free';

  const result = await featureFlagsService.evaluateFlag(userId, flagId, tier as any, region);
  res.json(result);
});

/**
 * @swagger
 * /api/feature-flags/stats:
 *   get:
 *     summary: Get feature flags statistics
 *     tags:
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Feature flag stats
 */
router.get('/stats', requireAuth, async (req: any, res) => {
  const stats = await featureFlagsService.getStats();
  res.json(stats);
});

/**
 * @swagger
 * /api/feature-flags/{flagId}/results:
 *   get:
 *     summary: Get experiment results
 *     tags:
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Experiment results
 */
router.get('/:flagId/results', requireAuth, async (req: any, res) => {
  const { flagId } = req.params;
  const { days = 7 } = req.query;

  const from = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);
  const to = new Date();

  const results = await featureFlagsService.getExperimentResults(flagId, from, to);
  res.json(results);
});

/**
 * @swagger
 * /api/feature-flags/{flagId}:
 *   get:
 *     summary: Get feature flag
 *     tags:
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Feature flag details
 */
router.get('/:flagId', requireAuth, async (req: any, res) => {
  const { flagId } = req.params;

  const flag = await featureFlagsService.getFlag(flagId);
  if (!flag) {
    return res.status(404).json({ error: 'Flag not found' });
  }

  res.json(flag);
});

/**
 * @swagger
 * /api/feature-flags/{flagId}:
 *   patch:
 *     summary: Update feature flag
 *     tags:
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Flag updated
 */
router.patch('/:flagId', requireAuth, async (req: any, res) => {
  const { flagId } = req.params;
  const updates = req.body;

  await featureFlagsService.updateFlag(flagId, updates);
  res.json({ success: true });
});

/**
 * @swagger
 * /api/feature-flags:
 *   get:
 *     summary: Get all feature flags
 *     tags:
 *       - Feature Flags
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of feature flags
 */
router.get('/', requireAuth, async (req: any, res) => {
  const flags = await featureFlagsService.getAllFlags();
  res.json(flags);
});

export default router;
