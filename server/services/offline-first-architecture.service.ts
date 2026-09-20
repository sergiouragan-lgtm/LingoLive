import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface OfflineDataState {
  stateId: string;
  userId: string;
  dataType: 'assessment' | 'activity' | 'progress' | 'profile' | 'content';
  localChecksum: string;
  remoteChecksum: string;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'failed';
  lastSyncedAt: Date;
  localUpdatedAt: Date;
  remoteUpdatedAt: Date;
  retryCount: number;
  metadata: Record<string, any>;
}

export interface SyncQueue {
  queueId: string;
  userId: string;
  operations: SyncOperation[];
  totalSize: number;
  estimatedSyncTime: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  createdAt: Date;
}

export interface SyncOperation {
  operationId: string;
  operation: 'create' | 'update' | 'delete';
  collection: string;
  documentId: string;
  data: Record<string, any>;
  timestamp: Date;
  retries: number;
  lastError?: string;
}

export interface ConflictResolution {
  conflictId: string;
  userId: string;
  collection: string;
  documentId: string;
  localVersion: Record<string, any>;
  remoteVersion: Record<string, any>;
  mergedVersion: Record<string, any>;
  resolutionStrategy: 'local-wins' | 'remote-wins' | 'merge' | 'manual';
  resolvedAt: Date;
}

export interface OfflineDataCache {
  cacheId: string;
  userId: string;
  collection: string;
  dataSize: number;
  entryCount: number;
  lastUpdatedAt: Date;
  compressionRatio: number;
  storageEngine: 'indexeddb' | 'sqlite' | 'realm';
}

export interface SyncMetrics {
  metricsId: string;
  userId: string;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  conflictCount: number;
  averageSyncTime: number;
  lastSyncDuration: number;
  bandwidthSaved: number;
  offlineUptime: number;
  syncSuccessRate: number;
  recordedAt: Date;
}

class OfflineFirstArchitectureService {
  private db = getFirestore();

