import { Router, Request, Response } from 'express';
import { serviceMeshOrchestrationService } from '../services/service-mesh-orchestration.service';

const router = Router();

router.post('/mesh/create', async (req: Request, res: Response) => {
  try {
    const { name, namespace, services } = req.body;
    const mesh = await serviceMeshOrchestrationService.createServiceMesh(name, namespace, services);
    res.status(201).json(mesh);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/services/register', async (req: Request, res: Response) => {
  try {
    const { name, image, replicas, port } = req.body;
    const service = await serviceMeshOrchestrationService.registerMicroService(name, image, replicas, port);
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/policies/create', async (req: Request, res: Response) => {
  try {
    const { meshId, type, config } = req.body;
    const policy = await serviceMeshOrchestrationService.createServicePolicy(meshId, type, config);
    res.status(201).json(policy);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/traffic/configure', async (req: Request, res: Response) => {
  try {
    const { serviceId, circuitBreakerThreshold, timeoutMs, retries } = req.body;
    const shaping = await serviceMeshOrchestrationService.configureTrafficShaping(serviceId, circuitBreakerThreshold, timeoutMs, retries);
    res.status(201).json(shaping);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/discovery', async (req: Request, res: Response) => {
  try {
    const discovery = await serviceMeshOrchestrationService.discoverServices();
    res.status(200).json(discovery);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
