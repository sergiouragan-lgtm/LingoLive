import { Router, Request, Response } from 'express';
import { containerOrchestrationService } from '../services/container-orchestration.service';

const router = Router();

router.post('/containers/create', async (req: Request, res: Response) => {
  try {
    const { name, image, status } = req.body;
    const container = await containerOrchestrationService.createContainer(name, image, status);
    res.status(201).json(container);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/pods/define', async (req: Request, res: Response) => {
  try {
    const { name, containers, replicas } = req.body;
    const pod = await containerOrchestrationService.definePod(name, containers, replicas);
    res.status(201).json(pod);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/registry/configure', async (req: Request, res: Response) => {
  try {
    const { url, username } = req.body;
    const registry = await containerOrchestrationService.configureRegistry(url, username);
    res.status(201).json(registry);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/deployments/create', async (req: Request, res: Response) => {
  try {
    const { podId, version, strategy } = req.body;
    const deployment = await containerOrchestrationService.createDeployment(podId, version, strategy);
    res.status(201).json(deployment);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await containerOrchestrationService.getContainerMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
