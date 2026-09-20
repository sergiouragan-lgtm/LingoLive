import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { healthChecksUptimeService } from '../services/health-checks-uptime.service';

const router = Router();

router.post('/endpoints', requireAuth, async (req: Request, res: Response) => {
  try {
    const { url, method, name, expectedStatusCode, timeout, interval } = req.body;
    const endpoint = await healthChecksUptimeService.createHealthCheckEndpoint(
      url,
      method,
      name,
      expectedStatusCode,
      timeout,
      interval
    );
    res.json(endpoint);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/results', requireAuth, async (req: Request, res: Response) => {
  try {
    const { endpointId, status, statusCode, responseTime, metadata, error } = req.body;
    const result = await healthChecksUptimeService.recordHealthCheckResult(
      endpointId,
      status,
      statusCode,
      responseTime,
      metadata,
      error
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/availability', requireAuth, async (req: Request, res: Response) => {
  try {
    const { serviceName, startTime, endTime } = req.body;
    const availability = await healthChecksUptimeService.calculateServiceAvailability(
      serviceName,
      new Date(startTime),
      new Date(endTime)
    );
    res.json(availability);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/dashboards', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, endpoints } = req.body;
    const dashboard = await healthChecksUptimeService.createHealthDashboard(
      name,
      endpoints
    );
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/dashboards/:dashboardId/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const { dashboardId } = req.params;
    const { overallStatus } = req.body;
    const dashboard = await healthChecksUptimeService.updateDashboardStatus(
      dashboardId,
      overallStatus
    );
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/downtime-incidents', requireAuth, async (req: Request, res: Response) => {
  try {
    const { endpointId, severity, impact, reason } = req.body;
    const incident = await healthChecksUptimeService.createDowntimeIncident(
      endpointId,
      severity,
      impact,
      reason
    );
    res.json(incident);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/downtime-incidents/:incidentId/resolve', requireAuth, async (req: Request, res: Response) => {
  try {
    const { incidentId } = req.params;
    const incident = await healthChecksUptimeService.resolveDowntimeIncident(incidentId);
    res.json(incident);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/dependencies', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, status, dependsOn, affectedServices, metadata } = req.body;
    const dependency = await healthChecksUptimeService.trackDependencyHealth(
      name,
      status,
      dependsOn,
      affectedServices,
      metadata
    );
    res.json(dependency);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/dashboards/:dashboardId/summary', requireAuth, async (req: Request, res: Response) => {
  try {
    const { dashboardId } = req.params;
    const summary = await healthChecksUptimeService.getHealthSummary(dashboardId);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
