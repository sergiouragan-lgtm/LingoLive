import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { twoFAService } from '../services/twofa.service';

const router = Router();

router.post('/setup', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { secret, qrCode, backupCodes } = await twoFAService.generateSecret(userId, req.user?.email);
    res.json({ success: true, secret, qrCode, backupCodes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/verify', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    const { code, token } = req.body;
    if (!userId || !code || !token) return res.status(400).json({ error: 'Missing required fields' });

    const isValid = await twoFAService.verifyToken(userId, code);
    res.json({ success: true, valid: isValid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/enable', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    const { secret, verificationCode, backupCodes } = req.body;
    if (!userId || !secret || !verificationCode) return res.status(400).json({ error: 'Missing required fields' });

    await twoFAService.enableTwoFA(userId, secret, verificationCode, backupCodes);
    res.json({ success: true, message: '2FA enabled' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/disable', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await twoFAService.disableTwoFA(userId);
    res.json({ success: true, message: '2FA disabled' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/status', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const enabled = await twoFAService.isTwoFAEnabled(userId);
    res.json({ success: true, enabled });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
