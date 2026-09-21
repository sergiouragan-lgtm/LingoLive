import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { paymentService } from '../services/payment.service';

const router = Router();

router.get('/subscription', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const subscription = await paymentService.getSubscription(userId);
    res.json({ success: true, subscription });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/upgrade', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    const { tier } = req.body;
    if (!userId || !tier) return res.status(400).json({ error: 'Missing required fields' });

    const subscription = await paymentService.updateSubscription(userId, tier);
    res.json({ success: true, subscription });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/cancel', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await paymentService.cancelSubscription(userId);
    res.json({ success: true, message: 'Subscription cancelled' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/pricing', (req: any, res) => {
  try {
    const plans = paymentService.getAllPricingPlans();
    res.json({ success: true, plans });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/history', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const limit = Math.min(Number(req.query.limit) || 50, 500);
    const history = await paymentService.getPaymentHistory(userId, limit);
    res.json({ success: true, history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
