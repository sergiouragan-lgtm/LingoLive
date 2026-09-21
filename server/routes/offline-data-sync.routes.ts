import { Router, Request, Response, NextFunction } from 'express';
import { offlineDataSyncService } from '../services/offline-data-sync.service';

const router = Router();

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

router.post('/initiate-sync-session/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { collections } = req.body;

    const session = await offlineDataSyncService.initiateSyncSession(userId, collections);
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/detect-conflicts/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { collection } = req.body;

    const conflicts = await offlineDataSyncService.detectConflicts(userId, collection);
    res.json({ success: true, conflicts });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/perform-delta-sync/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { collection, checkpoint } = req.body;

    const deltaSync = await offlineDataSyncService.performDeltaSync(userId, collection, new Date(checkpoint));
    res.json({ success: true, deltaSync });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/resolve-conflict/:conflictId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { conflictId } = req.params;
    const { userId, resolutionStrategy, mergeRules } = req.body;

    const conflict = await offlineDataSyncService.resolveConflict(
      conflictId,
      userId,
      resolutionStrategy,
      mergeRules
    );
    res.json({ success: true, conflict });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/define-conflict-resolution-policy/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { collection, conflictType, strategy } = req.body;

    const policy = await offlineDataSyncService.defineConflictResolutionPolicy(
      userId,
      collection,
      conflictType,
      strategy
    );
    res.json({ success: true, policy });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/record-sync-error/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { collection, documentId, operation, errorType, errorMessage } = req.body;

    const error = await offlineDataSyncService.recordSyncError(
      userId,
      collection,
      documentId,
      operation,
      errorType,
      errorMessage
    );
    res.json({ success: true, error });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/record-sync-checkpoint/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { collection, lastDocumentId } = req.body;

    const checkpoint = await offlineDataSyncService.recordSyncCheckpoint(userId, collection, lastDocumentId);
    res.json({ success: true, checkpoint });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
