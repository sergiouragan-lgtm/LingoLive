import express from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { learningAnalyticsService } from '../services/learning-analytics.service';

const router = express.Router();

/**
 * @swagger
 * /api/learning-analytics/skill/{skillId}/practice:
 *   post:
 *     summary: Track skill practice
 *     tags:
 *       - Learning Analytics
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               score:
 *                 type: number
 *               durationMinutes:
 *                 type: number
 *     responses:
 *       200:
 *         description: Practice tracked
 */
router.post('/skill/:skillId/practice', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  const { skillId } = req.params;
  const { score, durationMinutes } = req.body;

  if (!score || score < 0 || score > 100) {
    return res.status(400).json({ error: 'Valid score required (0-100)' });
  }

  const mastery = await learningAnalyticsService.trackSkillPractice(
    userId,
    skillId,
    score,
    durationMinutes || 0
  );
  res.json(mastery);
});

/**
 * @swagger
 * /api/learning-analytics/skills:
 *   get:
 *     summary: Get skill mastery
 *     tags:
 *       - Learning Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Skill mastery list
 */
router.get('/skills', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  const skills = await learningAnalyticsService.getSkillMastery(userId);
  res.json(skills);
});

/**
 * @swagger
 * /api/learning-analytics/course/{courseId}:
 *   get:
 *     summary: Get course analytics
 *     tags:
 *       - Learning Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Course analytics
 */
router.get('/course/:courseId', requireAuth, async (req: any, res) => {
  const { courseId } = req.params;
  const analytics = await learningAnalyticsService.getCourseAnalytics(courseId);
  res.json(analytics);
});

/**
 * @swagger
 * /api/learning-analytics/recommendations:
 *   get:
 *     summary: Get personalized learning recommendations
 *     tags:
 *       - Learning Analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         type: number
 *     responses:
 *       200:
 *         description: Learning recommendations
 */
router.get('/recommendations', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  const { limit = 5 } = req.query;
  
  const recommendations = await learningAnalyticsService.recommendNextLessons(
    userId,
    parseInt(limit as string)
  );
  res.json(recommendations);
});

/**
 * @swagger
 * /api/learning-analytics/progress:
 *   get:
 *     summary: Get user progress metrics
 *     tags:
 *       - Learning Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Progress metrics
 */
router.get('/progress', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  const metrics = await learningAnalyticsService.getProgressMetrics(userId);
  res.json(metrics);
});

/**
 * @swagger
 * /api/learning-analytics/course-stats:
 *   get:
 *     summary: Get course completion statistics
 *     tags:
 *       - Learning Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Course completion stats
 */
router.get('/course-stats', requireAuth, async (req: any, res) => {
  const stats = await learningAnalyticsService.getCourseCompletionStats();
  res.json(stats);
});

export default router;
