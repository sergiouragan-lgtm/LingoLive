import { Router, Request, Response } from 'express';
import { cacheManagementService } from '../services/cache-management.service';
const router = Router();
router.post('/entries/set', async (req: Request, res: Response) => {
  try {
    const { key, value, ttl } = req.body;
    const entry = await cacheManagementService.set(key, value, ttl);
    res.status(201).json(entry);
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
export default router;
