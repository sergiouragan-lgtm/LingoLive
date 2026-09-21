import express from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { cacheService } from '../services/cache.service';

const router = express.Router();

/**
 * @swagger
 * /api/cache/get:
 *   post:
 *     summary: Get value from cache
 *     tags:
 *       - Cache
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cached value
 */
router.post('/get', requireAuth, async (req: any, res) => {
  const { key } = req.body;

  if (!key) {
    return res.status(400).json({ error: 'key required' });
  }

  const value = await cacheService.get(key);
  res.json({ key, value, found: value !== null });
});

/**
 * @swagger
 * /api/cache/set:
 *   post:
 *     summary: Set value in cache
 *     tags:
 *       - Cache
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: object
 *               ttl:
 *                 type: number
 *               tags:
 *                 type: array
 *     responses:
 *       200:
 *         description: Value cached
 */
router.post('/set', requireAuth, async (req: any, res) => {
  const { key, value, ttl = 300, tags = [] } = req.body;

  if (!key || value === undefined) {
    return res.status(400).json({ error: 'key and value required' });
  }

  await cacheService.set(key, value, ttl, tags);
  res.json({ success: true, key, ttl });
});

/**
 * @swagger
 * /api/cache/delete:
 *   post:
 *     summary: Delete value from cache
 *     tags:
 *       - Cache
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *     responses:
 *       200:
 *         description: Value deleted
 */
router.post('/delete', requireAuth, async (req: any, res) => {
  const { key } = req.body;

  if (!key) {
    return res.status(400).json({ error: 'key required' });
  }

  await cacheService.delete(key);
  res.json({ success: true, key });
});

/**
 * @swagger
 * /api/cache/invalidate-tag:
 *   post:
 *     summary: Invalidate all cache entries by tag
 *     tags:
 *       - Cache
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tag:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cache invalidated
 */
router.post('/invalidate-tag', requireAuth, async (req: any, res) => {
  const { tag } = req.body;

  if (!tag) {
    return res.status(400).json({ error: 'tag required' });
  }

  const count = await cacheService.invalidateByTag(tag);
  res.json({ success: true, tag, invalidatedCount: count });
});

/**
 * @swagger
 * /api/cache/clear:
 *   post:
 *     summary: Clear entire cache
 *     tags:
 *       - Cache
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache cleared
 */
router.post('/clear', requireAuth, async (req: any, res) => {
  await cacheService.clear();
  res.json({ success: true });
});

/**
 * @swagger
 * /api/cache/stats:
 *   get:
 *     summary: Get cache statistics
 *     tags:
 *       - Cache
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache stats
 */
router.get('/stats', requireAuth, async (req: any, res) => {
  const stats = cacheService.getStats();
  res.json(stats);
});

export default router;
