import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { distributedTracingService } from '../services/distributed-tracing.service';

const router = Router();

router.post('/spans', requireAuth, async (req: Request, res: Response) => {
  try {
    const { traceId, operationName, serviceName, parentSpanId } = req.body;
    const span = await distributedTracingService.createSpan(
      traceId,
      operationName,
      serviceName,
      parentSpanId
    );
    res.json(span);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/spans/:spanId/complete', requireAuth, async (req: Request, res: Response) => {
  try {
    const { spanId } = req.params;
    const { status, errorMessage } = req.body;
    const span = await distributedTracingService.completeSpan(
      spanId,
      status,
      errorMessage
    );
    res.json(span);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/spans/:spanId/logs', requireAuth, async (req: Request, res: Response) => {
  try {
    const { spanId } = req.params;
    const { message, level, fields } = req.body;
    const log = await distributedTracingService.addSpanLog(
      spanId,
      message,
      level,
      fields
    );
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/traces', requireAuth, async (req: Request, res: Response) => {
  try {
    const { traceId, operationName } = req.body;
    const trace = await distributedTracingService.createTrace(
      traceId,
      operationName
    );
    res.json(trace);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/traces/:traceId/complete', requireAuth, async (req: Request, res: Response) => {
  try {
    const { traceId } = req.params;
    const { status } = req.body;
    const trace = await distributedTracingService.completeTrace(
      traceId,
      status
    );
    res.json(trace);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/sampling', requireAuth, async (req: Request, res: Response) => {
  try {
    const { serviceName, samplingRate, strategy, maxTracesPerSecond } = req.body;
    const sampling = await distributedTracingService.setSampling(
      serviceName,
      samplingRate,
      strategy,
      maxTracesPerSecond
    );
    res.json(sampling);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/traces/:traceId/analyze', requireAuth, async (req: Request, res: Response) => {
  try {
    const { traceId } = req.params;
    const analysis = await distributedTracingService.analyzeTrace(traceId);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
