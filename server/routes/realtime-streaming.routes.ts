import { Router, Request, Response } from 'express';
import { realtimeStreamingService } from '../services/realtime-streaming.service';

const router = Router();

router.post('/pipelines/create', async (req: Request, res: Response) => {
  try {
    const { name, source, destination } = req.body;
    const pipeline = await realtimeStreamingService.createStreamingPipeline(name, source, destination);
    res.status(201).json(pipeline);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/streams/publish', async (req: Request, res: Response) => {
  try {
    const { pipelineId, dataType, throughput, recordCount } = req.body;
    const stream = await realtimeStreamingService.publishStream(pipelineId, dataType, throughput, recordCount);
    res.status(201).json(stream);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/partitions/create', async (req: Request, res: Response) => {
  try {
    const { streamId, partitionKey } = req.body;
    const partition = await realtimeStreamingService.createStreamPartition(streamId, partitionKey);
    res.status(201).json(partition);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await realtimeStreamingService.getStreamingMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
