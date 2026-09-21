import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { notificationsService, NotificationType, NotificationPayload } from '../services/notifications.service';

const router = Router();

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get user notifications
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 */
router.get('/', requireAuth, async (req: any, res) => {
  try {
    const { limit, unreadOnly } = req.query;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notifications = await notificationsService.getNotifications(
      userId,
      Math.min(Number(limit) || 50, 100),
      unreadOnly === 'true'
    );

    res.json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * @swagger
 * /notifications/{notificationId}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 */
router.put('/:notificationId/read', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    const { notificationId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await notificationsService.markAsRead(userId, notificationId);

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

/**
 * @swagger
 * /notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 */
router.put('/read-all', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const count = await notificationsService.markAllAsRead(userId);

    res.json({
      success: true,
      message: `Marked ${count} notifications as read`,
      count,
    });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

/**
 * @swagger
 * /notifications/{notificationId}:
 *   delete:
 *     summary: Delete notification
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:notificationId', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    const { notificationId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await notificationsService.deleteNotification(userId, notificationId);

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

/**
 * @swagger
 * /notifications/delete-all:
 *   delete:
 *     summary: Delete all notifications
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 */
router.delete('/', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const count = await notificationsService.deleteAllNotifications(userId);

    res.json({
      success: true,
      message: `Deleted ${count} notifications`,
      count,
    });
  } catch (error: any) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ error: 'Failed to delete all notifications' });
  }
});

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 */
router.get('/unread-count', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const count = await notificationsService.getUnreadCount(userId);

    res.json({
      success: true,
      unreadCount: count,
    });
  } catch (error: any) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

/**
 * @swagger
 * /notifications/stats:
 *   get:
 *     summary: Get notification statistics
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = await notificationsService.getNotificationStats(userId);

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ error: 'Failed to fetch notification stats' });
  }
});

/**
 * @swagger
 * /notifications/cleanup:
 *   post:
 *     summary: Clean up old notifications
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               olderThanDays:
 *                 type: number
 *                 default: 30
 */
router.post('/cleanup', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    const { olderThanDays } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const count = await notificationsService.cleanupOldNotifications(
      userId,
      olderThanDays || 30
    );

    res.json({
      success: true,
      message: `Cleaned up ${count} old notifications`,
      count,
    });
  } catch (error: any) {
    console.error('Error cleaning up notifications:', error);
    res.status(500).json({ error: 'Failed to cleanup notifications' });
  }
});

export default router;
