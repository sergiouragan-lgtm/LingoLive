import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export interface UserProfile {
  profileId: string;
  userId: string;
  preferences: Record<string, any>;
  learningStyle: string;
  proficiencyLevel: string;
  interests: string[];
  lastUpdated: Date;
}

export interface PersonalizedContent {
  contentId: string;
  userId: string;
  title: string;
  description: string;
  relevanceScore: number;
  estimatedDuration: number;
}

export function usePersonalization(userId: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<UserProfile>(`/personalization/profile/${userId}`);
      if (res.error) {
        setError(res.error);
      } else {
        setProfile(res.data || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId, loadProfile]);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      try {
        const res = await apiClient.put<UserProfile>(`/personalization/profile/${userId}`, updates);
        if (res.error) {
          throw new Error(res.error);
        }
        setProfile(res.data || null);
        return res.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update profile');
        throw err;
      }
    },
    [userId]
  );

  const updatePreferences = useCallback(
    async (preferences: Record<string, any>) => {
      try {
        const res = await apiClient.put<UserProfile>(
          `/personalization/profile/${userId}/preferences`,
          preferences
        );
        if (res.error) {
          throw new Error(res.error);
        }
        setProfile(res.data || null);
        return res.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update preferences');
        throw err;
      }
    },
    [userId]
  );

  const updateInterests = useCallback(
    async (interests: string[]) => {
      try {
        const res = await apiClient.put<UserProfile>(
          `/personalization/profile/${userId}/interests`,
          { interests }
        );
        if (res.error) {
          throw new Error(res.error);
        }
        setProfile(res.data || null);
        return res.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update interests');
        throw err;
      }
    },
    [userId]
  );

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    updatePreferences,
    updateInterests,
    refetch: loadProfile,
  };
}

export function usePersonalizedContent(userId: string) {
  const [content, setContent] = useState<PersonalizedContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get<PersonalizedContent[]>(
          `/personalization/content/${userId}`
        );
        if (res.error) {
          setError(res.error);
        } else {
          setContent(res.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadContent();
    }
  }, [userId]);

  return { content, isLoading, error };
}
