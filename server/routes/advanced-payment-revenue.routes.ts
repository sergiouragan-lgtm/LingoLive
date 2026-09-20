import { Router, Request, Response } from 'express';
import { advancedPaymentRevenueService } from '../services/advanced-payment-revenue.service';

const router = Router();

router.post('/streams/create', async (req: Request, res: Response) => {
  try {
    const { name, type, amount, frequency } = req.body;
    const stream = await advancedPaymentRevenueService.createRevenueStream(
      name,
      type,
      amount,
      frequency
    );
    res.status(201).json(stream);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/plans/define', async (req: Request, res: Response) => {
  try {
    const { name, tier, price, currency, billingCycle, features, maxUsers } = req.body;
    const plan = await advancedPaymentRevenueService.defineSubscriptionPlan(
      name,
      tier,
      price,
      currency,
      billingCycle,
      features,
      maxUsers
    );
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/churn/predict', async (req: Request, res: Response) => {
  try {
    const { userId, riskScore, riskFactors } = req.body;
    const prediction = await advancedPaymentRevenueService.predictChurn(
      userId,
      riskScore,
      riskFactors
    );
    res.status(201).json(prediction);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/retention/campaigns', async (req: Request, res: Response) => {
  try {
    const { name, targetSegment, strategy, budget, startDate, endDate, expectedROI } = req.body;
    const campaign = await advancedPaymentRevenueService.createRetentionCampaign(
      name,
      targetSegment,
      strategy,
      budget,
      new Date(startDate),
      new Date(endDate),
      expectedROI
    );
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/forecast/generate', async (req: Request, res: Response) => {
  try {
    const { period, projectedRevenue, projectedExpenses, growthRate, assumptions } = req.body;
    const forecast = await advancedPaymentRevenueService.generateFinancialForecast(
      period,
      projectedRevenue,
      projectedExpenses,
      growthRate,
      assumptions
    );
    res.status(201).json(forecast);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/invoices/create', async (req: Request, res: Response) => {
  try {
    const { customerId, amount, items, dueDate } = req.body;
    const invoice = await advancedPaymentRevenueService.createInvoice(
      customerId,
      amount,
      items,
      new Date(dueDate)
    );
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const analytics = await advancedPaymentRevenueService.getRevenueAnalytics({ start: startDate, end: endDate });
    res.status(200).json(analytics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
