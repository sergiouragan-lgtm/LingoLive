import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export interface Monitor {
  monitorId: string;
  name: string;
  metric: string;
  threshold: number;
  enabled: boolean;
  createdAt: Date;
}

export interface MetricData {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface MonitoringDashboard {
  metrics: Record<string, MetricData[]>;
  health: 'healthy' | 'warning' | 'critical';
  lastUpdated: Date;
}

export function useMonitoring() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMonitors = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<Monitor[]>('/monitoring/monitors');
      if (res.error) {
        setError(res.error);
      } else {
        setMonitors(res.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load monitors');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMonitors();
    const interval = setInterval(loadMonitors, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [loadMonitors]);

  const createMonitor = useCallback(
    async (name: string, metric: string, threshold: number) => {
      try {
        const res = await apiClient.post<Monitor>('/monitoring/monitors/create', {
          name,
          metric,
          threshold,
        });
        if (res.error) {
          throw new Error(res.error);
        }
        await loadMonitors();
        return res.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create monitor');
        throw err;
      }
    },
    [loadMonitors]
  );

  const updateMonitor = useCallback(
    async (monitorId: string, updates: Partial<Monitor>) => {
      try {
        const res = await apiClient.put<Monitor>(`/monitoring/monitors/${monitorId}`, updates);
        if (res.error) {
          throw new Error(res.error);
        }
        await loadMonitors();
        return res.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update monitor');
        throw err;
      }
    },
    [loadMonitors]
  );

  return {
    monitors,
    isLoading,
    error,
    createMonitor,
    updateMonitor,
    refetch: loadMonitors,
  };
}

export function useMetrics(metricName: string, timeRange: 'hour' | 'day' | 'week' = 'day') {
  const [data, setData] = useState<MetricData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get<MetricData[]>(
          `/monitoring/metrics/${metricName}?timeRange=${timeRange}`
        );
        if (res.error) {
          setError(res.error);
        } else {
          setData(res.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [metricName, timeRange]);

  return { data, isLoading, error };
}

export function useMonitoringDashboard() {
  const [dashboard, setDashboard] = useState<MonitoringDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get<MonitoringDashboard>('/monitoring/dashboard');
        if (res.error) {
          setError(res.error);
        } else {
          setDashboard(res.data || null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
    const interval = setInterval(loadDashboard, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return { dashboard, isLoading, error };
}
