import { Router } from 'express';
import { deepLearningService } from '../services/deep-learning.service';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/lstm-predict', requireAuth, async (req, res) => {
  try {
    const { userId, metric, daysAhead } = req.body;
    const prediction = await deepLearningService.predictWithLSTM(userId, metric, daysAhead);
    res.json(prediction);
  } catch (error: any) {
    console.error('Error predicting with LSTM:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/train-model', requireAuth, async (req, res) => {
  try {
    const { modelType, trainingData } = req.body;
    const model = await deepLearningService.trainNeuralNetworkModel(modelType, trainingData);
    res.json(model);
  } catch (error: any) {
    console.error('Error training neural network:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/forecast-timeseries', requireAuth, async (req, res) => {
  try {
    const { metric, daysAhead } = req.body;
    const forecast = await deepLearningService.forecastTimeSeriesAdvanced(metric, daysAhead);
    res.json(forecast);
  } catch (error: any) {
    console.error('Error forecasting time series:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/models', requireAuth, async (req, res) => {
  try {
    const { modelType } = req.query;
    const models = await deepLearningService.getNeuralNetworkModels(modelType as string);
    res.json(models);
  } catch (error: any) {
    console.error('Error fetching neural network models:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/evaluate-model/:modelId', requireAuth, async (req, res) => {
  try {
    const { modelId } = req.params;
    const metrics = await deepLearningService.evaluateModelPerformance(modelId);
    res.json(metrics);
  } catch (error: any) {
    console.error('Error evaluating model performance:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/lstm-predictions/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { metric, limit } = req.query;
    const predictions = await deepLearningService.getLSTMPredictions(
      userId,
      metric as string,
      parseInt(limit as string) || 10
    );
    res.json(predictions);
  } catch (error: any) {
    console.error('Error fetching LSTM predictions:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
