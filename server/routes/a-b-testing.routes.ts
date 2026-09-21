import { Router, Request, Response } from 'express';
import { abTestingService } from '../services/a-b-testing.service';
const router = Router();
router.post('/tests/create', async (req: Request, res: Response) => {
  try {
    const { name, control, variant, splitPercentage } = req.body;
    const test = await abTestingService.createTest(name, control, variant, splitPercentage);
    res.status(201).json(test);
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
router.get('/results/:testId', async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;
    const result = await abTestingService.getResult(testId);
    res.status(200).json(result);
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
export default router;
