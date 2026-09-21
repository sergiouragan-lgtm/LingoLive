import { Router, Request, Response } from 'express';
import { infrastructureProvisioningService } from '../services/infrastructure-provisioning.service';

const router = Router();

router.post('/templates/create', async (req: Request, res: Response) => {
  try {
    const { name, provider, config } = req.body;
    const template = await infrastructureProvisioningService.createTemplate(name, provider, config);
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/resources/allocate', async (req: Request, res: Response) => {
  try {
    const { templateId, region, instanceType, count } = req.body;
    const allocation = await infrastructureProvisioningService.allocateResources(templateId, region, instanceType, count);
    res.status(201).json(allocation);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/jobs/create', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.body;
    const job = await infrastructureProvisioningService.createProvisioningJob(templateId);
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await infrastructureProvisioningService.getProvisioningMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
