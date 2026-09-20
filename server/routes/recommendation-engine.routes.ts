import { Router, Request, Response } from 'express';
import { recommendationEngineService } from '../services/recommendation-engine.service';
const router = Router();
router.get('/recommendations/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const recs = await recommendationEngineService.getRecommendations(userId);
    res.status(200).json(recs);
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
export default router;
