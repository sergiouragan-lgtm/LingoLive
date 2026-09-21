import { Router, Request, Response } from 'express';
import { distributedTransactionManagementService } from '../services/distributed-transaction-management.service';

const router = Router();

router.post('/transactions/create', async (req: Request, res: Response) => {
  try {
    const { type, operations } = req.body;
    const transaction = await distributedTransactionManagementService.createTransaction(type, operations);
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/transactions/commit', async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.body;
    const transaction = await distributedTransactionManagementService.commitTransaction(transactionId);
    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/transactions/rollback', async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.body;
    const transaction = await distributedTransactionManagementService.rollbackTransaction(transactionId);
    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const metrics = await distributedTransactionManagementService.getTransactionMetrics({ start: startDate, end: endDate });
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
