import { Router } from 'express';
import { realTimeFormativeAssessmentService } from '../services/real-time-formative-assessment.service';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/create', requireAuth, async (req: any, res) => {
  try {
    const { conceptId, assessmentType, questions, difficultyLevel } = req.body;
    const assessment = await realTimeFormativeAssessmentService.createFormativeAssessment(
      req.user?.uid || '',
      conceptId,
      assessmentType,
      questions,
      difficultyLevel
    );
    res.json(assessment);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/submit-response/:assessmentId', requireAuth, async (req: any, res) => {
  try {
    const { questionId, studentAnswer, timeSpent, confidenceLevel } = req.body;
    const response = await realTimeFormativeAssessmentService.submitStudentResponse(
      req.params.assessmentId,
      questionId,
      studentAnswer,
      timeSpent,
      confidenceLevel
    );
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/feedback/:assessmentId/:questionId', requireAuth, async (req: any, res) => {
  try {
    const feedback = await realTimeFormativeAssessmentService.generateImmediateFeedback(
      req.params.assessmentId,
      req.params.questionId
    );
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/complete/:assessmentId', requireAuth, async (req: any, res) => {
  try {
    const assessment = await realTimeFormativeAssessmentService.completeAssessment(req.params.assessmentId);
    res.json(assessment);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:assessmentId/analysis', requireAuth, async (req: any, res) => {
  try {
    const analysis = await realTimeFormativeAssessmentService.getAssessmentAnalysis(req.params.assessmentId);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
