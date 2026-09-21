import { Router } from 'express';
import { modelServingService } from '../services/model-serving.service';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/start-server', requireAuth, async (req, res) => {
  try {
    const { modelId, version, endpoint } = req.body;
    const server = await modelServingService.startModelServer(modelId, version, endpoint);
    res.json(server);
  } catch (error: any) {
    console.error('Error starting model server:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/stop-server/:serverId', requireAuth, async (req, res) => {
  try {
    const { serverId } = req.params;
    await modelServingService.stopModelServer(serverId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error stopping model server:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/servers', requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const servers = await modelServingService.getModelServers(status as string);
    res.json(servers);
  } catch (error: any) {
    console.error('Error fetching model servers:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/inference', requireAuth, async (req, res) => {
  try {
    const { modelId, inputData, batchSize, priority } = req.body;
    const response = await modelServingService.performInference(
      modelId,
      inputData,
      batchSize || 1,
      priority || 'normal'
    );
    res.json(response);
  } catch (error: any) {
    console.error('Error performing inference:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/batch-inference', requireAuth, async (req, res) => {
  try {
    const { modelId, requests } = req.body;
    const responses = await modelServingService.batchInference(modelId, requests);
    res.json(responses);
  } catch (error: any) {
    console.error('Error performing batch inference:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/metrics/:modelId', requireAuth, async (req, res) => {
  try {
    const { modelId } = req.params;
    const metrics = await modelServingService.getServingMetrics(modelId);
    res.json(metrics);
  } catch (error: any) {
    console.error('Error getting serving metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/scale-server/:serverId', requireAuth, async (req, res) => {
  try {
    const { serverId } = req.params;
    const { replicas } = req.body;
    await modelServingService.scaleModelServer(serverId, replicas);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error scaling model server:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/inference-history/:modelId', requireAuth, async (req, res) => {
  try {
    const { modelId } = req.params;
    const { limit } = req.query;
    const history = await modelServingService.getInferenceHistory(
      modelId,
      parseInt(limit as string) || 100
    );
    res.json(history);
  } catch (error: any) {
    console.error('Error fetching inference history:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
