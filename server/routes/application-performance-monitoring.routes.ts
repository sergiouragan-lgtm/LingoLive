import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { applicationPerformanceMonitoringService } from '../services/application-performance-monitoring.service';

const router = Router();

router.post('/performance-metrics', requireAuth, async (req: Request, res: Response) => {
  try {
    const { endpoint, method, responseTime, statusCode, userId, sessionId } = req.body;
    const metric = await applicationPerformanceMonitoringService.recordPerformanceMetric(
      endpoint,
      method,
      responseTime,
      statusCode,
      userId,
      sessionId
    );
    res.json(metric);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/error-metrics', requireAuth, async (req: Request, res: Response) => {
  try {
    const { endpoint, errorType, statusCode, message, userId, stackTrace } = req.body;
    const error = await applicationPerformanceMonitoringService.recordErrorMetric(
      endpoint,
      errorType,
      statusCode,
      message,
      userId,
      stackTrace
    );
    res.json(error);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/throughput-metrics', requireAuth, async (req: Request, res: Response) => {
  try {
    const { requestsPerSecond, successPerSecond, failurePerSecond, avgResponseTime, p95ResponseTime, p99ResponseTime } = req.body;
    const metric = await applicationPerformanceMonitoringService.recordThroughputMetric(
      requestsPerSecond,
      successPerSecond,
      failurePerSecond,
      avgResponseTime,
      p95ResponseTime,
      p99ResponseTime
    );
    res.json(metric);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/reports', requireAuth, async (req: Request, res: Response) => {
  try {
    const { startTime, endTime } = req.body;
    const report = await applicationPerformanceMonitoringService.generateAPMReport(
      new Date(startTime),
      new Date(endTime)
    );
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/endpoints/:endpoint/metrics', requireAuth, async (req: Request, res: Response) => {
  try {
    const { endpoint } = req.params;
    const { startTime, endTime } = req.query;
    const metrics = await applicationPerformanceMonitoringService.getEndpointMetrics(
      endpoint,
      new Date(startTime as string),
      new Date(endTime as string)
    );
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
