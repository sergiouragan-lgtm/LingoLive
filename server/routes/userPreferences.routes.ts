import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { userPreferencesService, NotificationChannel, NotificationFrequency } from '../services/userPreferences.service';

const router = Router();

/**
 * @swagger
 * /user-preferences:
 *   get:
 *     summary: Get user notification preferences
 *     tags:
 *       - User Preferences
 *     security:
 *       - bearerAuth: []
 */
router.get('/', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let preferences = await userPreferencesService.getPreferences(userId);

    if (!preferences) {
      preferences = await userPreferencesService.createDefaultPreferences(userId);
    }

    res.json({
      success: true,
      preferences,
    });
  } catch (error: any) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ error: 'Failed to fetch user preferences' });
  }
});

/**
 * @swagger
 * /user-preferences:
 *   put:
 *     summary: Update user notification preferences
 *     tags:
 *       - User Preferences
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inAppEnabled:
 *                 type: boolean
 *               pushEnabled:
 *                 type: boolean
 *               emailEnabled:
 *                 type: boolean
 *               quietHoursEnabled:
 *                 type: boolean
 *               quietHoursStart:
 *                 type: string
 *                 example: "22:00"
 *               quietHoursEnd:
 *                 type: string
 *                 example: "08:00"
 *               maxNotificationsPerDay:
 *                 type: number
 *               maxNotificationsPerHour:
 *                 type: number
 *               unsubscribeAll:
 *                 type: boolean
 *               doNotDisturb:
 *                 type: boolean
 */
router.put('/', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const preferences = await userPreferencesService.updatePreferences(userId, req.body);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences,
    });
  } catch (error: any) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

/**
 * @swagger
 * /user-preferences/notification-type/{type}:
 *   put:
 *     summary: Update preference for specific notification type
 *     tags:
 *       - User Preferences
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [search_alert, trending_topic, job_complete, job_failed, achievement, milestone, message, system_alert]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *               channels:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [in_app, push, email]
 *               frequency:
 *                 type: string
 *                 enum: [instant, hourly, daily, weekly, never]
 */
router.put('/notification-type/:type', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    const { type } = req.params;
    const { enabled, channels, frequency } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const preferences = await userPreferencesService.updateTypePreference(userId, type, {
      enabled,
      channels: channels || [],
      frequency: frequency || NotificationFrequency.INSTANT,
    });

    res.json({
      success: true,
      message: `${type} notification preference updated`,
      preferences,
    });
  } catch (error: any) {
    console.error('Error updating notification type preference:', error);
    res.status(500).json({ error: 'Failed to update notification type preference' });
  }
});

/**
 * @swagger
 * /user-preferences/channel/{channel}:
 *   put:
 *     summary: Enable/disable notification channel
 *     tags:
 *       - User Preferences
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channel
 *         required: true
 *         schema:
 *           type: string
 *           enum: [in_app, push, email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 */
router.put('/channel/:channel', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    const { channel } = req.params;
    const { enabled } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const channelEnum = (channel.toLowerCase().replace('-', '_')) as NotificationChannel;
    const preferences = await userPreferencesService.updateChannelPreference(
      userId,
      channelEnum,
      enabled
    );

    res.json({
      success: true,
      message: `${channel} notifications ${enabled ? 'enabled' : 'disabled'}`,
      preferences,
    });
  } catch (error: any) {
    console.error('Error updating channel preference:', error);
    res.status(500).json({ error: 'Failed to update channel preference' });
  }
});

/**
 * @swagger
 * /user-preferences/quiet-hours:
 *   post:
 *     summary: Set quiet hours (no notifications outside in-app)
 *     tags:
 *       - User Preferences
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - start
 *               - end
 *             properties:
 *               start:
 *                 type: string
 *                 example: "22:00"
 *               end:
 *                 type: string
 *                 example: "08:00"
 *               timezone:
 *                 type: string
 *                 default: "UTC"
 *               enabled:
 *                 type: boolean
 *                 default: true
 */
router.post('/quiet-hours', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    const { start, end, timezone, enabled } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!start || !end) {
      return res.status(400).json({ error: 'start and end times are required' });
    }

    const preferences = await userPreferencesService.setQuietHours(
      userId,
      start,
      end,
      timezone || 'UTC',
      enabled !== false
    );

    res.json({
      success: true,
      message: 'Quiet hours updated',
      preferences,
    });
  } catch (error: any) {
    console.error('Error setting quiet hours:', error);
    res.status(500).json({ error: 'Failed to set quiet hours' });
  }
});

/**
 * @swagger
 * /user-preferences/do-not-disturb:
 *   post:
 *     summary: Enable/disable do not disturb mode
 *     tags:
 *       - User Preferences
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enabled
 *             properties:
 *               enabled:
 *                 type: boolean
 */
router.post('/do-not-disturb', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    const { enabled } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const preferences = await userPreferencesService.setDoNotDisturb(userId, enabled);

    res.json({
      success: true,
      message: `Do not disturb ${enabled ? 'enabled' : 'disabled'}`,
      preferences,
    });
  } catch (error: any) {
    console.error('Error setting do not disturb:', error);
    res.status(500).json({ error: 'Failed to set do not disturb' });
  }
});

/**
 * @swagger
 * /user-preferences/delivery-history:
 *   get:
 *     summary: Get notification delivery history
 *     tags:
 *       - User Preferences
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 100
 */
router.get('/delivery-history', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    const limit = Math.min(Number(req.query.limit) || 100, 1000);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const history = await userPreferencesService.getDeliveryHistory(userId, limit);

    res.json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error: any) {
    console.error('Error fetching delivery history:', error);
    res.status(500).json({ error: 'Failed to fetch delivery history' });
  }
});

/**
 * @swagger
 * /user-preferences/stats:
 *   get:
 *     summary: Get notification statistics
 *     tags:
 *       - User Preferences
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = await userPreferencesService.getNotificationStats(userId);

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
 * /user-preferences/reset:
 *   post:
 *     summary: Reset preferences to default
 *     tags:
 *       - User Preferences
 *     security:
 *       - bearerAuth: []
 */
router.post('/reset', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const preferences = await userPreferencesService.createDefaultPreferences(userId);

    res.json({
      success: true,
      message: 'Preferences reset to default',
      preferences,
    });
  } catch (error: any) {
    console.error('Error resetting preferences:', error);
    res.status(500).json({ error: 'Failed to reset preferences' });
  }
});

export default router;
