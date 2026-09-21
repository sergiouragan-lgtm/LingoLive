import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { safeAddDoc, safeSetDoc } from '../services/firestoreSafe.service';
import { logSecurityEvent } from '../services/security.event.logger';

const router = Router();

/**
 * @swagger
 * /analytics/performance:
 *   post:
 *     summary: Report performance metrics
 *     description: Submit Web Vitals and performance metrics for monitoring
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metrics:
 *                 type: object
 *                 description: Performance metrics (LCP, FID, CLS, etc.)
 *               timestamp:
 *                 type: number
 *               userAgent:
 *                 type: string
 *               url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Metrics recorded successfully
 *       400:
 *         description: Invalid metrics format
 *       401:
 *         description: Unauthorized
 */
router.post('/performance', async (req: any, res) => {
  try {
    const { metrics, timestamp, userAgent, url } = req.body;

    // Validate input
    if (!metrics || typeof metrics !== 'object') {
      return res.status(400).json({ error: 'Invalid metrics format' });
    }

    const userId = req.user?.uid || 'anonymous';
    const metricEntry = {
      userId,
      metrics,
      timestamp: timestamp || Date.now(),
      userAgent,
      url,
      recordedAt: new Date().toISOString(),
    };

    // Store performance metrics
    await safeAddDoc('analytics_performance', {
      ...metricEntry,
      id: `perf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    });

    // Alert on poor performance
    if (metrics.LCP && metrics.LCP > 4000) {
      logSecurityEvent(
        'PERFORMANCE_ALERT' as any,
        'warning' as any,
        `Poor LCP detected: ${metrics.LCP}ms for user ${userId}`,
        { userId },
        { metrics }
      );
    }

    res.json({ success: true, message: 'Performance metrics recorded' });
  } catch (error: any) {
    console.error('Error recording performance metrics:', error);
    res.status(500).json({ error: 'Failed to record metrics' });
  }
});

/**
 * @swagger
 * /analytics/errors:
 *   post:
 *     summary: Report application error
 *     description: Submit error report with context and breadcrumbs
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               message:
 *                 type: string
 *               severity:
 *                 type: string
 *               stack:
 *                 type: string
 *     responses:
 *       200:
 *         description: Error recorded successfully
 *       400:
 *         description: Invalid error report
 *       401:
 *         description: Unauthorized
 */
router.post('/errors', async (req: any, res) => {
  try {
    const { id, message, severity, stack, context, breadcrumbs } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Error message is required' });
    }

    const errorEntry = {
      id,
      message,
      severity,
      stack,
      context: {
        ...context,
        userId: req.user?.uid || 'anonymous',
      },
      breadcrumbs,
      recordedAt: new Date().toISOString(),
    };

    // Store error report
    await safeAddDoc('analytics_errors', errorEntry);

    // Log critical errors
    if (severity === 'critical') {
      logSecurityEvent(
        'CRITICAL_ERROR' as any,
        'critical' as any,
        `Critical error: ${message}`,
        { userId: req.user?.uid || 'anonymous' },
        { error: errorEntry }
      );
    }

    res.json({ success: true, errorId: id });
  } catch (error: any) {
    console.error('Error recording error report:', error);
    res.status(500).json({ error: 'Failed to record error' });
  }
});

/**
 * @swagger
 * /analytics/errors/batch:
 *   post:
 *     summary: Report batch of errors
 *     description: Submit multiple error reports at once
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               errors:
 *                 type: array
 *     responses:
 *       200:
 *         description: Errors recorded successfully
 */
router.post('/errors/batch', async (req: any, res) => {
  try {
    const { errors } = req.body;

    if (!Array.isArray(errors)) {
      return res.status(400).json({ error: 'Errors must be an array' });
    }

    const processedErrors = errors.map((error: any) => ({
      ...error,
      context: {
        ...error.context,
        userId: req.user?.uid || 'anonymous',
      },
      recordedAt: new Date().toISOString(),
    }));

    // Store errors in batch
    for (const error of processedErrors) {
      await safeAddDoc('analytics_errors', error);
    }

    res.json({ success: true, count: errors.length });
  } catch (error: any) {
    console.error('Error recording error batch:', error);
    res.status(500).json({ error: 'Failed to record errors' });
  }
});

/**
 * @swagger
 * /analytics/events:
 *   post:
 *     summary: Report analytics events
 *     description: Submit batch of user interaction events
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               events:
 *                 type: array
 *               session:
 *                 type: object
 */
router.post('/events', async (req: any, res) => {
  try {
    const { events, session, timestamp } = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Events must be an array' });
    }

    const userId = req.user?.uid || 'anonymous';
    const processedEvents = events.map((event: any) => ({
      ...event,
      userId,
      recordedAt: new Date().toISOString(),
    }));

    // Store events
    for (const event of processedEvents) {
      await safeAddDoc('analytics_events', event);
    }

    // Update session info if provided
    if (session && session.sessionId) {
      await safeSetDoc('analytics_sessions', session.sessionId, {
        ...session,
        userId,
        lastUpdated: new Date().toISOString(),
      }, true);
    }

    res.json({ success: true, eventsProcessed: events.length });
  } catch (error: any) {
    console.error('Error recording analytics events:', error);
    res.status(500).json({ error: 'Failed to record events' });
  }
});

/**
 * @swagger
 * /analytics/events/batch:
 *   post:
 *     summary: Report events via Beacon API
 *     description: Reliable event submission for data that should be sent before page unload
 *     tags:
 *       - Analytics
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 */
router.post('/events/batch', async (req: any, res) => {
  try {
    const { events, session } = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Events must be an array' });
    }

    // Process events in background (don't wait for response)
    const userId = req.user?.uid || 'anonymous';
    const processedEvents = events.map((event: any) => ({
      ...event,
      userId,
      recordedAt: new Date().toISOString(),
    }));

    for (const event of processedEvents) {
      safeAddDoc('analytics_events', event).catch((err) => {
        console.error('Failed to record event:', err);
      });
    }

    // Always respond immediately for Beacon API
    res.json({ received: true });
  } catch (error: any) {
    console.error('Error processing beacon events:', error);
    res.json({ received: true }); // Still respond OK to Beacon
  }
});

export default router;
