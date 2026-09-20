import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { metricsTimeseriesService } from '../services/metrics-timeseries.service';

const router = Router();

router.post('/system-metrics', requireAuth, async (req: Request, res: Response) => {
  try {
    const { cpuUsage, memoryUsage, diskUsage, networkBytesIn, networkBytesOut, activeConnections } = req.body;
    const metrics = await metricsTimeseriesService.recordSystemMetrics(
      cpuUsage,
      memoryUsage,
      diskUsage,
      networkBytesIn,
      networkBytesOut,
      activeConnections
    );
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/application-metrics', requireAuth, async (req: Request, res: Response) => {
  try {
    const { totalRequests, successfulRequests, failedRequests, avgResponseTime, activeUsers, activeSessions } = req.body;
    const metrics = await metricsTimeseriesService.recordApplicationMetrics(
      totalRequests,
      successfulRequests,
      failedRequests,
      avgResponseTime,
      activeUsers,
      activeSessions
    );
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/business-metrics', requireAuth, async (req: Request, res: Response) => {
  try {
    const { totalRevenue, activeSubscriptions, newUsers, churnRate, conversionRate, customMetrics } = req.body;
    const metrics = await metricsTimeseriesService.recordBusinessMetrics(
      totalRevenue,
      activeSubscriptions,
      newUsers,
      churnRate,
      conversionRate,
      customMetrics
    );
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/custom-metrics', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, value, unit, labels } = req.body;
    const metric = await metricsTimeseriesService.recordCustomMetric(
      name,
      value,
      unit,
      labels
    );
    res.json(metric);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/timeseries', requireAuth, async (req: Request, res: Response) => {
  try {
    const { metricName, aggregation, interval, retentionDays } = req.body;
    const series = await metricsTimeseriesService.createMetricTimeSeries(
      metricName,
      aggregation,
      interval,
      retentionDays
    );
    res.json(series);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/dashboards', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, description, metrics, refreshInterval } = req.body;
    const dashboard = await metricsTimeseriesService.createMetricDashboard(
      name,
      description,
      metrics,
      refreshInterval
    );
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/history/:metricName', requireAuth, async (req: Request, res: Response) => {
  try {
    const { metricName } = req.params;
    const { startTime, endTime, aggregation } = req.query;
    const history = await metricsTimeseriesService.getMetricHistory(
      metricName,
      new Date(startTime as string),
      new Date(endTime as string),
      aggregation as any
    );
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
