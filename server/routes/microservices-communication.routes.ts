import { Router, Request, Response } from 'express';
import { microservicesCommunicationService } from '../services/microservices-communication.service';

const router = Router();

router.post('/endpoints/register', async (req: Request, res: Response) => {
  try {
    const { serviceId, url, port, protocol } = req.body;
    const endpoint = await microservicesCommunicationService.registerServiceEndpoint(serviceId, url, port, protocol);
    res.status(201).json(endpoint);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/queues/create', async (req: Request, res: Response) => {
  try {
    const { name, type, capacity } = req.body;
    const queue = await microservicesCommunicationService.createMessageQueue(name, type, capacity);
    res.status(201).json(queue);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/rpc/execute', async (req: Request, res: Response) => {
  try {
    const { serviceFrom, serviceTo, method } = req.body;
    const call = await microservicesCommunicationService.executeRPCCall(serviceFrom, serviceTo, method);
    res.status(201).json(call);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await microservicesCommunicationService.getCommunicationMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
