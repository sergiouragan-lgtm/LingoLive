import { Router, Request, Response, NextFunction } from 'express';
import { advancedServiceWorkerService } from '../services/advanced-service-worker.service';

const router = Router();

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

router.post('/configure-service-worker/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { cacheStrategy, precachePatterns, runtimeCachePatterns } = req.body;

    const config = await advancedServiceWorkerService.configureServiceWorker(
      userId,
      cacheStrategy,
      precachePatterns,
      runtimeCachePatterns
    );
    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/schedule-background-sync-task/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { taskType, minInterval, metadata } = req.body;

    const task = await advancedServiceWorkerService.scheduleBackgroundSyncTask(userId, taskType, minInterval, metadata);
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/subscribe-push-notifications/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { endpoint, auth, p256dh, categories } = req.body;

    const config = await advancedServiceWorkerService.subscribeToPushNotifications(
      userId,
      endpoint,
      auth,
      p256dh,
      categories
    );
    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/capture-offline-analytics/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { eventType, eventData, networkAvailable } = req.body;

    const analytics = await advancedServiceWorkerService.captureOfflineAnalytics(
      userId,
      eventType,
      eventData,
      networkAvailable
    );
    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/define-cache-strategy/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { route, strategy, maxAge, maxEntries } = req.body;

    const cacheStrategy = await advancedServiceWorkerService.defineCacheStrategy(
      userId,
      route,
      strategy,
      maxAge,
      maxEntries
    );
    res.json({ success: true, cacheStrategy });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/record-service-worker-metrics/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const metrics = await advancedServiceWorkerService.recordServiceWorkerMetrics(userId);
    res.json({ success: true, metrics });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/sync-pending-analytics/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await advancedServiceWorkerService.syncPendingAnalytics(userId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/cleanup-old-caches/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { maxAge } = req.body;

    const result = await advancedServiceWorkerService.cleanupOldCaches(userId, maxAge);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
