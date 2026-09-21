import express from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { adminService } from '../services/admin.service';

const router = express.Router();

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Create admin user
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin user created
 */
router.post('/users', requireAuth, async (req: any, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'email, password, and role required' });
  }

  const adminUser = await adminService.createAdminUser(email, password, role);
  res.json(adminUser);
});

/**
 * @swagger
 * /api/admin/users/{userId}/suspend:
 *   post:
 *     summary: Suspend user account
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: User suspended
 */
router.post('/users/:userId/suspend', requireAuth, async (req: any, res) => {
  const { userId } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'reason required' });
  }

  await adminService.suspendUser(userId, reason);
  res.json({ success: true });
});

/**
 * @swagger
 * /api/admin/users/{userId}/reactivate:
 *   post:
 *     summary: Reactivate user account
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: User reactivated
 */
router.post('/users/:userId/reactivate', requireAuth, async (req: any, res) => {
  const { userId } = req.params;
  await adminService.reactivateUser(userId);
  res.json({ success: true });
});

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   delete:
 *     summary: Delete user account
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete('/users/:userId', requireAuth, async (req: any, res) => {
  const { userId } = req.params;
  await adminService.deleteUser(userId);
  res.json({ success: true });
});

/**
 * @swagger
 * /api/admin/users/{userId}/role:
 *   put:
 *     summary: Update user role
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role updated
 */
router.put('/users/:userId/role', requireAuth, async (req: any, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ error: 'role required' });
  }

  await adminService.updateUserRole(userId, role);
  res.json({ success: true });
});

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List users
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         type: number
 *       - name: offset
 *         in: query
 *         type: number
 *     responses:
 *       200:
 *         description: User list
 */
router.get('/users', requireAuth, async (req: any, res) => {
  const { limit = 100, offset = 0 } = req.query;
  const users = await adminService.listUsers(parseInt(limit), parseInt(offset));
  res.json(users);
});

/**
 * @swagger
 * /api/admin/users/search:
 *   get:
 *     summary: Search users
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: q
 *         in: query
 *         type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/users/search', requireAuth, async (req: any, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'q parameter required' });
  }

  const results = await adminService.searchUsers(q as string);
  res.json(results);
});

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get user statistics
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 */
router.get('/stats', requireAuth, async (req: any, res) => {
  const stats = await adminService.getUserStats();
  res.json(stats);
});

/**
 * @swagger
 * /api/admin/activity-log:
 *   get:
 *     summary: Get admin activity log
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         type: number
 *     responses:
 *       200:
 *         description: Activity log
 */
router.get('/activity-log', requireAuth, async (req: any, res) => {
  const { limit = 100 } = req.query;
  const log = await adminService.getAdminActivityLog(parseInt(limit));
  res.json(log);
});

export default router;