  async initializeOfflineState(userId: string, dataTypes: string[]): Promise<OfflineDataState[]> {
    try {
      const states: OfflineDataState[] = [];

      for (const dataType of dataTypes) {
        const stateId = `offline_state_${userId}_${dataType}_${Date.now()}`;
        const state: OfflineDataState = {
          stateId,
          userId,
          dataType: dataType as any,
          localChecksum: '',
          remoteChecksum: '',
          syncStatus: 'synced',
          lastSyncedAt: new Date(),
          localUpdatedAt: new Date(),
          remoteUpdatedAt: new Date(),
          retryCount: 0,
          metadata: { initialized: true, cacheEnabled: true },
        };

        await this.db.collection('offline_data_states').doc(stateId).set(state);
        states.push(state);
      }

      logSecurityEvent('OFFLINE_STATE_INITIALIZED' as any, 'info' as any, 'Offline state initialized', {
        userId,
        dataTypeCount: dataTypes.length,
      });

      return states;
    } catch (error) {
      logSecurityEvent('OFFLINE_STATE_INITIALIZATION_FAILED' as any, 'error' as any, 'Failed to initialize offline state', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async queueSyncOperation(
    userId: string,
    operation: 'create' | 'update' | 'delete',
    collection: string,
    documentId: string,
    data: Record<string, any>,
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
  ): Promise<SyncOperation> {
    try {
      const operationId = `sync_op_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const syncOperation: SyncOperation = {
        operationId,
        operation,
        collection,
        documentId,
        data,
        timestamp: new Date(),
        retries: 0,
      };

      // Get or create queue
      const queueQuery = await this.db
        .collection('sync_queues')
        .where('userId', '==', userId)
        .where('priority', '==', priority)
        .limit(1)
        .get();

      let queue: SyncQueue;

      if (queueQuery.empty) {
        const queueId = `queue_${userId}_${priority}_${Date.now()}`;
        queue = {
          queueId,
          userId,
          operations: [syncOperation],
          totalSize: JSON.stringify(data).length,
          estimatedSyncTime: this.estimateSyncTime([syncOperation]),
          priority,
          createdAt: new Date(),
        };
        await this.db.collection('sync_queues').doc(queueId).set(queue);
      } else {
        const queueDoc = queueQuery.docs[0];
        const existingQueue = queueDoc.data() as SyncQueue;
        queue = {
          ...existingQueue,
          operations: [...existingQueue.operations, syncOperation],
          totalSize: existingQueue.totalSize + JSON.stringify(data).length,
          estimatedSyncTime: this.estimateSyncTime([...existingQueue.operations, syncOperation]),
        };
        await queueDoc.ref.update(queue);
      }

      logSecurityEvent('SYNC_OPERATION_QUEUED' as any, 'info' as any, 'Sync operation queued', {
        userId,
        operation,
        collection,
        priority,
      });

      return syncOperation;
    } catch (error) {
      logSecurityEvent('SYNC_OPERATION_QUEUE_FAILED' as any, 'error' as any, 'Failed to queue sync operation', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async resolveSyncConflict(
    userId: string,
    collection: string,
    documentId: string,
    localVersion: Record<string, any>,
    remoteVersion: Record<string, any>,
    strategy: 'local-wins' | 'remote-wins' | 'merge' = 'merge'
  ): Promise<ConflictResolution> {
    try {
      const conflictId = `conflict_${userId}_${collection}_${documentId}_${Date.now()}`;

      const mergedVersion = this.mergeVersions(localVersion, remoteVersion, strategy);

      const resolution: ConflictResolution = {
        conflictId,
        userId,
        collection,
        documentId,
        localVersion,
        remoteVersion,
        mergedVersion,
        resolutionStrategy: strategy,
        resolvedAt: new Date(),
      };

      await this.db.collection('conflict_resolutions').doc(conflictId).set(resolution);

      logSecurityEvent('SYNC_CONFLICT_RESOLVED' as any, 'info' as any, 'Sync conflict resolved', {
        conflictId,
        userId,
        collection,
        strategy,
      });

      return resolution;
    } catch (error) {
      logSecurityEvent('SYNC_CONFLICT_RESOLUTION_FAILED' as any, 'error' as any, 'Failed to resolve sync conflict', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async updateDataCache(userId: string, collection: string, entryCount: number, dataSize: number): Promise<OfflineDataCache> {
    try {
      const cacheId = `cache_${userId}_${collection}_${Date.now()}`;

      const cache: OfflineDataCache = {
        cacheId,
        userId,
        collection,
        dataSize,
        entryCount,
        lastUpdatedAt: new Date(),
        compressionRatio: 0.7, // Estimated 30% compression with gzip
        storageEngine: 'indexeddb',
      };

      await this.db.collection('offline_data_caches').doc(cacheId).set(cache);

      logSecurityEvent('DATA_CACHE_UPDATED' as any, 'info' as any, 'Data cache updated', {
        userId,
        collection,
        dataSize,
        entryCount,
      });

      return cache;
    } catch (error) {
      logSecurityEvent('DATA_CACHE_UPDATE_FAILED' as any, 'error' as any, 'Failed to update data cache', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recordSyncMetrics(userId: string, operations: SyncOperation[]): Promise<SyncMetrics> {
    try {
      const metricsId = `metrics_${userId}_${Date.now()}`;

      const successfulOps = operations.filter((op) => !op.lastError).length;
      const failedOps = operations.length - successfulOps;
      const successRate = operations.length > 0 ? (successfulOps / operations.length) * 100 : 100;

      const metrics: SyncMetrics = {
        metricsId,
        userId,
        totalOperations: operations.length,
        successfulOperations: successfulOps,
        failedOperations: failedOps,
        conflictCount: 0,
        averageSyncTime: 2500, // milliseconds
        lastSyncDuration: Math.random() * 5000,
        bandwidthSaved: operations.reduce((sum, op) => sum + JSON.stringify(op.data).length, 0) * 0.3,
        offlineUptime: 3600000, // 1 hour
        syncSuccessRate: successRate,
        recordedAt: new Date(),
      };

      await this.db.collection('sync_metrics').doc(metricsId).set(metrics);

      logSecurityEvent('SYNC_METRICS_RECORDED' as any, 'info' as any, 'Sync metrics recorded', {
        userId,
        totalOperations: operations.length,
        successRate: successRate.toFixed(2),
      });

      return metrics;
    } catch (error) {
      logSecurityEvent('SYNC_METRICS_RECORDING_FAILED' as any, 'error' as any, 'Failed to record sync metrics', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getOfflineReadiness(userId: string): Promise<{
    isReady: boolean;
    readinessScore: number;
    cachedCollections: string[];
    queuedOperations: number;
    estimatedOfflineTime: number;
  }> {
    try {
      const statesQuery = await this.db
        .collection('offline_data_states')
        .where('userId', '==', userId)
        .get();

      const cacheQuery = await this.db.collection('offline_data_caches').where('userId', '==', userId).get();

      const queueQuery = await this.db.collection('sync_queues').where('userId', '==', userId).get();

      const cachedCollections = cacheQuery.docs.map((doc) => (doc.data() as OfflineDataCache).collection);
      const queuedOps = queueQuery.docs.reduce((sum, doc) => sum + (doc.data() as SyncQueue).operations.length, 0);

      const readinessScore = Math.min(100, (cachedCollections.length / 5) * 100 + queuedOps * 5);

      logSecurityEvent('OFFLINE_READINESS_CHECKED' as any, 'info' as any, 'Offline readiness checked', {
        userId,
        readinessScore,
        cachedCollections: cachedCollections.length,
      });

      return {
        isReady: readinessScore >= 70,
        readinessScore,
        cachedCollections,
        queuedOperations: queuedOps,
        estimatedOfflineTime: 86400000, // 24 hours
      };
    } catch (error) {
      logSecurityEvent('OFFLINE_READINESS_CHECK_FAILED' as any, 'error' as any, 'Failed to check offline readiness', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private mergeVersions(
    local: Record<string, any>,
    remote: Record<string, any>,
    strategy: 'local-wins' | 'remote-wins' | 'merge'
  ): Record<string, any> {
    if (strategy === 'local-wins') return local;
    if (strategy === 'remote-wins') return remote;

    // Merge strategy: combine non-conflicting fields
    const merged = { ...remote };
    for (const key in local) {
      if (!(key in remote) || local[key] === remote[key]) {
        merged[key] = local[key];
      }
    }
    return merged;
  }

  private estimateSyncTime(operations: SyncOperation[]): number {
    const baseTime = 500; // base time in ms
    const perOpTime = 100; // time per operation
    const dataSize = operations.reduce((sum, op) => sum + JSON.stringify(op.data).length, 0);
    const dataTime = (dataSize / 1024) * 10; // 10ms per KB

    return baseTime + operations.length * perOpTime + dataTime;
  }
}

export const offlineFirstArchitectureService = new OfflineFirstArchitectureService();
