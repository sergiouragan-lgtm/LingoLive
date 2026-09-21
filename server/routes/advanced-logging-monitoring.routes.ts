import { Router, Request, Response } from 'express';
import { advancedLoggingMonitoringService } from '../services/advanced-logging-monitoring.service';

const router = Router();

router.post('/logs/create', async (req: Request, res: Response) => {
  try {
    const { level, component, message, metadata } = req.body;
    const entry = await advancedLoggingMonitoringService.createLogEntry(level, component, message, metadata);
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/alerts/trigger', async (req: Request, res: Response) => {
  try {
    const { severity, component, threshold, currentValue } = req.body;
    const alert = await advancedLoggingMonitoringService.triggerAlert(severity, component, threshold, currentValue);
    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/collectors/create', async (req: Request, res: Response) => {
  try {
    const { name, interval, enabled } = req.body;
    const collector = await advancedLoggingMonitoringService.createMetricsCollector(name, interval, enabled);
    res.status(201).json(collector);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/dashboard/configure', async (req: Request, res: Response) => {
  try {
    const { name, metrics, refreshInterval } = req.body;
    const dashboard = await advancedLoggingMonitoringService.configureDashboard(name, metrics, refreshInterval);
    res.status(201).json(dashboard);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/health-check/:component', async (req: Request, res: Response) => {
  try {
    const { component } = req.params;
    const check = await advancedLoggingMonitoringService.performHealthCheck(component);
    res.status(200).json(check);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await advancedLoggingMonitoringService.getLoggingMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
