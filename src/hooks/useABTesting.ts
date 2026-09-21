import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export interface ABTest {
  testId: string;
  name: string;
  control: string;
  variant: string;
  splitPercentage: number;
}

export interface TestResult {
  resultId: string;
  testId: string;
  conversionRate: number;
  confidence: number;
}

export interface UserVariant {
  testId: string;
  userId: string;
  variant: 'control' | 'variant';
  assignedAt: Date;
}

export function useABTesting() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<ABTest[]>('/abtesting');
      if (res.error) {
        setError(res.error);
      } else {
        setTests(res.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tests');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const createTest = useCallback(
    async (name: string, control: string, variant: string, splitPercentage: number) => {
      try {
        const res = await apiClient.post<ABTest>('/abtesting/create', {
          name,
          control,
          variant,
          splitPercentage,
        });
        if (res.error) {
          throw new Error(res.error);
        }
        await loadTests();
        return res.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create test');
        throw err;
      }
    },
    [loadTests]
  );

  const getTestResult = useCallback(async (testId: string) => {
    try {
      const res = await apiClient.get<TestResult>(`/abtesting/${testId}/results`);
      if (res.error) {
        throw new Error(res.error);
      }
      return res.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load test results');
      throw err;
    }
  }, []);

  const assignVariant = useCallback(
    async (testId: string, userId: string) => {
      try {
        const res = await apiClient.post<UserVariant>('/abtesting/assign', {
          testId,
          userId,
        });
        if (res.error) {
          throw new Error(res.error);
        }
        return res.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to assign variant');
        throw err;
      }
    },
    []
  );

  return {
    tests,
    isLoading,
    error,
    createTest,
    getTestResult,
    assignVariant,
    refetch: loadTests,
  };
}

export function useUserABTestVariant(testId: string, userId: string) {
  const [variant, setVariant] = useState<'control' | 'variant' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVariant = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get<UserVariant>(
          `/abtesting/${testId}/user/${userId}/variant`
        );
        if (res.error) {
          setError(res.error);
        } else if (res.data) {
          setVariant(res.data.variant);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load variant');
      } finally {
        setIsLoading(false);
      }
    };

    loadVariant();
  }, [testId, userId]);

  return { variant, isLoading, error };
}
