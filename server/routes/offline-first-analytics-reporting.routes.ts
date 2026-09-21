import { Router, Request, Response, NextFunction } from 'express';
import { offlineFirstAnalyticsReportingService } from '../services/offline-first-analytics-reporting.service';

const router = Router();

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

router.post('/record-analytics-event/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { eventType, eventName, eventData, deviceType, networkStatus } = req.body;

    const event = await offlineFirstAnalyticsReportingService.recordOfflineAnalyticsEvent(
      userId,
      eventType,
      eventName,
      eventData,
      deviceType,
      networkStatus
    );
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/generate-offline-report/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reportType, periodStart, periodEnd } = req.body;

    const report = await offlineFirstAnalyticsReportingService.generateOfflineAnalyticsReport(
      userId,
      reportType,
      new Date(periodStart),
      new Date(periodEnd)
    );
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/create-retention-policy/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { retentionDays, archiveAfterDays, deletionStrategy, eventTypes } = req.body;

    const policy = await offlineFirstAnalyticsReportingService.createDataRetentionPolicy(
      userId,
      retentionDays,
      archiveAfterDays,
      deletionStrategy,
      eventTypes
    );
    res.json({ success: true, policy });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/detect-usage-patterns/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const patterns = await offlineFirstAnalyticsReportingService.detectOfflineUsagePatterns(userId);
    res.json({ success: true, patterns });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/schedule-offline-report/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reportType, generationTime, recipients, exportFormat } = req.body;

    const schedule = await offlineFirstAnalyticsReportingService.scheduleOfflineReport(
      userId,
      reportType,
      generationTime,
      recipients,
      exportFormat
    );
    res.json({ success: true, schedule });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/sync-offline-analytics/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await offlineFirstAnalyticsReportingService.syncOfflineAnalytics(userId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
