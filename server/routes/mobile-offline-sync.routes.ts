import { Router } from 'express';
import { mobileOfflineSyncService } from '../services/mobile-offline-sync.service';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/content/download', requireAuth, async (req, res) => {
  try {
    const { userId, contentId, contentSize } = req.body;
    const offlineContent = await mobileOfflineSyncService.downloadContentForOffline(
      userId,
      contentId,
      contentSize
    );
    res.json(offlineContent);
  } catch (error: any) {
    console.error('Error downloading content:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/sync-queue/add', requireAuth, async (req, res) => {
  try {
    const { userId, operation, entityType, entityId, payload } = req.body;
    const syncOp = await mobileOfflineSyncService.queueSyncOperation(
      userId,
      operation,
      entityType,
      entityId,
      payload
    );
    res.json(syncOp);
  } catch (error: any) {
    console.error('Error queueing sync operation:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/sync-queue/process/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await mobileOfflineSyncService.processSyncQueue(userId);
    res.json(result);
  } catch (error: any) {
    console.error('Error processing sync queue:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/endpoint/register', requireAuth, async (req, res) => {
  try {
    const { path, method, cacheStrategy, cacheDuration } = req.body;
    const endpoint = await mobileOfflineSyncService.registerMobileEndpoint(
      path,
      method,
      cacheStrategy,
      cacheDuration
    );
    res.json(endpoint);
  } catch (error: any) {
    console.error('Error registering mobile endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/push-preferences/set', requireAuth, async (req, res) => {
  try {
    const { userId, deviceId, preferences } = req.body;
    const pref = await mobileOfflineSyncService.setPushNotificationPreferences(
      userId,
      deviceId,
      preferences
    );
    res.json(pref);
  } catch (error: any) {
    console.error('Error setting push preferences:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/storage-config/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const config = await mobileOfflineSyncService.getLocalStorageConfig(userId);
    res.json(config);
  } catch (error: any) {
    console.error('Error getting storage config:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/conflict/detect', requireAuth, async (req, res) => {
  try {
    const { userId, entityId, clientVersion, serverVersion } = req.body;
    const resolution = await mobileOfflineSyncService.detectSyncConflict(
      userId,
      entityId,
      clientVersion,
      serverVersion
    );
    res.json(resolution || { conflict: false });
  } catch (error: any) {
    console.error('Error detecting sync conflict:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
