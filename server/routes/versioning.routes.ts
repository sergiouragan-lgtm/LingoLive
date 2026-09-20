import { Router, Request, Response } from 'express';
import { versioningService } from '../services/versioning.service';
const router = Router();
router.post('/create', async (req: Request, res: Response) => {
  try { const { service, version } = req.body; const v = await versioningService.createVersion(service, version); res.status(201).json(v); }
  catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
export default router;
