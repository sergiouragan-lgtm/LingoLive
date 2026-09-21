import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { alertingNotificationsService } from '../services/alerting-notifications.service';

const router = Router();

router.post('/rules', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, condition, threshold, severity } = req.body;
    const rule = await alertingNotificationsService.createAlertRule(
      name,
      condition,
      threshold,
      severity
    );
    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/notifications', requireAuth, async (req: Request, res: Response) => {
  try {
    const { ruleId, channel, recipient, message } = req.body;
    const notification = await alertingNotificationsService.sendNotification(
      ruleId,
      channel,
      recipient,
      message
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/escalations', requireAuth, async (req: Request, res: Response) => {
  try {
    const { ruleId, level, delayMinutes, recipients, notificationChannels, maxLevel } = req.body;
    const escalation = await alertingNotificationsService.configureEscalation(
      ruleId,
      level,
      delayMinutes,
      recipients,
      notificationChannels,
      maxLevel
    );
    res.json(escalation);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/suppressions', requireAuth, async (req: Request, res: Response) => {
  try {
    const { ruleId, startTime, endTime, reason, suppressedBy } = req.body;
    const suppression = await alertingNotificationsService.suppressAlert(
      ruleId,
      new Date(startTime),
      new Date(endTime),
      reason,
      suppressedBy
    );
    res.json(suppression);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/incidents', requireAuth, async (req: Request, res: Response) => {
  try {
    const { ruleId, severity, message, metadata } = req.body;
    const incident = await alertingNotificationsService.createIncident(
      ruleId,
      severity,
      message,
      metadata
    );
    res.json(incident);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/channels', requireAuth, async (req: Request, res: Response) => {
  try {
    const { type, config } = req.body;
    const channel = await alertingNotificationsService.configureNotificationChannel(
      type,
      config
    );
    res.json(channel);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/incidents/:incidentId/acknowledge', requireAuth, async (req: Request, res: Response) => {
  try {
    const { incidentId } = req.params;
    const incident = await alertingNotificationsService.acknowledgeIncident(incidentId);
    res.json(incident);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/incidents/:incidentId/resolve', requireAuth, async (req: Request, res: Response) => {
  try {
    const { incidentId } = req.params;
    const incident = await alertingNotificationsService.resolveIncident(incidentId);
    res.json(incident);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/statistics', requireAuth, async (req: Request, res: Response) => {
  try {
    const { startTime, endTime } = req.body;
    const statistics = await alertingNotificationsService.getAlertStatistics(
      new Date(startTime),
      new Date(endTime)
    );
    res.json(statistics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
