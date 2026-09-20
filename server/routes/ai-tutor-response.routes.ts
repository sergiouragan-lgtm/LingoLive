import { Router } from 'express';
import { aiTutorResponseService } from '../services/ai-tutor-response.service';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/generate-response', requireAuth, async (req: any, res) => {
  try {
    const { questionId, userAnswer, context } = req.body;
    const response = await aiTutorResponseService.generateTutorResponse(
      req.user?.uid || '',
      questionId,
      userAnswer,
      context
    );
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/detect-misconceptions', requireAuth, async (req: any, res) => {
  try {
    const { userAnswer, context } = req.body;
    const misconceptions = await aiTutorResponseService.detectMisconceptions(userAnswer, context);
    res.json({ misconceptions });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/generate-hints', requireAuth, async (req: any, res) => {
  try {
    const { questionId, userAnswer } = req.body;
    const hints = await aiTutorResponseService.generatePersonalizedHints(
      questionId,
      req.user?.uid || '',
      userAnswer
    );
    res.json({ hints });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/record-misconception', requireAuth, async (req: any, res) => {
  try {
    const { concept, misconception } = req.body;
    const pattern = await aiTutorResponseService.recordMisconceptionPattern(
      req.user?.uid || '',
      concept,
      misconception
    );
    res.json(pattern);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/evaluate-response/:responseId', requireAuth, async (req: any, res) => {
  try {
    const quality = await aiTutorResponseService.evaluateResponseQuality(req.params.responseId);
    res.json(quality);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:responseId', requireAuth, async (req: any, res) => {
  try {
    const response = await aiTutorResponseService.getTutorResponse(req.params.responseId);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
