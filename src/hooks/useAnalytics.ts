import { useCallback, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export interface AnalyticsEvent {
  eventId: string;
  userId: string;
  eventType: string;
  eventData: Record<string, any>;
  timestamp: Date;
}

export interface UserAnalytics {
  userId: string;
  totalEvents: number;
  lastActiveAt: Date;
  sessionCount: number;
  avgSessionDuration: number;
  conversionRate?: number;
}

export interface EventMetrics {
  eventType: string;
  count: number;
  lastOccurred: Date;
  metadata?: Record<string, any>;
}

export function useAnalytics(userId: string) {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackEvent = useCallback(
    async (eventType: string, eventData?: Record<string, any>) => {
      try {
        const res = await apiClient.post<AnalyticsEvent>('/analytics/track', {
          userId,
          eventType,
          eventData: eventData || {},
        });

        if (res.error) {
          console.warn('Failed to track event:', res.error);
        }

        return res.data;
      } catch (err) {
        console.error('Analytics tracking error:', err);
      }
    },
    [userId]
  );

  const getUserAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<UserAnalytics>(`/analytics/user/${userId}`);
      if (res.error) {
        setError(res.error);
      } else {
        setAnalytics(res.data || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  return { analytics, isLoading, error, trackEvent, getUserAnalytics };
}

export function useEventMetrics(eventType: string, timeRange: 'hour' | 'day' | 'week' = 'day') {
  const [metrics, setMetrics] = useState<EventMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<EventMetrics>(
        `/analytics/metrics/${eventType}?timeRange=${timeRange}`
      );
      if (res.error) {
        setError(res.error);
      } else {
        setMetrics(res.data || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setIsLoading(false);
    }
  }, [eventType, timeRange]);

  const refetch = useCallback(loadMetrics, [loadMetrics]);

  return { metrics, isLoading, error, refetch };
}

export function useSessionTracking(userId: string) {
  const [sessionId, setSessionId] = useState<string>('');

  const startSession = useCallback(async () => {
    try {
      const res = await apiClient.post<{ sessionId: string }>('/analytics/session/start', {
        userId,
      });

      if (res.data?.sessionId) {
        setSessionId(res.data.sessionId);
      }
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  }, [userId]);

  const endSession = useCallback(async () => {
    try {
      if (sessionId) {
        await apiClient.post('/analytics/session/end', { sessionId, userId });
      }
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  }, [sessionId, userId]);

  return { sessionId, startSession, endSession };
}

export function useLearningAnalytics(userId: string) {
  const [stats, setStats] = useState<{
    totalLessonsCompleted: number;
    totalMinutesSpent: number;
    averageAccuracy: number;
    currentStreak: number;
    longestStreak: number;
  } | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await apiClient.get(`/analytics/learning/${userId}`);
      if (res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load learning analytics:', err);
    }
  }, [userId]);

  return { stats, loadStats };
}
