import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface SyncSession {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'failed' | 'paused';
  operationCount: number;
  successCount: number;
  failureCount: number;
  conflictCount: number;
  estimatedRemainingTime: number;
  bandwidthUsed: number;
}

export interface DataConflict {
  conflictId: string;
  userId: string;
  collection: string;
  documentId: string;
  localTimestamp: Date;
  remoteTimestamp: Date;
  localData: Record<string, any>;
  remoteData: Record<string, any>;
  changedFields: string[];
  conflictType: 'update-update' | 'update-delete' | 'delete-update';
  status: 'unresolved' | 'resolved' | 'deferred';
  resolutionMethod?: 'auto-merge' | 'last-write-wins' | 'manual';
  detectedAt: Date;
}

export interface DeltaSyncData {
  deltaSyncId: string;
  userId: string;
  collection: string;
  checkpoint: Date;
  changes: DeltaChange[];
  compressionRatio: number;
  totalSize: number;
  changeCount: number;
  createdAt: Date;
}

export interface DeltaChange {
  changeId: string;
  operation: 'create' | 'update' | 'delete';
  documentId: string;
  data: Record<string, any>;
  timestamp: Date;
  fields?: string[]; // for partial updates
}

export interface ConflictResolutionPolicy {
  policyId: string;
  userId: string;
  collection: string;
  conflictType: 'update-update' | 'update-delete' | 'delete-update' | 'all';
  resolutionStrategy: 'last-write-wins' | 'auto-merge' | 'local-wins' | 'remote-wins' | 'manual';
  fieldMergeRules: Record<string, 'local' | 'remote' | 'merge'>;
  priority: number;
  createdAt: Date;
}

export interface SyncCheckpoint {
  checkpointId: string;
  userId: string;
  collection: string;
  lastSyncTime: Date;
  lastDocumentId: string;
  batchSize: number;
  checksum: string;
  metadata: Record<string, any>;
}

export interface SyncError {
  errorId: string;
  userId: string;
  collection: string;
  documentId: string;
  operation: 'create' | 'update' | 'delete';
  errorType: 'network' | 'validation' | 'conflict' | 'permission' | 'timeout';
  errorMessage: string;
  attemptCount: number;
  maxAttempts: number;
  nextRetryTime: Date;
  createdAt: Date;
}

class OfflineDataSyncService {
  private db = getFirestore();

