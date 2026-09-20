import { Router, Request, Response } from 'express';
import { customerSuccessSupportService } from '../services/customer-success-support.service';

const router = Router();

router.post('/tickets/create', async (req: Request, res: Response) => {
  try {
    const { title, description, customerId, priority, category } = req.body;
    const ticket = await customerSuccessSupportService.createSupportTicket(
      title,
      description,
      customerId,
      priority,
      category
    );
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/csm/assign', async (req: Request, res: Response) => {
  try {
    const { name, email, assignedAccounts, targetAccounts } = req.body;
    const manager = await customerSuccessSupportService.assignCustomerSuccessManager(
      name,
      email,
      assignedAccounts,
      targetAccounts
    );
    res.status(201).json(manager);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/health-score/calculate', async (req: Request, res: Response) => {
  try {
    const { customerId, engagementScore, satisfactionScore } = req.body;
    const score = await customerSuccessSupportService.calculateCustomerHealthScore(
      customerId,
      engagementScore,
      satisfactionScore
    );
    res.status(201).json(score);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/surveys/create', async (req: Request, res: Response) => {
  try {
    const { title, customerId, questions } = req.body;
    const survey = await customerSuccessSupportService.createFeedbackSurvey(
      title,
      customerId,
      questions
    );
    res.status(201).json(survey);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/knowledge/publish', async (req: Request, res: Response) => {
  try {
    const { title, content, category, tags } = req.body;
    const article = await customerSuccessSupportService.publishKnowledgeArticle(
      title,
      content,
      category,
      tags
    );
    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/plans/create', async (req: Request, res: Response) => {
  try {
    const { name, description, objectives, milestones, duration, targetOutcomes } = req.body;
    const plan = await customerSuccessSupportService.createSuccessPlan(
      name,
      description,
      objectives,
      milestones,
      duration,
      targetOutcomes
    );
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const metrics = await customerSuccessSupportService.getSuccessMetrics({ start: startDate, end: endDate });
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
