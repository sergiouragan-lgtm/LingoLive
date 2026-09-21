import { Router } from 'express';
import { learningPathOptimizationService } from '../services/learning-path-optimization.service';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/create-path', requireAuth, async (req, res) => {
  try {
    const { userId, courseId, difficulty } = req.body;
    const path = await learningPathOptimizationService.createLearningPath(userId, courseId, difficulty);
    res.json(path);
  } catch (error: any) {
    console.error('Error creating learning path:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/optimize-sequence', requireAuth, async (req, res) => {
  try {
    const { userId, pathId, config } = req.body;
    const recommendation = await learningPathOptimizationService.optimizePathSequence(userId, pathId, config);
    res.json(recommendation);
  } catch (error: any) {
    console.error('Error optimizing path sequence:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/update-progress', requireAuth, async (req, res) => {
  try {
    const { userId, pathId, completedModuleId } = req.body;
    const path = await learningPathOptimizationService.updatePathProgress(userId, pathId, completedModuleId);
    res.json(path);
  } catch (error: any) {
    console.error('Error updating path progress:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/adjust-difficulty', requireAuth, async (req, res) => {
  try {
    const { userId, pathId, newDifficulty } = req.body;
    const path = await learningPathOptimizationService.adjustDifficulty(userId, pathId, newDifficulty);
    res.json(path);
  } catch (error: any) {
    console.error('Error adjusting difficulty:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/path/:pathId', requireAuth, async (req, res) => {
  try {
    const { pathId } = req.params;
    const path = await learningPathOptimizationService.getLearningPath(pathId);
    if (!path) {
      return res.status(404).json({ error: 'Path not found' });
    }
    res.json(path);
  } catch (error: any) {
    console.error('Error fetching learning path:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/user-paths/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const paths = await learningPathOptimizationService.getUserLearningPaths(userId);
    res.json(paths);
  } catch (error: any) {
    console.error('Error fetching user learning paths:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
