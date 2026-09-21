import { Router, Request, Response } from 'express';
import { advancedBackupRecoveryService } from '../services/advanced-backup-recovery.service';
const router = Router();
router.post('/backups/create', async (req: Request, res: Response) => {
  try {
    const { name, frequency, retention } = req.body;
    const backup = await advancedBackupRecoveryService.createBackup(name, frequency, retention);
    res.status(201).json(backup);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});
export default router;
