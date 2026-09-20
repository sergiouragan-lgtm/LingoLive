import { Router } from 'express';
import { intelligentTutoringService } from '../services/intelligent-tutoring.service';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/session/start', requireAuth, async (req, res) => {
  try {
    const { userId, conceptId } = req.body;
    const session = await intelligentTutoringService.startTutoringSession(userId, conceptId);
    res.json(session);
  } catch (error: any) {
    console.error('Error starting tutoring session:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/hint-request', requireAuth, async (req, res) => {
  try {
    const { sessionId, attemptNumber, responseContext } = req.body;
    const hint = await intelligentTutoringService.requestHint(sessionId, attemptNumber, responseContext);
    res.json(hint);
  } catch (error: any) {
    console.error('Error requesting hint:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/record-mistake', requireAuth, async (req, res) => {
  try {
    const { sessionId, mistakeType, expectedAnswer, studentAnswer } = req.body;
    await intelligentTutoringService.recordMistake(sessionId, mistakeType, expectedAnswer, studentAnswer);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error recording mistake:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/session/complete/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await intelligentTutoringService.completeTutoringSession(sessionId);
    res.json(session);
  } catch (error: any) {
    console.error('Error completing session:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/practice/start', requireAuth, async (req, res) => {
  try {
    const { userId, conceptId, problemCount } = req.body;
    const practice = await intelligentTutoringService.startGuidedPractice(userId, conceptId, problemCount);
    res.json(practice);
  } catch (error: any) {
    console.error('Error starting practice:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/practice/complete-problem', requireAuth, async (req, res) => {
  try {
    const { practiceSessionId, problemIndex, isCorrect, attemptsNeeded, timeSpentSeconds } = req.body;
    await intelligentTutoringService.completePracticeProblem(
      practiceSessionId,
      problemIndex,
      isCorrect,
      attemptsNeeded,
      timeSpentSeconds
    );
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error completing practice problem:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/model/:userId/:conceptId', requireAuth, async (req, res) => {
  try {
    const { userId, conceptId } = req.params;
    const model = await intelligentTutoringService.getPedagogicalModel(userId, conceptId);
    res.json(model);
  } catch (error: any) {
    console.error('Error getting pedagogical model:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/misconception/:misconceptionId', requireAuth, async (req, res) => {
  try {
    const { misconceptionId } = req.params;
    const model = await intelligentTutoringService.getMisconceptionModel(misconceptionId);
    if (!model) {
      return res.status(404).json({ error: 'Misconception not found' });
    }
    res.json(model);
  } catch (error: any) {
    console.error('Error getting misconception model:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
