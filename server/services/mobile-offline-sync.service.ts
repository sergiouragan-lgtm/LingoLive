import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface OfflineContent {
  contentId: string;
  userId: string;
  type: 'lesson' | 'exercise' | 'quiz' | 'resource';
  title: string;
  content: string;
  downloadedAt: Date;
  expiresAt: Date;
  size: number; // bytes
  isAvailableOffline: boolean;
  lastAccessedAt: Date;
}

export interface SyncQueue {
  syncId: string;
  userId: string;
  operation: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  payload: Record<string, any>;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  createdAt: Date;
  syncedAt?: Date;
  errorMessage?: string;
}

export interface MobileAPIEndpoint {
  endpointId: string;
  path: string;
  method: string;
  responseFormat: 'json' | 'binary';
  cacheStrategy: 'no-cache' | 'cache-first' | 'network-first';
  cacheDuration: number; // seconds
  priority: 'critical' | 'high' | 'medium' | 'low';
  isOptimized: boolean;
}

export interface LocalStorageConfig {
  userId: string;
  maxStorageSize: number; // bytes
  usedStorage: number;
  contentInventory: OfflineContent[];
  syncQueue: SyncQueue[];
  lastCleanupAt: Date;
  cleanupInterval: number; // days
}

export interface PushNotificationPreference {
  userId: string;
  deviceId: string;
  isEnabled: boolean;
  notificationTypes: {
    lesson_reminder: boolean;
    achievement_unlocked: boolean;
    challenge_received: boolean;
    social_update: boolean;
    message_received: boolean;
  };
  quietHours: { start: string; end: string } | null;
  lastUpdatedAt: Date;
}

export interface SyncConflictResolution {
  conflictId: string;
  userId: string;
  entityId: string;
  serverVersion: Record<string, any>;
  clientVersion: Record<string, any>;
  resolutionStrategy: 'server-wins' | 'client-wins' | 'merge';
  resolvedVersion: Record<string, any>;
  resolvedAt: Date;
}

class MobileOfflineSyncService {
  private db: Firestore;

  constructor() {
    this.db = getFirestore();
  }

  public async downloadContentForOffline(
    userId: string,
    contentId: string,
    contentSize: number
  ): Promise<OfflineContent> {
    try {
      const configDoc = await this.db.collection('local_storage_configs').doc(userId).get();
      const config = configDoc.exists ? (configDoc.data() as LocalStorageConfig) : null;

      if (config && config.usedStorage + contentSize > config.maxStorageSize) {
        await this.cleanupOldContent(userId);
      }

      const offlineContent: OfflineContent = {
        contentId,
        userId,
        type: 'lesson',
        title: 'Downloaded Content',
        content: 'Content data',
        downloadedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        size: contentSize,
        isAvailableOffline: true,
        lastAccessedAt: new Date(),
      };

      await this.db.collection('offline_content').doc(contentId).set(offlineContent);

      if (config) {
        await this.db.collection('local_storage_configs').doc(userId).update({
          usedStorage: config.usedStorage + contentSize,
          contentInventory: [...(config.contentInventory || []), offlineContent],
        });
      }

      logSecurityEvent('CONTENT_DOWNLOADED_OFFLINE' as any, 'error' as any, 'OPERATION FAILED', { userId, contentId, size: contentSize });
      return offlineContent;
    } catch (error) {
      logSecurityEvent('OFFLINE_DOWNLOAD_FAILED' as any, 'error' as any, 'OPERATION FAILED', { userId, contentId, error: (error as Error).message });
      throw error;
    }
  }

