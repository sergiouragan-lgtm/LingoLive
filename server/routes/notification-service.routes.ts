import { Router, Request, Response } from 'express';
import { notificationService } from '../services/notification-service.service';
const router = Router();
router.post('/send', async (req: Request, res: Response) => {
  try { const { userId, message } = req.body; const n = await notificationService.sendNotification(userId, message); res.status(201).json(n); }
  catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
export default router;
