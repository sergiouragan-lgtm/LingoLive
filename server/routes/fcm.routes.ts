import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { fcmService } from '../services/fcm.service';

const router = Router();

router.post('/register-token', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    const { token, platform } = req.body;
    if (!userId || !token || !platform) return res.status(400).json({ error: 'Missing required fields' });

    await fcmService.registerToken(userId, token, platform);
    res.json({ success: true, message: 'Token registered' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/unregister-token', requireAuth, async (req: any, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });

    await fcmService.unregisterToken(token);
    res.json({ success: true, message: 'Token unregistered' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/subscribe-topic', requireAuth, async (req: any, res) => {
  try {
    const { token, topic } = req.body;
    if (!token || !topic) return res.status(400).json({ error: 'Token and topic required' });

    await fcmService.subscribeToTopic(token, topic);
    res.json({ success: true, message: 'Subscribed to topic' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/unsubscribe-topic', requireAuth, async (req: any, res) => {
  try {
    const { token, topic } = req.body;
    if (!token || !topic) return res.status(400).json({ error: 'Token and topic required' });

    await fcmService.unsubscribeFromTopic(token, topic);
    res.json({ success: true, message: 'Unsubscribed from topic' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