  async initiateSyncSession(userId: string, collections: string[]): Promise<SyncSession> {
    try {
      const sessionId = `sync_session_${userId}_${Date.now()}`;

      const session: SyncSession = {
        sessionId,
        userId,
        startTime: new Date(),
        status: 'active',
        operationCount: 0,
        successCount: 0,
        failureCount: 0,
        conflictCount: 0,
        estimatedRemainingTime: 0,
        bandwidthUsed: 0,
      };

      await this.db.collection('sync_sessions').doc(sessionId).set(session);

      logSecurityEvent('SYNC_SESSION_INITIATED' as any, 'info' as any, 'Sync session initiated', {
        sessionId,
        userId,
        collectionCount: collections.length,
      });

      return session;
    } catch (error) {
      logSecurityEvent('SYNC_SESSION_INITIATION_FAILED' as any, 'error' as any, 'Failed to initiate sync session', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async detectConflicts(userId: string, collection: string): Promise<DataConflict[]> {
    try {
      const conflicts: DataConflict[] = [];

      const checkpointQuery = await this.db
        .collection('sync_checkpoints')
        .where('userId', '==', userId)
        .where('collection', '==', collection)
        .orderBy('lastSyncTime', 'desc')
        .limit(1)
        .get();

      const checkpoint = checkpointQuery.docs[0]?.data() as SyncCheckpoint | undefined;
      const lastSyncTime = checkpoint?.lastSyncTime || new Date(0);

      const localChangesQuery = await this.db
        .collection(`offline_changes_${userId}`)
        .where('collection', '==', collection)
        .where('timestamp', '>', lastSyncTime)
        .get();

      const localChanges = localChangesQuery.docs.map((doc) => doc.data());

      // Simulate conflict detection (in real scenario, compare with server versions)
      for (const localChange of localChanges) {
        if (Math.random() > 0.9) {
          // 10% conflict rate simulation
          const conflictId = `conflict_${userId}_${collection}_${Date.now()}`;
          const conflict: DataConflict = {
            conflictId,
            userId,
            collection,
            documentId: localChange.documentId,
            localTimestamp: localChange.timestamp,
            remoteTimestamp: new Date(localChange.timestamp.getTime() + Math.random() * 10000),
            localData: localChange.data,
            remoteData: { ...localChange.data, modified: true },
            changedFields: Object.keys(localChange.data),
            conflictType: 'update-update',
            status: 'unresolved',
            detectedAt: new Date(),
          };

          conflicts.push(conflict);
          await this.db.collection('data_conflicts').doc(conflictId).set(conflict);
        }
      }

      logSecurityEvent('CONFLICTS_DETECTED' as any, 'info' as any, 'Conflicts detected', {
        userId,
        collection,
        conflictCount: conflicts.length,
      });

      return conflicts;
    } catch (error) {
      logSecurityEvent('CONFLICT_DETECTION_FAILED' as any, 'error' as any, 'Failed to detect conflicts', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async performDeltaSync(userId: string, collection: string, checkpoint: Date): Promise<DeltaSyncData> {
    try {
      const deltaSyncId = `delta_sync_${userId}_${collection}_${Date.now()}`;

      const changesQuery = await this.db
        .collection(`offline_changes_${userId}`)
        .where('collection', '==', collection)
        .where('timestamp', '>', checkpoint)
        .orderBy('timestamp', 'asc')
        .get();

      const changes: DeltaChange[] = changesQuery.docs.map((doc) => {
        const data = doc.data();
        return {
          changeId: `change_${Date.now()}`,
          operation: data.operation,
          documentId: data.documentId,
          data: data.data,
          timestamp: data.timestamp,
          fields: Object.keys(data.data),
        };
      });

      const totalSize = changes.reduce((sum, change) => sum + JSON.stringify(change).length, 0);
      const originalSize = totalSize / 0.7; // Assume 30% compression

      const deltaSync: DeltaSyncData = {
        deltaSyncId,
        userId,
        collection,
        checkpoint,
        changes,
        compressionRatio: totalSize / originalSize,
        totalSize,
        changeCount: changes.length,
        createdAt: new Date(),
      };

      await this.db.collection('delta_sync_data').doc(deltaSyncId).set(deltaSync);

      logSecurityEvent('DELTA_SYNC_PERFORMED' as any, 'info' as any, 'Delta sync performed', {
        deltaSyncId,
        userId,
        collection,
        changeCount: changes.length,
      });

      return deltaSync;
    } catch (error) {
      logSecurityEvent('DELTA_SYNC_FAILED' as any, 'error' as any, 'Failed to perform delta sync', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async resolveConflict(
    conflictId: string,
    userId: string,
    resolutionStrategy: 'last-write-wins' | 'auto-merge' | 'local-wins' | 'remote-wins',
    mergeRules?: Record<string, 'local' | 'remote' | 'merge'>
  ): Promise<DataConflict> {
    try {
      const conflictDoc = await this.db.collection('data_conflicts').doc(conflictId).get();
      const conflict = conflictDoc.data() as DataConflict;

      if (!conflict) throw new Error('Conflict not found');

      let resolvedData: Record<string, any>;

      if (resolutionStrategy === 'last-write-wins') {
        resolvedData = conflict.remoteTimestamp > conflict.localTimestamp ? conflict.remoteData : conflict.localData;
      } else if (resolutionStrategy === 'local-wins') {
        resolvedData = conflict.localData;
      } else if (resolutionStrategy === 'remote-wins') {
        resolvedData = conflict.remoteData;
      } else {
        // auto-merge
        resolvedData = this.mergeConflicts(conflict.localData, conflict.remoteData, mergeRules);
      }

      const updatedConflict: DataConflict = {
        ...conflict,
        status: 'resolved',
        resolutionMethod: resolutionStrategy === 'auto-merge' ? 'auto-merge' : 'last-write-wins',
      };

      await conflictDoc.ref.update(updatedConflict);

      logSecurityEvent('CONFLICT_RESOLVED' as any, 'info' as any, 'Conflict resolved', {
        conflictId,
        userId,
        resolutionStrategy,
      });

      return updatedConflict;
    } catch (error) {
      logSecurityEvent('CONFLICT_RESOLUTION_FAILED' as any, 'error' as any, 'Failed to resolve conflict', {
        conflictId,
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async defineConflictResolutionPolicy(
    userId: string,
    collection: string,
    conflictType: 'update-update' | 'update-delete' | 'delete-update' | 'all',
    strategy: 'last-write-wins' | 'auto-merge' | 'local-wins' | 'remote-wins' | 'manual'
  ): Promise<ConflictResolutionPolicy> {
    try {
      const policyId = `policy_${userId}_${collection}_${Date.now()}`;

      const policy: ConflictResolutionPolicy = {
        policyId,
        userId,
        collection,
        conflictType,
        resolutionStrategy: strategy,
        fieldMergeRules: {},
        priority: 1,
        createdAt: new Date(),
      };

      await this.db.collection('conflict_resolution_policies').doc(policyId).set(policy);

      logSecurityEvent('CONFLICT_RESOLUTION_POLICY_DEFINED' as any, 'info' as any, 'Conflict resolution policy defined', {
        policyId,
        userId,
        collection,
        strategy,
      });

      return policy;
    } catch (error) {
      logSecurityEvent('CONFLICT_RESOLUTION_POLICY_DEFINITION_FAILED' as any, 'error' as any, 'Failed to define policy', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recordSyncError(
    userId: string,
    collection: string,
    documentId: string,
    operation: 'create' | 'update' | 'delete',
    errorType: 'network' | 'validation' | 'conflict' | 'permission' | 'timeout',
    errorMessage: string
  ): Promise<SyncError> {
    try {
      const errorId = `sync_error_${userId}_${Date.now()}`;

      const error: SyncError = {
        errorId,
        userId,
        collection,
        documentId,
        operation,
        errorType,
        errorMessage,
        attemptCount: 1,
        maxAttempts: 3,
        nextRetryTime: new Date(Date.now() + 60000), // 1 minute
        createdAt: new Date(),
      };

      await this.db.collection('sync_errors').doc(errorId).set(error);

      logSecurityEvent('SYNC_ERROR_RECORDED' as any, 'error' as any, 'Sync error recorded', {
        errorId,
        userId,
        errorType,
        message: errorMessage,
      });

      return error;
    } catch (error) {
      logSecurityEvent('SYNC_ERROR_RECORDING_FAILED' as any, 'error' as any, 'Failed to record sync error', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recordSyncCheckpoint(userId: string, collection: string, lastDocumentId: string): Promise<SyncCheckpoint> {
    try {
      const checkpointId = `checkpoint_${userId}_${collection}_${Date.now()}`;

      const checkpoint: SyncCheckpoint = {
        checkpointId,
        userId,
        collection,
        lastSyncTime: new Date(),
        lastDocumentId,
        batchSize: 100,
        checksum: Math.random().toString(36).substring(2, 15),
        metadata: { compressed: true },
      };

      await this.db.collection('sync_checkpoints').doc(checkpointId).set(checkpoint);

      logSecurityEvent('SYNC_CHECKPOINT_RECORDED' as any, 'info' as any, 'Sync checkpoint recorded', {
        checkpointId,
        userId,
        collection,
      });

      return checkpoint;
    } catch (error) {
      logSecurityEvent('SYNC_CHECKPOINT_RECORDING_FAILED' as any, 'error' as any, 'Failed to record sync checkpoint', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private mergeConflicts(
    local: Record<string, any>,
    remote: Record<string, any>,
    rules?: Record<string, 'local' | 'remote' | 'merge'>
  ): Record<string, any> {
    const merged = { ...remote };

    for (const key in local) {
      if (rules && rules[key]) {
        if (rules[key] === 'local') {
          merged[key] = local[key];
        } else if (rules[key] === 'remote') {
          merged[key] = remote[key];
        } else {
          // merge strategy for this field
          merged[key] = Array.isArray(local[key]) ? [...new Set([...local[key], ...remote[key]])] : local[key];
        }
      } else if (!(key in remote) || local[key] === remote[key]) {
        merged[key] = local[key];
      }
    }

    return merged;
  }
}

export const offlineDataSyncService = new OfflineDataSyncService();
