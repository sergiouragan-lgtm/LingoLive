import { Router, Request, Response } from 'express';
import { realtimeCollaborationCommunicationService } from '../services/realtime-collaboration-communication.service';

const router = Router();

router.post('/sessions/create', async (req: Request, res: Response) => {
  try {
    const { documentId, participants } = req.body;
    const session = await realtimeCollaborationCommunicationService.createCollaborativeSession(
      documentId,
      participants
    );
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/messages/send', async (req: Request, res: Response) => {
  try {
    const { sessionId, senderId, content, type } = req.body;
    const message = await realtimeCollaborationCommunicationService.sendRealtimeMessage(
      sessionId,
      senderId,
      content,
      type
    );
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/notifications/create', async (req: Request, res: Response) => {
  try {
    const { userId, type, content } = req.body;
    const notification = await realtimeCollaborationCommunicationService.createNotification(
      userId,
      type,
      content
    );
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/channels/create', async (req: Request, res: Response) => {
  try {
    const { name, type, members, description } = req.body;
    const channel = await realtimeCollaborationCommunicationService.createCommunicationChannel(
      name,
      type,
      members,
      description
    );
    res.status(201).json(channel);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/documents/sync', async (req: Request, res: Response) => {
  try {
    const { documentId, version, lastModifiedBy, conflictResolution } = req.body;
    const sync = await realtimeCollaborationCommunicationService.syncDocument(
      documentId,
      version,
      lastModifiedBy,
      conflictResolution
    );
    res.status(201).json(sync);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/presence/update', async (req: Request, res: Response) => {
  try {
    const { userId, documentId, cursorPosition, selectionStart, selectionEnd } = req.body;
    const presence = await realtimeCollaborationCommunicationService.updatePresence(
      userId,
      documentId,
      cursorPosition,
      selectionStart,
      selectionEnd
    );
    res.status(200).json(presence);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const metrics = await realtimeCollaborationCommunicationService.getCollaborationMetrics({ start: startDate, end: endDate });
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
