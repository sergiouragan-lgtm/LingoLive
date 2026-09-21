import { useCallback, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export interface CacheEntry<T = any> {
  cacheId: string;
  key: string;
  value: T;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

export interface CacheStats {
  totalEntries: number;
  cacheSize: number;
  hitRate: number;
  missRate: number;
}

export function useCache<T = any>(key: string, defaultValue?: T) {
  const [value, setValue] = useState<T | undefined>(defaultValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const get = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<CacheEntry<T>>(`/cache/${key}`);
      if (res.error) {
        setError(res.error);
      } else if (res.data) {
        setValue(res.data.value);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get cache');
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  const set = useCallback(
    async (newValue: T, ttlSeconds?: number) => {
      setIsLoading(true);
      try {
        const res = await apiClient.post<CacheEntry<T>>(`/cache/${key}`, {
          value: newValue,
          ttl: ttlSeconds,
        });
        if (res.error) {
          throw new Error(res.error);
        }
        setValue(newValue);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to set cache';
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [key]
  );

  const remove = useCallback(async () => {
    try {
      const res = await apiClient.delete(`/cache/${key}`);
      if (res.error) {
        throw new Error(res.error);
      }
      setValue(undefined);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to remove cache';
      setError(errorMsg);
      throw err;
    }
  }, [key]);

  const clear = useCallback(async () => {
    try {
      const res = await apiClient.delete(`/cache`);
      if (res.error) {
        throw new Error(res.error);
      }
      setValue(undefined);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to clear cache';
      setError(errorMsg);
      throw err;
    }
  }, []);

  return { value, isLoading, error, get, set, remove, clear };
}

export function useCacheStats() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<CacheStats>('/cache/stats');
      if (res.error) {
        setError(res.error);
      } else {
        setStats(res.data || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cache stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { stats, isLoading, error, loadStats };
}

export function useCacheInvalidation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invalidate = useCallback(async (pattern: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post(`/cache/invalidate`, { pattern });
      if (res.error) {
        throw new Error(res.error);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to invalidate cache';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const invalidateAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.delete(`/cache`);
      if (res.error) {
        throw new Error(res.error);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to clear cache';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, invalidate, invalidateAll };
}
