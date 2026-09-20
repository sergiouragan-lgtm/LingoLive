import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export interface Notification {
  notificationId: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export interface NotificationPreference {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  notificationTypes: Record<string, boolean>;
}

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<Notification[]>(`/notifications/user/${userId}`);
      if (res.error) {
        setError(res.error);
      } else {
        const notifs = res.data || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.read).length);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [userId, loadNotifications]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const res = await apiClient.put<Notification>(`/notifications/${notificationId}/read`, {});
        if (res.error) {
          throw new Error(res.error);
        }
        setNotifications((prev) =>
          prev.map((n) => (n.notificationId === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to mark as read');
        throw err;
      }
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    try {
      const res = await apiClient.post(`/notifications/mark-all-read`, {});
      if (res.error) {
        throw new Error(res.error);
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all as read');
      throw err;
    }
  }, []);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        const res = await apiClient.delete(`/notifications/${notificationId}`);
        if (res.error) {
          throw new Error(res.error);
        }
        setNotifications((prev) => prev.filter((n) => n.notificationId !== notificationId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete notification');
        throw err;
      }
    },
    []
  );

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: loadNotifications,
  };
}

export function useNotificationPreferences(userId: string) {
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPreferences = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get<NotificationPreference>(
          `/notifications/preferences/${userId}`
        );
        if (res.error) {
          setError(res.error);
        } else {
          setPreferences(res.data || null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preferences');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadPreferences();
    }
  }, [userId]);

  const updatePreferences = useCallback(
    async (updates: Partial<NotificationPreference>) => {
      try {
        const res = await apiClient.put<NotificationPreference>(
          `/notifications/preferences/${userId}`,
          updates
        );
        if (res.error) {
          throw new Error(res.error);
        }
        setPreferences(res.data || null);
        return res.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update preferences');
        throw err;
      }
    },
    [userId]
  );

  return { preferences, isLoading, error, updatePreferences };
}

export function useSendNotification() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (
      userId: string,
      title: string,
      message: string,
      type: 'info' | 'success' | 'warning' | 'error' = 'info'
    ) => {
      setIsLoading(true);
      try {
        const res = await apiClient.post<Notification>('/notifications/send', {
          userId,
          title,
          message,
          type,
        });
        if (res.error) {
          throw new Error(res.error);
        }
        return res.data;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to send notification';
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { send, isLoading, error };
}
