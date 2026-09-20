import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { emailService } from '../services/email.service';

const router = Router();

router.post('/send', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { to, templateName, templateData } = req.body;
    if (!to || !templateName) {
      return res.status(400).json({ error: 'to and templateName required' });
    }

    const result = await emailService.sendEmail({
      to,
      templateName,
      templateData: templateData || {},
    });

    res.json({
      success: true,
      message: result ? 'Email sent' : 'Email failed',
      sent: result,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/batch', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { emails } = req.body;
    if (!Array.isArray(emails)) {
      return res.status(400).json({ error: 'emails must be an array' });
    }

    const result = await emailService.sendBatch(emails);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/logs', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = Math.min(Number(req.query.limit) || 100, 1000);
    const logs = emailService.getDeliveryLogs(limit);

    res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = emailService.getDeliveryStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
