import { Router } from 'express';
import { adaptiveAssessmentService } from '../services/adaptive-assessment.service';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/quiz/start', requireAuth, async (req, res) => {
  try {
    const { userId, moduleId, initialDifficulty } = req.body;
    const quiz = await adaptiveAssessmentService.startAdaptiveQuiz(userId, moduleId, initialDifficulty);
    res.json(quiz);
  } catch (error: any) {
    console.error('Error starting adaptive quiz:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/question/:quizId', requireAuth, async (req, res) => {
  try {
    const { quizId } = req.params;
    const question = await adaptiveAssessmentService.getNextQuestion(quizId);
    res.json(question);
  } catch (error: any) {
    console.error('Error getting question:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/answer', requireAuth, async (req, res) => {
  try {
    const { quizId, questionId, selectedOptionIndex, timeSpentSeconds } = req.body;
    const result = await adaptiveAssessmentService.submitAnswer(
      quizId,
      questionId,
      selectedOptionIndex,
      timeSpentSeconds
    );
    res.json(result);
  } catch (error: any) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/quiz/complete/:quizId', requireAuth, async (req, res) => {
  try {
    const { quizId } = req.params;
    const result = await adaptiveAssessmentService.completeQuiz(quizId);
    res.json(result);
  } catch (error: any) {
    console.error('Error completing quiz:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/mastery/:userId/:skillId', requireAuth, async (req, res) => {
  try {
    const { userId, skillId } = req.params;
    const mastery = await adaptiveAssessmentService.getSkillMastery(userId, skillId);
    res.json(mastery);
  } catch (error: any) {
    console.error('Error getting skill mastery:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/personalized-quiz', requireAuth, async (req, res) => {
  try {
    const { userId, moduleId, targetConcepts } = req.body;
    const quiz = await adaptiveAssessmentService.generatePersonalizedQuiz(userId, moduleId, targetConcepts);
    res.json(quiz);
  } catch (error: any) {
    console.error('Error generating personalized quiz:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
