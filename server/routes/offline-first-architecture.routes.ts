import { Router, Request, Response, NextFunction } from 'express';
import { offlineFirstArchitectureService } from '../services/offline-first-architecture.service';

const router = Router();

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

router.post('/initialize-offline-state/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { dataTypes } = req.body;

    const states = await offlineFirstArchitectureService.initializeOfflineState(userId, dataTypes);
    res.json({ success: true, states });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/queue-sync-operation/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { operation, collection, documentId, data, priority } = req.body;

    const syncOp = await offlineFirstArchitectureService.queueSyncOperation(
      userId,
      operation,
      collection,
      documentId,
      data,
      priority
    );
    res.json({ success: true, operation: syncOp });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/resolve-sync-conflict/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { collection, documentId, localVersion, remoteVersion, strategy } = req.body;

    const resolution = await offlineFirstArchitectureService.resolveSyncConflict(
      userId,
      collection,
      documentId,
      localVersion,
      remoteVersion,
      strategy
    );
    res.json({ success: true, resolution });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/update-data-cache/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { collection, entryCount, dataSize } = req.body;

    const cache = await offlineFirstArchitectureService.updateDataCache(userId, collection, entryCount, dataSize);
    res.json({ success: true, cache });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/record-sync-metrics/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { operations } = req.body;

    const metrics = await offlineFirstArchitectureService.recordSyncMetrics(userId, operations);
    res.json({ success: true, metrics });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/offline-readiness/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const readiness = await offlineFirstArchitectureService.getOfflineReadiness(userId);
    res.json({ success: true, readiness });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
