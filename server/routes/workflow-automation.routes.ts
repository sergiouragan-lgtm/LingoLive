import { Router, Request, Response } from 'express';
import { workflowAutomationService } from '../services/workflow-automation.service';

const router = Router();

router.post('/workflows/define', async (req: Request, res: Response) => {
  try {
    const { name, description, steps, triggers, createdBy } = req.body;
    const workflow = await workflowAutomationService.defineWorkflow(
      name,
      description,
      steps,
      triggers,
      createdBy
    );
    res.status(201).json(workflow);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/workflows/execute', async (req: Request, res: Response) => {
  try {
    const { workflowId, context } = req.body;
    const execution = await workflowAutomationService.executeWorkflow(workflowId, context);
    res.status(201).json(execution);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/queues/create', async (req: Request, res: Response) => {
  try {
    const { name, priority, processingRate } = req.body;
    const queue = await workflowAutomationService.createTaskQueue(name, priority, processingRate);
    res.status(201).json(queue);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/tasks/enqueue', async (req: Request, res: Response) => {
  try {
    const { queueId, workflowId, priority } = req.body;
    const task = await workflowAutomationService.enqueueTask(queueId, workflowId, priority);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/workflows/:workflowId/pause', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const workflow = await workflowAutomationService.pauseWorkflow(workflowId);
    res.status(200).json(workflow);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const metrics = await workflowAutomationService.getWorkflowMetrics({ start: startDate, end: endDate });
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
