import { Router } from 'express';
import { federatedLearningService } from '../services/federated-learning.service';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/initialize-model', requireAuth, async (req, res) => {
  try {
    const { name, taskType } = req.body;
    const model = await federatedLearningService.initializeFederatedModel(name, taskType);
    res.json(model);
  } catch (error: any) {
    console.error('Error initializing federated model:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/submit-local-update', requireAuth, async (req, res) => {
  try {
    const { participantId, modelId, weights, accuracy, dataSize } = req.body;
    const update = await federatedLearningService.submitLocalUpdate(
      participantId,
      modelId,
      weights,
      accuracy,
      dataSize
    );
    res.json(update);
  } catch (error: any) {
    console.error('Error submitting local update:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/aggregate-updates/:modelId', requireAuth, async (req, res) => {
  try {
    const { modelId } = req.params;
    const model = await federatedLearningService.aggregateModelUpdates(modelId);
    res.json(model);
  } catch (error: any) {
    console.error('Error aggregating model updates:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/apply-differential-privacy', requireAuth, async (req, res) => {
  try {
    const { weights, config } = req.body;
    const noisyWeights = await federatedLearningService.applyDifferentialPrivacy(
      weights,
      config
    );
    res.json({ weights: noisyWeights });
  } catch (error: any) {
    console.error('Error applying differential privacy:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/privacy-report/:modelId', requireAuth, async (req, res) => {
  try {
    const { modelId } = req.params;
    const report = await federatedLearningService.generatePrivacyReport(modelId);
    res.json(report);
  } catch (error: any) {
    console.error('Error generating privacy report:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/models', requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const models = await federatedLearningService.getFederatedModels(status as string);
    res.json(models);
  } catch (error: any) {
    console.error('Error fetching federated models:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/local-updates/:modelId', requireAuth, async (req, res) => {
  try {
    const { modelId } = req.params;
    const { round, limit } = req.query;
    const updates = await federatedLearningService.getLocalUpdates(
      modelId,
      round ? parseInt(round as string) : undefined,
      parseInt(limit as string) || 100
    );
    res.json(updates);
  } catch (error: any) {
    console.error('Error fetching local updates:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/aggregation-status/:modelId', requireAuth, async (req, res) => {
  try {
    const { modelId } = req.params;
    const status = await federatedLearningService.getAggregationStatus(modelId);
    res.json(status);
  } catch (error: any) {
    console.error('Error getting aggregation status:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
