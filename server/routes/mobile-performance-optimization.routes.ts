import { Router, Request, Response } from 'express';
import { requireAuth, requireSelfParam } from '../middleware/requireAuth';
import { mobilePerformanceOptimizationService } from '../services/mobile-performance-optimization.service';

const router = Router();

router.post('/capture-performance-profile/:userId', requireAuth, requireSelfParam, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { deviceType, osType, screenSize, connectionType, metadata } = req.body;

    const profile = await mobilePerformanceOptimizationService.capturePerformanceProfile(
      userId,
      deviceType,
      osType,
      screenSize,
      connectionType,
      metadata
    );
    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/measure-performance-metrics/:userId', requireAuth, requireSelfParam, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const metrics = await mobilePerformanceOptimizationService.measurePerformanceMetrics(userId);
    res.json({ success: true, metrics });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/optimize-resources/:userId', requireAuth, requireSelfParam, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { resourceType, originalSize, format } = req.body;

    const optimization = await mobilePerformanceOptimizationService.optimizeResources(
      userId,
      resourceType,
      originalSize,
      format
    );
    res.json({ success: true, optimization });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/configure-adaptive-content/:userId', requireAuth, requireSelfParam, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { connectionType, screenSize } = req.body;

    const content = await mobilePerformanceOptimizationService.configureAdaptiveContent(
      userId,
      connectionType,
      screenSize
    );
    res.json({ success: true, content });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/inline-critical-css/:userId', requireAuth, requireSelfParam, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { route } = req.body;

    const inlining = await mobilePerformanceOptimizationService.inlineCriticalCSS(userId, route);
    res.json({ success: true, inlining });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/check-performance-budget/:userId', requireAuth, requireSelfParam, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const violations = await mobilePerformanceOptimizationService.checkPerformanceBudget(userId);
    res.json({ success: true, violations });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
