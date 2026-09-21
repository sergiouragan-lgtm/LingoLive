import { Router, Request, Response } from 'express';
import { personalizationEngineService } from '../services/personalization-engine.service';
const router = Router();
router.post('/profiles/create', async (req: Request, res: Response) => {
  try {
    const { userId, preferences } = req.body;
    const profile = await personalizationEngineService.createProfile(userId, preferences);
    res.status(201).json(profile);
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
export default router;
