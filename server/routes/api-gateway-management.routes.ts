import { Router, Request, Response } from 'express';
import { apiGatewayManagementService } from '../services/api-gateway-management.service';

const router = Router();

router.post('/routes/create', async (req: Request, res: Response) => {
  try {
    const { path, method, handler, rateLimitWindow } = req.body;
    const route = await apiGatewayManagementService.createAPIRoute(path, method, handler, rateLimitWindow);
    res.status(201).json(route);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/rate-limit/set', async (req: Request, res: Response) => {
  try {
    const { routeId, requestsPerWindow, windowDuration } = req.body;
    const policy = await apiGatewayManagementService.setRateLimit(routeId, requestsPerWindow, windowDuration);
    res.status(201).json(policy);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/versions/create', async (req: Request, res: Response) => {
  try {
    const { apiName, version, supportedEndpoints } = req.body;
    const versioning = await apiGatewayManagementService.manageAPIVersion(apiName, version, supportedEndpoints);
    res.status(201).json(versioning);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/keys/create', async (req: Request, res: Response) => {
  try {
    const { name, permissions, rateLimit } = req.body;
    const apiKey = await apiGatewayManagementService.createAPIKey(name, permissions, rateLimit);
    res.status(201).json(apiKey);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const metrics = await apiGatewayManagementService.getGatewayMetrics({ start: startDate, end: endDate });
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
