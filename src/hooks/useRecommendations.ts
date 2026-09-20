import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export interface Recommendation {
  recommendationId: string;
  userId: string;
  itemId: string;
  itemType: 'course' | 'lesson' | 'book' | 'exercise' | 'video';
  score: number;
  reason: string;
  createdAt: Date;
}

export interface RecommendationGroup {
  category: string;
  recommendations: Recommendation[];
  totalScore: number;
}

export function useRecommendations(userId: string) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [groups, setGroups] = useState<RecommendationGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecommendations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<Recommendation[]>(`/recommendations/${userId}`);
      if (res.error) {
        setError(res.error);
      } else {
        setRecommendations(res.data || []);
        // Group recommendations by category
        const groupedRecs = groupRecommendations(res.data || []);
        setGroups(groupedRecs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadRecommendations();
    }
  }, [userId, loadRecommendations]);

  const getRecommendations = useCallback(
    async (filters?: { itemType?: string; limit?: number }) => {
      try {
        const params = new URLSearchParams();
        if (filters?.itemType) params.append('itemType', filters.itemType);
        if (filters?.limit) params.append('limit', filters.limit.toString());

        const res = await apiClient.get<Recommendation[]>(
          `/recommendations/${userId}?${params.toString()}`
        );
        if (res.error) {
          throw new Error(res.error);
        }
        return res.data || [];
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get recommendations');
        throw err;
      }
    },
    [userId]
  );

  const rateRecommendation = useCallback(
    async (recommendationId: string, rating: number) => {
      try {
        const res = await apiClient.post(`/recommendations/${recommendationId}/rate`, {
          rating,
        });
        if (res.error) {
          throw new Error(res.error);
        }
        await loadRecommendations();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to rate recommendation');
        throw err;
      }
    },
    [loadRecommendations]
  );

  return {
    recommendations,
    groups,
    isLoading,
    error,
    getRecommendations,
    rateRecommendation,
    refetch: loadRecommendations,
  };
}

function groupRecommendations(recs: Recommendation[]): RecommendationGroup[] {
  const grouped: Record<string, Recommendation[]> = {};

  recs.forEach((rec) => {
    if (!grouped[rec.itemType]) {
      grouped[rec.itemType] = [];
    }
    grouped[rec.itemType].push(rec);
  });

  return Object.entries(grouped).map(([category, items]) => ({
    category,
    recommendations: items.sort((a, b) => b.score - a.score),
    totalScore: items.reduce((sum, r) => sum + r.score, 0),
  }));
}

export function useRecommendationFeed(userId: string, limit = 10) {
  const [feed, setFeed] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFeed = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get<Recommendation[]>(
          `/recommendations/${userId}/feed?limit=${limit}`
        );
        if (res.error) {
          setError(res.error);
        } else {
          setFeed(res.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load feed');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadFeed();
    }
  }, [userId, limit]);

  return { feed, isLoading, error };
}
