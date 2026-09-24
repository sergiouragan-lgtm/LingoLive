import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { learningGapAggregationService } from '../services/learning-gap-aggregation.service';
import { triggerAggregationNow, getAggregationQueueStats } from '../jobs/learning-gap-aggregation.job';

const router = Router();

/**
 * Log a student error
 * POST /api/learning-gaps/errors
 */
router.post('/errors', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;
    const {
      lessonId,
      exerciseId,
      language,
      skillArea,
      skillSubArea,
      correctAnswer,
      studentAnswer,
      errorType,
      confidence,
      contextMetadata,
    } = req.body;

    // Validate required fields
    if (!lessonId || !exerciseId || !skillArea || !skillSubArea) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const errorLog = await learningGapAggregationService.logStudentError({
      userId,
      timestamp: new Date(),
      lessonId,
      exerciseId,
      language: language || 'en',
      skillArea,
      skillSubArea,
      correctAnswer,
      studentAnswer,
      errorType: errorType || 'incorrect',
      confidence,
      contextMetadata,
    });

    res.status(201).json({
      success: true,
      errorId: errorLog.id,
    });
  } catch (error) {
    console.error('Error logging error:', error);
    res.status(500).json({
      error: 'Failed to log error',
      message: (error as Error).message,
    });
  }
});

/**
 * Get learning gaps for current user
 * GET /api/learning-gaps
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;
    const gaps = await learningGapAggregationService.getUserGaps(userId);

    res.json({
      success: true,
      count: gaps.length,
      gaps,
    });
  } catch (error) {
    console.error('Error fetching gaps:', error);
    res.status(500).json({
      error: 'Failed to fetch learning gaps',
      message: (error as Error).message,
    });
  }
});

/**
 * Get learning gaps by skill area
 * GET /api/learning-gaps/by-skill/:skillArea
 */
router.get('/by-skill/:skillArea', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;
    const { skillArea } = req.params;

    const gaps = await learningGapAggregationService.getGapsBySkillArea(userId, skillArea);

    res.json({
      success: true,
      skillArea,
      count: gaps.length,
      gaps,
    });
  } catch (error) {
    console.error('Error fetching gaps by skill area:', error);
    res.status(500).json({
      error: 'Failed to fetch gaps by skill area',
      message: (error as Error).message,
    });
  }
});

/**
 * Manually trigger gap aggregation for current user
 * POST /api/learning-gaps/aggregate
 */
router.post('/aggregate', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;
    const gaps = await learningGapAggregationService.aggregateUserGaps(userId);

    res.json({
      success: true,
      message: `Aggregated ${gaps.length} learning gaps`,
      gaps,
    });
  } catch (error) {
    console.error('Error aggregating gaps:', error);
    res.status(500).json({
      error: 'Failed to aggregate gaps',
      message: (error as Error).message,
    });
  }
});

/**
 * Close a learning gap
 * POST /api/learning-gaps/:skillArea/:skillSubArea/close
 */
router.post('/:skillArea/:skillSubArea/close', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;
    const { skillArea, skillSubArea } = req.params;
    const { language = 'en' } = req.body;

    await learningGapAggregationService.closeGap(userId, skillArea, skillSubArea, language);

    res.json({
      success: true,
      message: 'Learning gap closed successfully',
    });
  } catch (error) {
    console.error('Error closing gap:', error);
    res.status(500).json({
      error: 'Failed to close gap',
      message: (error as Error).message,
    });
  }
});

/**
 * Admin: Trigger global aggregation
 * POST /api/learning-gaps/admin/trigger-aggregation
 */
router.post('/admin/trigger-aggregation', requireAuth, async (req: Request, res: Response) => {
  try {
    // Verify admin role (simplified - enhance in production)
    const userRole = (req as any).user.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized - admin only' });
    }

    const { limitUsers } = req.body;
    const job = await triggerAggregationNow(limitUsers);

    res.json({
      success: true,
      message: 'Aggregation job triggered',
      jobId: job.id,
    });
  } catch (error) {
    console.error('Error triggering aggregation:', error);
    res.status(500).json({
      error: 'Failed to trigger aggregation',
      message: (error as Error).message,
    });
  }
});

/**
 * Admin: Get aggregation queue stats
 * GET /api/learning-gaps/admin/stats
 */
router.get('/admin/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    // Verify admin role
    const userRole = (req as any).user.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized - admin only' });
    }

    const stats = await getAggregationQueueStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error fetching queue stats:', error);
    res.status(500).json({
      error: 'Failed to fetch stats',
      message: (error as Error).message,
    });
  }
});

/**
 * Admin: Get aggregation history
 * GET /api/learning-gaps/admin/history
 */
router.get('/admin/history', requireAuth, async (req: Request, res: Response) => {
  try {
    // Verify admin role
    const userRole = (req as any).user.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized - admin only' });
    }

    const limitDays = parseInt((req.query.limitDays as string) || '7');
    const history = await learningGapAggregationService.getAggregationStats(limitDays);

    res.json({
      success: true,
      count: history.length,
      limitDays,
      history,
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      error: 'Failed to fetch history',
      message: (error as Error).message,
    });
  }
});

export default router;
