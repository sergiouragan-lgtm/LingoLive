import { Router, Request, Response } from 'express';
import { workflowEngineService } from '../services/workflow-engine.service';
const router = Router();
router.post('/workflows/create', async (req: Request, res: Response) => {
  try {
    const { name, steps } = req.body;
    const wf = await workflowEngineService.createWorkflow(name, steps);
    res.status(201).json(wf);
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});
export default router;
