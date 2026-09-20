import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export interface FeatureFlag {
  flagId: string;
  name: string;
  enabled: boolean;
  rollout: number;
  createdAt: Date;
}

export interface FlagVariant {
  variantId: string;
  flagId: string;
  name: string;
  config: any;
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFlags = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<FeatureFlag[]>('/features');
      if (res.error) {
        setError(res.error);
      } else {
        setFlags(res.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load flags');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  const createFlag = useCallback(
    async (name: string, rollout: number) => {
      try {
        const res = await apiClient.post<FeatureFlag>('/features/create', {
          name,
          rollout,
        });
        if (res.error) {
          throw new Error(res.error);
        }
        await loadFlags();
        return res.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create flag');
        throw err;
      }
    },
    [loadFlags]
  );

  const updateFlag = useCallback(
    async (flagId: string, updates: Partial<FeatureFlag>) => {
      try {
        const res = await apiClient.put<FeatureFlag>(`/features/${flagId}`, updates);
        if (res.error) {
          throw new Error(res.error);
        }
        await loadFlags();
        return res.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update flag');
        throw err;
      }
    },
    [loadFlags]
  );

  const isFlagEnabled = useCallback(
    (flagName: string): boolean => {
      const flag = flags.find((f) => f.name === flagName);
      if (!flag) return false;

      // Check rollout percentage
      if (flag.rollout < 100) {
        const hash = hashString(flagName);
        return (hash % 100) < flag.rollout;
      }

      return flag.enabled;
    },
    [flags]
  );

  return {
    flags,
    isLoading,
    error,
    createFlag,
    updateFlag,
    isFlagEnabled,
    refetch: loadFlags,
  };
}

export function useFeatureFlagVariants(flagId: string) {
  const [variants, setVariants] = useState<FlagVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVariants = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get<FlagVariant[]>(`/features/${flagId}/variants`);
        if (res.error) {
          setError(res.error);
        } else {
          setVariants(res.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load variants');
      } finally {
        setIsLoading(false);
      }
    };

    loadVariants();
  }, [flagId]);

  const createVariant = useCallback(
    async (name: string, config: any) => {
      try {
        const res = await apiClient.post<FlagVariant>('/features/variants/create', {
          flagId,
          name,
          config,
        });
        if (res.error) {
          throw new Error(res.error);
        }
        setVariants((prev) => [...prev, res.data!]);
        return res.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create variant');
        throw err;
      }
    },
    [flagId]
  );

  return {
    variants,
    isLoading,
    error,
    createVariant,
  };
}

// Helper function for consistent hashing
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
