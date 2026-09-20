import { Router, Request, Response } from 'express';
import { advancedAnalyticsReportingService } from '../services/advanced-analytics-reporting.service';

const router = Router();

router.post('/reports/create', async (req: Request, res: Response) => {
  try {
    const { name, description, type, metrics, dimensions, filters, createdBy } = req.body;
    const report = await advancedAnalyticsReportingService.createCustomReport(
      name,
      description,
      type,
      metrics,
      dimensions,
      filters,
      createdBy
    );
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/warehouse/setup', async (req: Request, res: Response) => {
  try {
    const { name, location, capacity } = req.body;
    const warehouse = await advancedAnalyticsReportingService.setupDataWarehouse(
      name,
      location,
      capacity
    );
    res.status(201).json(warehouse);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/olap/cube', async (req: Request, res: Response) => {
  try {
    const { name, dimensions, measures, factTableName, refreshSchedule } = req.body;
    const cube = await advancedAnalyticsReportingService.createOLAPCube(
      name,
      dimensions,
      measures,
      factTableName,
      refreshSchedule
    );
    res.status(201).json(cube);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/dashboards/build', async (req: Request, res: Response) => {
  try {
    const { name, userId, widgets, refreshInterval } = req.body;
    const dashboard = await advancedAnalyticsReportingService.buildAdvancedDashboard(
      name,
      userId,
      widgets,
      refreshInterval
    );
    res.status(201).json(dashboard);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/visualization/create', async (req: Request, res: Response) => {
  try {
    const { name, type, dataSource, xAxis, yAxis } = req.body;
    const visualization = await advancedAnalyticsReportingService.createDataVisualization(
      name,
      type,
      dataSource,
      xAxis,
      yAxis
    );
    res.status(201).json(visualization);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/schedule/report', async (req: Request, res: Response) => {
  try {
    const { reportId, frequency, recipients, format } = req.body;
    const schedule = await advancedAnalyticsReportingService.scheduleReport(
      reportId,
      frequency,
      recipients,
      format
    );
    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const metrics = await advancedAnalyticsReportingService.getReportingMetrics({ start: startDate, end: endDate });
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
