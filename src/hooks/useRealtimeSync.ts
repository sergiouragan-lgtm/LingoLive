import { useState, useEffect, useCallback } from 'react';
import { QueryConstraint } from 'firebase/firestore';
import { realtimeService } from '../services/realtime.service';
import { logger } from '../utils/logger';

export interface UseSyncOptions {
  enabled?: boolean;
  onError?: (error: Error) => void;
}

/**
 * Hook for real-time data synchronization
 * Subscribes to Firestore collection and handles offline queuing
 */
export function useRealtimeSync<T>(
  collectionPath: string,
  constraints: QueryConstraint[] = [],
  options?: UseSyncOptions
) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [syncStatus, setSyncStatus] = useState({
    isOnline: navigator.onLine,
    queuedOperations: 0,
    syncInProgress: false,
  });

  useEffect(() => {
    if (options?.enabled === false) {
      return;
    }

    // Subscribe to real-time updates
    const subscriptionId = realtimeService.subscribe(
      collectionPath,
      constraints,
      (newData) => {
        setData(newData);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
        if (options?.onError) {
          options.onError(err);
        }
        logger.error(`Real-time sync error for ${collectionPath}:`, err);
      }
    );

    // Monitor sync status
    const statusInterval = setInterval(() => {
      setSyncStatus(realtimeService.getSyncStatus());
    }, 2000);

    // Cleanup
    return () => {
      realtimeService.unsubscribe(subscriptionId);
      clearInterval(statusInterval);
    };
  }, [collectionPath, constraints, options]);

  const updateData = useCallback(
    async (docId: string, updates: Record<string, any>) => {
      try {
        await realtimeService.update(collectionPath, docId, updates, {
          optimistic: true,
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        if (options?.onError) {
          options.onError(error);
        }
        throw error;
      }
    },
    [collectionPath, options]
  );

  const flushQueue = useCallback(async () => {
    try {
      await realtimeService.flushOfflineQueue();
      setSyncStatus(realtimeService.getSyncStatus());
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, []);

  const getQueueStatus = useCallback(() => {
    return realtimeService.getQueueStatus();
  }, []);

  return {
    data,
    isLoading,
    error,
    syncStatus,
    updateData,
    flushQueue,
    getQueueStatus,
  };
}

/**
 * Hook for subscribing to a single document
 */
export function useRealtimeSyncDoc<T>(
  collectionPath: string,
  docId: string,
  options?: UseSyncOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [syncStatus, setSyncStatus] = useState({
    isOnline: navigator.onLine,
    queuedOperations: 0,
    syncInProgress: false,
  });

  useEffect(() => {
    if (options?.enabled === false) {
      return;
    }

    // Subscribe to document updates
    const subscriptionId = realtimeService.subscribeToDoc(
      collectionPath,
      docId,
      (newData) => {
        setData(newData);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
        if (options?.onError) {
          options.onError(err);
        }
        logger.error(`Real-time sync error for ${collectionPath}/${docId}:`, err);
      }
    );

    // Monitor sync status
    const statusInterval = setInterval(() => {
      setSyncStatus(realtimeService.getSyncStatus());
    }, 2000);

    // Cleanup
    return () => {
      realtimeService.unsubscribe(subscriptionId);
      clearInterval(statusInterval);
    };
  }, [collectionPath, docId, options]);

  const updateData = useCallback(
    async (updates: Record<string, any>) => {
      try {
        await realtimeService.update(collectionPath, docId, updates, {
          optimistic: true,
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        if (options?.onError) {
          options.onError(error);
        }
        throw error;
      }
    },
    [collectionPath, docId, options]
  );

  const flushQueue = useCallback(async () => {
    try {
      await realtimeService.flushOfflineQueue();
      setSyncStatus(realtimeService.getSyncStatus());
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    syncStatus,
    updateData,
    flushQueue,
  };
}
