import { Router, Request, Response } from 'express';
import { securityEventManagementService } from '../services/security-event-management.service';

const router = Router();

router.post('/events/create', async (req: Request, res: Response) => {
  try {
    const { eventType, severity, source, description, metadata, userId, ipAddress } = req.body;
    const event = await securityEventManagementService.createSecurityEvent(
      eventType,
      severity,
      source,
      description,
      metadata,
      userId,
      ipAddress
    );
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/incidents/initiate', async (req: Request, res: Response) => {
  try {
    const { eventId, severity, assignedTo } = req.body;
    const response = await securityEventManagementService.initiateIncidentResponse(
      eventId,
      severity,
      assignedTo
    );
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/incidents/:responseId/actions', async (req: Request, res: Response) => {
  try {
    const { responseId } = req.params;
    const { action, assignedTo, dueDate } = req.body;
    const responseAction = await securityEventManagementService.addResponseAction(
      responseId,
      action,
      assignedTo,
      new Date(dueDate)
    );
    res.status(201).json(responseAction);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/incidents/:responseId/escalate', async (req: Request, res: Response) => {
  try {
    const { responseId } = req.params;
    const { escalationLevel, escalatedTo, reason } = req.body;
    const escalation = await securityEventManagementService.escalateIncident(
      responseId,
      escalationLevel,
      escalatedTo,
      reason
    );
    res.status(201).json(escalation);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/incidents/:responseId/resolve', async (req: Request, res: Response) => {
  try {
    const { responseId } = req.params;
    const resolved = await securityEventManagementService.resolveIncident(responseId);
    res.status(200).json(resolved);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/alerts/trigger', async (req: Request, res: Response) => {
  try {
    const { eventType, severity, message, recipients, channels } = req.body;
    const alert = await securityEventManagementService.triggerSecurityAlert(
      eventType,
      severity,
      message,
      recipients,
      channels
    );
    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const metrics = await securityEventManagementService.getIncidentMetrics({ start: startDate, end: endDate });
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
