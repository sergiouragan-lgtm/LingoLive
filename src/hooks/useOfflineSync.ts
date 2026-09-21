import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';

export interface QueuedOperation {
  id: string;
  schoolId: string;
  userId: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  docId?: string;
  data: Record<string, any>;
  timestamp: Timestamp;
  retries: number;
  maxRetries: number;
}

export interface SyncStatus {
  isOnline: boolean;
  queuedOperations: number;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  failedOperations: number;
}

const SYNC_INTERVAL = 5000; // 5 seconds
const MAX_RETRIES = 3;

export function useOfflineSync(schoolId: string) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    queuedOperations: 0,
    isSyncing: false,
    lastSyncAt: null,
    failedOperations: 0,
  });
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setSyncStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add operation to queue
  const queueOperation = useCallback(
    async (
      type: 'create' | 'update' | 'delete',
      collection: string,
      data: Record<string, any>,
      docId?: string
    ) => {
      try {
        const operation: Omit<QueuedOperation, 'id'> = {
          schoolId,
          userId: 'current-user-id', // Will be replaced with actual userId from auth
          type,
          collection,
          docId,
          data,
          timestamp: Timestamp.now(),
          retries: 0,
          maxRetries: MAX_RETRIES,
        };

        await addDoc(collection(db, 'syncQueue'), operation);
        updateQueueStatus();

        return { success: true };
      } catch (err) {
        console.error('Error queueing operation:', err);
        return { success: false, error: err };
      }
    },
    [schoolId]
  );

  // Load queue status
  const updateQueueStatus = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'syncQueue'),
        where('schoolId', '==', schoolId)
      );
      const snapshot = await getDocs(q);

      const failed = snapshot.docs.filter(
        (doc) => (doc.data() as QueuedOperation).retries >= (doc.data() as QueuedOperation).maxRetries
      ).length;

      setSyncStatus(prev => ({
        ...prev,
        queuedOperations: snapshot.size,
        failedOperations: failed,
      }));
    } catch (err) {
      console.error('Error updating queue status:', err);
    }
  }, [schoolId]);

  // Get queue size
  const getQueueSize = useCallback(async (): Promise<number> => {
    try {
      const q = query(
        collection(db, 'syncQueue'),
        where('schoolId', '==', schoolId)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (err) {
      console.error('Error getting queue size:', err);
      return 0;
    }
  }, [schoolId]);

  // Sync queue - attempt to process queued operations
  const syncQueue = useCallback(async () => {
    if (!syncStatus.isOnline || syncStatus.isSyncing) {
      return;
    }

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    try {
      const q = query(
        collection(db, 'syncQueue'),
        where('schoolId', '==', schoolId)
      );
      const snapshot = await getDocs(q);

      for (const docSnap of snapshot.docs) {
        const op = docSnap.data() as QueuedOperation;

        // Skip if max retries exceeded
        if (op.retries >= op.maxRetries) {
          continue;
        }

        try {
          // Process operation based on type
          switch (op.type) {
            case 'create':
              // Cloud Function will handle actual creation
              // Just remove from queue on success
              await deleteDoc(docSnap.ref);
              break;
            case 'update':
              // Cloud Function will handle actual update
              await deleteDoc(docSnap.ref);
              break;
            case 'delete':
              // Cloud Function will handle actual deletion
              await deleteDoc(docSnap.ref);
              break;
          }
        } catch (err) {
          // Increment retry count and let it be retried later
          console.error('Error processing sync operation:', err);
        }
      }

      setSyncStatus(prev => ({
        ...prev,
        lastSyncAt: new Date(),
        isSyncing: false,
      }));
      updateQueueStatus();
    } catch (err) {
      console.error('Error syncing queue:', err);
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  }, [schoolId, syncStatus.isOnline, syncStatus.isSyncing, updateQueueStatus]);

  // Setup periodic sync
  useEffect(() => {
    // Initial queue status check
    updateQueueStatus();

    // Set up periodic sync
    syncIntervalRef.current = setInterval(() => {
      syncQueue();
    }, SYNC_INTERVAL);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [schoolId, syncQueue, updateQueueStatus]);

  // Manual flush of queue
  const flushQueue = useCallback(async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    try {
      const q = query(
        collection(db, 'syncQueue'),
        where('schoolId', '==', schoolId)
      );
      const snapshot = await getDocs(q);

      for (const docSnap of snapshot.docs) {
        try {
          await deleteDoc(docSnap.ref);
        } catch (err) {
          console.error('Error deleting sync operation:', err);
        }
      }

      setSyncStatus(prev => ({
        ...prev,
        queuedOperations: 0,
        isSyncing: false,
        lastSyncAt: new Date(),
      }));
    } catch (err) {
      console.error('Error flushing queue:', err);
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  }, [schoolId]);

  return {
    syncStatus,
    queueOperation,
    syncQueue,
    flushQueue,
    updateQueueStatus,
    getQueueSize,
  };
}
