import express, { Request, Response } from 'express';
import { biIntegrationService } from '../services/bi-integration.service';
import { requireAuth } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/connections', requireAuth, async (req: Request, res: Response) => {
  try {
    const { platform, apiKey, serverUrl } = req.body;
    const connection = await biIntegrationService.connectBIPlatform(platform, apiKey, serverUrl);
    res.status(201).json(connection);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/connections', requireAuth, async (req: Request, res: Response) => {
  try {
    const connections = await biIntegrationService.getBIConnections();
    res.json(connections);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/connections/:connectionId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    await biIntegrationService.disconnectBIPlatform(connectionId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/scheduled-reports', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, platform, frequency, recipients, reportType, filters } = req.body;
    const report = await biIntegrationService.createScheduledReport(
      name,
      platform,
      frequency,
      recipients,
      reportType,
      filters
    );
    res.status(201).json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/scheduled-reports', requireAuth, async (req: Request, res: Response) => {
  try {
    const enabled = req.query.enabled === 'true' ? true : req.query.enabled === 'false' ? false : undefined;
    const reports = await biIntegrationService.getScheduledReports(enabled);
    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/scheduled-reports/:reportId/execute', requireAuth, async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    await biIntegrationService.executeScheduledReport(reportId);
    res.json({ success: true, message: 'Report execution initiated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/data-warehouse-sync', requireAuth, async (req: Request, res: Response) => {
  try {
    const { sourceCollection, targetTable } = req.body;
    const job = await biIntegrationService.syncDataToWarehouse(sourceCollection, targetTable);
    res.status(201).json(job);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/data-warehouse-sync', requireAuth, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const jobs = await biIntegrationService.getDWyncJobs(limit);
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/dashboard-configs', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, platform, dashboardId, refreshInterval, metrics, filters } = req.body;
    const config = await biIntegrationService.createDashboardConfig(
      name,
      platform,
      dashboardId,
      refreshInterval,
      metrics,
      filters
    );
    res.status(201).json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/dashboard-configs', requireAuth, async (req: Request, res: Response) => {
  try {
    const configs = await biIntegrationService.getBIDashboardConfigs();
    res.json(configs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/dashboard-configs/:dashboardId/refresh', requireAuth, async (req: Request, res: Response) => {
  try {
    const { dashboardId } = req.params;
    await biIntegrationService.refreshDashboardData(dashboardId);
    res.json({ success: true, message: 'Dashboard data refresh initiated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
