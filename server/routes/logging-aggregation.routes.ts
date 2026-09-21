import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { loggingAggregationService } from '../services/logging-aggregation.service';

const router = Router();

router.post('/entries', requireAuth, async (req: Request, res: Response) => {
  try {
    const { level, message, service, context, userId, sessionId, traceId, duration } = req.body;
    const entry = await loggingAggregationService.createLogEntry(
      level,
      message,
      service,
      context,
      userId,
      sessionId,
      traceId,
      duration
    );
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/search', requireAuth, async (req: Request, res: Response) => {
  try {
    const { query, filters, limit } = req.body;
    const result = await loggingAggregationService.searchLogs(
      query,
      filters,
      limit || 100
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/indexes', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, fields } = req.body;
    const index = await loggingAggregationService.createLogIndex(name, fields);
    res.json(index);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/retention-policies', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, retentionDays, level, deleteAfterDays, archiveAfterDays } = req.body;
    const policy = await loggingAggregationService.defineRetentionPolicy(
      name,
      retentionDays,
      level,
      deleteAfterDays,
      archiveAfterDays
    );
    res.json(policy);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/aggregations', requireAuth, async (req: Request, res: Response) => {
  try {
    const { startTime, endTime } = req.body;
    const aggregation = await loggingAggregationService.aggregateLogs(
      new Date(startTime),
      new Date(endTime)
    );
    res.json(aggregation);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
