import { Router } from 'express';
import { realTimeLearningAnalyticsService } from '../services/realtime-learning-analytics.service';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/session/start', requireAuth, async (req, res) => {
  try {
    const { userId, moduleId } = req.body;
    const session = await realTimeLearningAnalyticsService.startLearningSession(userId, moduleId);
    res.json(session);
  } catch (error: any) {
    console.error('Error starting learning session:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/session/record-attempt', requireAuth, async (req, res) => {
  try {
    const { sessionId, concept, isCorrect, timeSpentSeconds } = req.body;
    await realTimeLearningAnalyticsService.recordQuestionAttempt(
      sessionId,
      concept,
      isCorrect,
      timeSpentSeconds
    );
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error recording attempt:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/session/end/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await realTimeLearningAnalyticsService.endLearningSession(sessionId);
    res.json(session);
  } catch (error: any) {
    console.error('Error ending learning session:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/metrics/:userId/:moduleId', requireAuth, async (req, res) => {
  try {
    const { userId, moduleId } = req.params;
    const metrics = await realTimeLearningAnalyticsService.getPerformanceMetrics(userId, moduleId);
    res.json(metrics);
  } catch (error: any) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/pace/:userId/:moduleId', requireAuth, async (req, res) => {
  try {
    const { userId, moduleId } = req.params;
    const pace = await realTimeLearningAnalyticsService.analyzeLearningPace(userId, moduleId);
    res.json(pace);
  } catch (error: any) {
    console.error('Error analyzing learning pace:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/struggles/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const struggles = await realTimeLearningAnalyticsService.getStruggleIndicators(userId);
    res.json(struggles);
  } catch (error: any) {
    console.error('Error getting struggle indicators:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/interventions/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const triggers = await realTimeLearningAnalyticsService.getActiveInterventionTriggers(userId);
    res.json(triggers);
  } catch (error: any) {
    console.error('Error getting intervention triggers:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
