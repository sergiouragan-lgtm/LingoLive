import { Router, Request, Response } from 'express';
import { backupService } from '../services/backup-service.service';
const router = Router();
router.post('/create', async (req: Request, res: Response) => {
  try { const backup = await backupService.createBackup(); res.status(201).json(backup); }
  catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
export default router;