  public async queueSyncOperation(
    userId: string,
    operation: string,
    entityType: string,
    entityId: string,
    payload: Record<string, any>
  ): Promise<SyncQueue> {
    try {
      const syncId = `sync-${userId}-${Date.now()}`;
      const syncOperation: SyncQueue = {
        syncId,
        userId,
        operation: operation as any,
        entityType,
        entityId,
        payload,
        status: 'pending',
        createdAt: new Date(),
      };

      await this.db.collection('sync_queue').doc(syncId).set(syncOperation);

      const configDoc = await this.db.collection('local_storage_configs').doc(userId).get();
      if (configDoc.exists) {
        const config = configDoc.data() as LocalStorageConfig;
        await this.db.collection('local_storage_configs').doc(userId).update({
          syncQueue: [...(config.syncQueue || []), syncOperation],
        });
      }

      logSecurityEvent('SYNC_OPERATION_QUEUED' as any, 'error' as any, 'OPERATION FAILED', { userId, entityType, operation });
      return syncOperation;
    } catch (error) {
      logSecurityEvent('SYNC_QUEUE_FAILED' as any, 'error' as any, 'OPERATION FAILED', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async processSyncQueue(userId: string): Promise<{ successCount: number; failureCount: number }> {
    try {
      const queueSnapshot = await this.db
        .collection('sync_queue')
        .where('userId', '==', userId)
        .where('status', '==', 'pending')
        .get();

      let successCount = 0;
      let failureCount = 0;

      for (const doc of queueSnapshot.docs) {
        const syncOp = doc.data() as SyncQueue;
        try {
          await this.db.collection('sync_queue').doc(doc.id).update({
            status: 'syncing',
          });

          // Simulate sync operation - in real implementation, execute the operation
          await this.executeSyncOperation(syncOp);

          await this.db.collection('sync_queue').doc(doc.id).update({
            status: 'completed',
            syncedAt: new Date(),
          });
          successCount += 1;
        } catch (error) {
          await this.db.collection('sync_queue').doc(doc.id).update({
            status: 'failed',
            errorMessage: (error as Error).message,
          });
          failureCount += 1;
        }
      }

      logSecurityEvent('SYNC_QUEUE_PROCESSED' as any, 'error' as any, 'OPERATION FAILED', { userId, successCount, failureCount });
      return { successCount, failureCount };
    } catch (error) {
      logSecurityEvent('SYNC_PROCESSING_FAILED' as any, 'error' as any, 'OPERATION FAILED', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async registerMobileEndpoint(
    path: string,
    method: string,
    cacheStrategy: string,
    cacheDuration: number
  ): Promise<MobileAPIEndpoint> {
    try {
      const endpointId = `endpoint-${path}-${method}`;
      const endpoint: MobileAPIEndpoint = {
        endpointId,
        path,
        method,
        responseFormat: 'json',
        cacheStrategy: cacheStrategy as any,
        cacheDuration,
        priority: 'high',
        isOptimized: true,
      };

      await this.db.collection('mobile_api_endpoints').doc(endpointId).set(endpoint);
      logSecurityEvent('MOBILE_ENDPOINT_REGISTERED' as any, 'error' as any, 'OPERATION FAILED', { endpointId, path });
      return endpoint;
    } catch (error) {
      logSecurityEvent('MOBILE_ENDPOINT_REGISTRATION_FAILED' as any, 'error' as any, 'OPERATION FAILED', { path, error: (error as Error).message });
      throw error;
    }
  }

  public async setPushNotificationPreferences(
    userId: string,
    deviceId: string,
    preferences: Record<string, boolean>
  ): Promise<PushNotificationPreference> {
    try {
      const prefDoc = await this.db.collection('push_preferences').doc(`${userId}-${deviceId}`).get();

      const pref: PushNotificationPreference = {
        userId,
        deviceId,
        isEnabled: true,
        notificationTypes: {
          lesson_reminder: preferences['lesson_reminder'] ?? true,
          achievement_unlocked: preferences['achievement_unlocked'] ?? true,
          challenge_received: preferences['challenge_received'] ?? true,
          social_update: preferences['social_update'] ?? true,
          message_received: preferences['message_received'] ?? true,
        },
        quietHours: preferences['quietHours'] ? { start: '22:00', end: '08:00' } : null,
        lastUpdatedAt: new Date(),
      };

      await this.db.collection('push_preferences').doc(`${userId}-${deviceId}`).set(pref);
      logSecurityEvent('PUSH_PREFERENCES_UPDATED' as any, 'error' as any, 'OPERATION FAILED', { userId, deviceId });
      return pref;
    } catch (error) {
      logSecurityEvent('PUSH_PREFERENCES_UPDATE_FAILED' as any, 'error' as any, 'OPERATION FAILED', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async getLocalStorageConfig(userId: string): Promise<LocalStorageConfig> {
    try {
      const configDoc = await this.db.collection('local_storage_configs').doc(userId).get();

      if (!configDoc.exists) {
        const newConfig: LocalStorageConfig = {
          userId,
          maxStorageSize: 500 * 1024 * 1024, // 500 MB
          usedStorage: 0,
          contentInventory: [],
          syncQueue: [],
          lastCleanupAt: new Date(),
          cleanupInterval: 7,
        };
        await this.db.collection('local_storage_configs').doc(userId).set(newConfig);
        return newConfig;
      }

      return configDoc.data() as LocalStorageConfig;
    } catch (error) {
      logSecurityEvent('STORAGE_CONFIG_FETCH_FAILED' as any, 'error' as any, 'OPERATION FAILED', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async detectSyncConflict(
    userId: string,
    entityId: string,
    clientVersion: Record<string, any>,
    serverVersion: Record<string, any>
  ): Promise<SyncConflictResolution | null> {
    try {
      const clientTimestamp = clientVersion.updatedAt || 0;
      const serverTimestamp = serverVersion.updatedAt || 0;

      if (JSON.stringify(clientVersion) === JSON.stringify(serverVersion)) {
        return null; // No conflict
      }

      const conflictId = `conflict-${userId}-${entityId}-${Date.now()}`;
      const resolution: SyncConflictResolution = {
        conflictId,
        userId,
        entityId,
        serverVersion,
        clientVersion,
        resolutionStrategy: serverTimestamp > clientTimestamp ? 'server-wins' : 'client-wins',
        resolvedVersion: serverTimestamp > clientTimestamp ? serverVersion : clientVersion,
        resolvedAt: new Date(),
      };

      await this.db.collection('sync_conflicts').doc(conflictId).set(resolution);
      logSecurityEvent('SYNC_CONFLICT_DETECTED' as any, 'error' as any, 'OPERATION FAILED', { userId, entityId, conflictId });
      return resolution;
    } catch (error) {
      logSecurityEvent('CONFLICT_DETECTION_FAILED' as any, 'error' as any, 'OPERATION FAILED', { userId, error: (error as Error).message });
      throw error;
    }
  }

  private async cleanupOldContent(userId: string): Promise<void> {
    try {
      const inventorySnapshot = await this.db
        .collection('offline_content')
        .where('userId', '==', userId)
        .orderBy('lastAccessedAt', 'asc')
        .limit(5)
        .get();

      for (const doc of inventorySnapshot.docs) {
        const content = doc.data() as OfflineContent;
        await this.db.collection('offline_content').doc(doc.id).delete();

        const configDoc = await this.db.collection('local_storage_configs').doc(userId).get();
        if (configDoc.exists) {
          const config = configDoc.data() as LocalStorageConfig;
          await this.db.collection('local_storage_configs').doc(userId).update({
            usedStorage: Math.max(0, config.usedStorage - content.size),
            lastCleanupAt: new Date(),
          });
        }
      }

      logSecurityEvent('OFFLINE_CONTENT_CLEANUP' as any, 'error' as any, 'OPERATION FAILED', { userId });
    } catch (error) {
      logSecurityEvent('CLEANUP_FAILED' as any, 'error' as any, 'OPERATION FAILED', { userId, error: (error as Error).message });
    }
  }

  private async executeSyncOperation(syncOp: SyncQueue): Promise<void> {
    // Implementation would vary based on entityType and operation
    // This is a placeholder
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

export const mobileOfflineSyncService = new MobileOfflineSyncService();
