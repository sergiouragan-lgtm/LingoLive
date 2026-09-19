import { db } from '../firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
  writeBatch,
  Timestamp,
  QueryConstraint,
  Unsubscribe,
} from 'firebase/firestore';
import { logger } from '../utils/logger';

export interface SyncOperation {
  id: string;
  collectionPath: string;
  docId: string;
  operation: 'set' | 'update' | 'delete';
  data: Record<string, any>;
  timestamp: number;
  status: 'pending' | 'synced' | 'failed';
  error?: string;
  retryCount: number;
}

export interface RealtimeSubscription {
  collectionPath: string;
  docId?: string;
  unsubscribe: Unsubscribe;
  constraints?: QueryConstraint[];
}

export class RealtimeService {
  private offlineQueue: Map<string, SyncOperation> = new Map();
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      logger.info('App is online. Starting offline queue flush...');
      this.flushOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      logger.warn('App is offline. Subsequent writes will be queued.');
    });

    // Load offline queue from localStorage
    this.loadOfflineQueue();
  }

  /**
   * Subscribe to real-time updates for a collection or document
   */
  subscribe<T>(
    collectionPath: string,
    constraints: QueryConstraint[] = [],
    onData: (data: T[]) => void,
    onError?: (error: Error) => void
  ): string {
    const subscriptionId = `${collectionPath}_${Date.now()}`;

    try {
      const q = query(collection(db, collectionPath), ...constraints);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as T));
          onData(data);
          logger.debug(`Real-time update for ${collectionPath}: ${data.length} items`);
        },
        (error) => {
          logger.error(`Real-time subscription error for ${collectionPath}:`, error);
          if (onError) onError(error);
        }
      );

      this.subscriptions.set(subscriptionId, {
        collectionPath,
        unsubscribe,
        constraints,
      });

      logger.info(`Subscribed to ${collectionPath} (ID: ${subscriptionId})`);
      return subscriptionId;
    } catch (error) {
      logger.error(`Failed to subscribe to ${collectionPath}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to a specific document
   */
  subscribeToDoc<T>(
    collectionPath: string,
    docId: string,
    onData: (data: T | null) => void,
    onError?: (error: Error) => void
  ): string {
    const subscriptionId = `${collectionPath}/${docId}_${Date.now()}`;

    try {
      const docRef = doc(db, collectionPath, docId);

      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = {
              id: snapshot.id,
              ...snapshot.data(),
            } as T;
            onData(data);
            logger.debug(`Real-time update for ${collectionPath}/${docId}`);
          } else {
            onData(null);
          }
        },
        (error) => {
          logger.error(`Real-time subscription error for ${collectionPath}/${docId}:`, error);
          if (onError) onError(error);
        }
      );

      this.subscriptions.set(subscriptionId, {
        collectionPath,
        docId,
        unsubscribe,
      });

      logger.info(`Subscribed to ${collectionPath}/${docId} (ID: ${subscriptionId})`);
      return subscriptionId;
    } catch (error) {
      logger.error(`Failed to subscribe to ${collectionPath}/${docId}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from a real-time listener
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionId);
      logger.info(`Unsubscribed from ${subscriptionId}`);
    }
  }

  /**
   * Perform an optimistic update (local first, then sync)
   */
  async update(
    collectionPath: string,
    docId: string,
    data: Record<string, any>,
    options?: { optimistic?: boolean; retry?: number }
  ): Promise<void> {
    const optimistic = options?.optimistic !== false;

    try {
      if (this.isOnline) {
        // Online: update server immediately
        const docRef = doc(db, collectionPath, docId);
        await updateDoc(docRef, {
          ...data,
          updatedAt: Timestamp.now(),
        });
        logger.info(`Updated ${collectionPath}/${docId} online`);
      } else {
        // Offline: queue the operation
        if (optimistic) {
          // Apply optimistically to local state (handled by subscriber)
          const operation: SyncOperation = {
            id: `op_${Date.now()}_${Math.random()}`,
            collectionPath,
            docId,
            operation: 'update',
            data,
            timestamp: Date.now(),
            status: 'pending',
            retryCount: 0,
          };
          this.offlineQueue.set(operation.id, operation);
          this.saveOfflineQueue();
          logger.info(`Queued update for ${collectionPath}/${docId}`);
        }
      }
    } catch (error) {
      logger.error(`Failed to update ${collectionPath}/${docId}:`, error);
      throw error;
    }
  }

  /**
   * Flush offline queue (sync all pending operations)
   */
  async flushOfflineQueue(): Promise<void> {
    if (this.syncInProgress || this.offlineQueue.size === 0 || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;

    try {
      const operations = Array.from(this.offlineQueue.values());
      logger.info(`Flushing ${operations.length} pending operations...`);

      for (const op of operations) {
        try {
          const docRef = doc(db, op.collectionPath, op.docId);

          switch (op.operation) {
            case 'update': {
              await updateDoc(docRef, {
                ...op.data,
                updatedAt: Timestamp.now(),
              });
              break;
            }
            // Add 'set' and 'delete' cases as needed
          }

          // Mark as synced
          op.status = 'synced';
          this.offlineQueue.delete(op.id);
          logger.info(`Synced operation: ${op.id}`);
        } catch (error) {
          logger.error(`Failed to sync operation ${op.id}:`, error);
          op.retryCount++;
          op.error = (error as Error).message;

          // Fail after 3 retries
          if (op.retryCount >= 3) {
            op.status = 'failed';
            this.offlineQueue.delete(op.id);
          }
        }
      }

      this.saveOfflineQueue();
      logger.info(`Offline queue flush complete. ${this.offlineQueue.size} operations remaining.`);
    } catch (error) {
      logger.error('Offline queue flush failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get offline queue status
   */
  getQueueStatus(): {
    pending: number;
    failed: number;
    size: number;
  } {
    let pending = 0;
    let failed = 0;

    this.offlineQueue.forEach((op) => {
      if (op.status === 'pending') pending++;
      if (op.status === 'failed') failed++;
    });

    return {
      pending,
      failed,
      size: this.offlineQueue.size,
    };
  }

  /**
   * Clear offline queue (dangerous - loses pending operations)
   */
  clearOfflineQueue(): void {
    this.offlineQueue.clear();
    this.saveOfflineQueue();
    logger.warn('Offline queue cleared');
  }

  /**
   * Save offline queue to localStorage
   */
  private saveOfflineQueue(): void {
    try {
      const operations = Array.from(this.offlineQueue.values());
      localStorage.setItem('lingolive_offline_queue', JSON.stringify(operations));
    } catch (error) {
      logger.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Load offline queue from localStorage
   */
  private loadOfflineQueue(): void {
    try {
      const stored = localStorage.getItem('lingolive_offline_queue');
      if (stored) {
        const operations = JSON.parse(stored) as SyncOperation[];
        operations.forEach((op) => {
          this.offlineQueue.set(op.id, op);
        });
        logger.info(`Loaded ${operations.length} operations from offline queue`);
      }
    } catch (error) {
      logger.error('Failed to load offline queue:', error);
    }
  }

  /**
   * Get sync status (online/offline)
   */
  getSyncStatus(): {
    isOnline: boolean;
    queuedOperations: number;
    syncInProgress: boolean;
  } {
    return {
      isOnline: this.isOnline,
      queuedOperations: this.offlineQueue.size,
      syncInProgress: this.syncInProgress,
    };
  }

  /**
   * Unsubscribe from all listeners
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
    this.subscriptions.clear();
    logger.info('Unsubscribed from all real-time listeners');
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
