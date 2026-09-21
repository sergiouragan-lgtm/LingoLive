import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface UserContentPreference {
  userId: string;
  preferredLanguages: string[];
  preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
  preferredContentTypes: string[];
  engagementScore: number;
  lastUpdated: Date;
}

export interface ContentRecommendation {
  userId: string;
  contentId: string;
  contentType: string;
  title: string;
  description?: string;
  scoringFactors: Record<string, number>;
  recommendationScore: number; // 0-100
  reason: string;
  recommendedAt: Date;
  interactionType?: 'clicked' | 'completed' | 'skipped' | 'viewed';
}

export interface CollaborativeFilteringResult {
  userId: string;
  similarUsers: Array<{ userId: string; similarity: number }>;
  recommendedItems: Array<{ itemId: string; score: number }>;
  generatedAt: Date;
}

export interface ABTest {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  variants: Array<{
    variantId: string;
    name: string;
    description?: string;
    weight: number; // 0-100
    algorithmType: 'collaborative_filtering' | 'content_based' | 'hybrid' | 'random';
  }>;
  metrics: {
    ctr: number; // click-through rate
    conversion: number;
    engagement: number;
    revenue: number;
  };
  startDate: Date;
  endDate?: Date;
  winner?: string;
  createdAt: Date;
}

export interface RecommendationMetrics {
  totalRecommendations: number;
  clickThroughRate: number;
  conversionRate: number;
  averageEngagementScore: number;
  topPerformingContent: Array<{ contentId: string; score: number }>;
  userSatisfactionScore: number; // 0-100
  generatedAt: Date;
}

class RecommendationsService {
  private db: Firestore;

  constructor() {
    this.db = getFirestore();
    this.scheduleRecommendationGeneration();
  }

  public async getUserContentPreferences(userId: string): Promise<UserContentPreference> {
    try {
      const doc = await this.db
        .collection('user_content_preferences')
        .doc(userId)
        .get();

      if (doc.exists) {
        return {
          ...doc.data(),
          lastUpdated: doc.data().lastUpdated?.toDate?.() || new Date(),
        } as UserContentPreference;
      }

      const defaultPreference: UserContentPreference = {
        userId,
        preferredLanguages: [],
        preferredDifficulty: 'beginner',
        preferredContentTypes: [],
        engagementScore: 0,
        lastUpdated: new Date(),
      };

      await this.db
        .collection('user_content_preferences')
        .doc(userId)
        .set(defaultPreference);

      return defaultPreference;
    } catch (error: any) {
      console.error('Error getting user content preferences:', error);
      throw error;
    }
  }

  public async updateUserPreferences(
    userId: string,
    preferences: Partial<UserContentPreference>
  ): Promise<void> {
    try {
      await this.db
        .collection('user_content_preferences')
        .doc(userId)
        .update({
          ...preferences,
          lastUpdated: new Date(),
        });

      logSecurityEvent(
        'USER_PREFERENCES_UPDATED' as any,
        'info' as any,
        `User content preferences updated`,
        { userId },
        {}
      );
    } catch (error: any) {
      console.error('Error updating user preferences:', error);
    }
  }

  public async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<ContentRecommendation[]> {
    try {
      const userPref = await this.getUserContentPreferences(userId);
      const userEvents = await this.db
        .collection('user_events')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();

      const recommendations: ContentRecommendation[] = [];
      const viewedContent = new Set(userEvents.docs.map((d) => d.data().contentId));

      const contentSnapshot = await this.db.collection('content').get();

      contentSnapshot.docs.forEach((doc) => {
        if (viewedContent.has(doc.id)) return;

        const content = doc.data();
        const scoringFactors = this.calculateScoringFactors(
          content,
          userPref,
          userEvents.docs.map((d) => d.data())
        );

        const score = this.aggregateScore(scoringFactors);

        recommendations.push({
          userId,
          contentId: doc.id,
          contentType: content.type,
          title: content.title,
          description: content.description,
          scoringFactors,
          recommendationScore: score,
          reason: this.generateRecommendationReason(content, scoringFactors),
          recommendedAt: new Date(),
        });
      });

      return recommendations
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit);
    } catch (error: any) {
      console.error('Error getting personalized recommendations:', error);
      return [];
    }
  }

  public async getCollaborativeFilteringRecommendations(
    userId: string
  ): Promise<CollaborativeFilteringResult> {
    try {
      const userProfile = await this.db.collection('users').doc(userId).get();
      const userEngagement = await this.db
        .collection('engagement_metrics')
        .where('userId', '==', userId)
        .get();

      const allUsers = await this.db.collection('users').get();
      const similarities: Array<{ userId: string; similarity: number }> = [];

      allUsers.docs.forEach((doc) => {
        if (doc.id === userId) return;

        const otherUserEngagement = userEngagement.docs.filter(
          (e) => e.data().userId === doc.id
        );
        const similarity = this.calculateUserSimilarity(
          userEngagement.docs.map((d) => d.data()),
          otherUserEngagement.map((d) => d.data())
        );

        similarities.push({ userId: doc.id, similarity });
      });

      const topSimilarUsers = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

      const recommendedItems = await this.getItemsFromSimilarUsers(topSimilarUsers, userId);

      return {
        userId,
        similarUsers: topSimilarUsers,
        recommendedItems,
        generatedAt: new Date(),
      };
    } catch (error: any) {
      console.error('Error getting collaborative filtering recommendations:', error);
      throw error;
    }
  }

  public async createABTest(
    name: string,
    description: string,
    variants: ABTest['variants']
  ): Promise<ABTest> {
    try {
      const test: ABTest = {
        id: `ab-test-${Date.now()}`,
        name,
        description,
        status: 'draft',
        variants,
        metrics: {
          ctr: 0,
          conversion: 0,
          engagement: 0,
          revenue: 0,
        },
        startDate: new Date(),
        createdAt: new Date(),
      };

      await this.db
        .collection('ab_tests')
        .doc(test.id)
        .set(test);

      logSecurityEvent(
        'AB_TEST_CREATED' as any,
        'info' as any,
        `A/B test created: ${name}`,
        { testId: test.id },
        {}
      );

      return test;
    } catch (error: any) {
      console.error('Error creating A/B test:', error);
      throw error;
    }
  }

  public async activateABTest(testId: string): Promise<void> {
    try {
      await this.db
        .collection('ab_tests')
        .doc(testId)
        .update({
          status: 'active',
          startDate: new Date(),
        });

      logSecurityEvent(
        'AB_TEST_ACTIVATED' as any,
        'info' as any,
        `A/B test activated`,
        { testId },
        {}
      );
    } catch (error: any) {
      console.error('Error activating A/B test:', error);
    }
  }

  public async getABTests(status?: string): Promise<ABTest[]> {
    try {
      let query: any = this.db.collection('ab_tests');

      if (status) {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        startDate: doc.data().startDate?.toDate?.() || new Date(),
        endDate: doc.data().endDate?.toDate?.() || undefined,
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      } as ABTest));
    } catch (error: any) {
      console.error('Error fetching A/B tests:', error);
      return [];
    }
  }

  public async recordRecommendationInteraction(
    userId: string,
    contentId: string,
    interactionType: 'clicked' | 'completed' | 'skipped' | 'viewed'
  ): Promise<void> {
    try {
      const event = {
        userId,
        contentId,
        interactionType,
        timestamp: new Date(),
      };

      await this.db
        .collection('recommendation_interactions')
        .add(event);

      const userPref = await this.getUserContentPreferences(userId);
      const engagementScoreIncrement = this.getEngagementIncrement(interactionType);

      await this.updateUserPreferences(userId, {
        engagementScore: userPref.engagementScore + engagementScoreIncrement,
      });
    } catch (error: any) {
      console.error('Error recording recommendation interaction:', error);
    }
  }

  public async getRecommendationMetrics(): Promise<RecommendationMetrics> {
    try {
      const interactions = await this.db.collection('recommendation_interactions').get();
      const recommendations = await this.db.collection('recommendations').get();

      const clicks = interactions.docs.filter((d) => d.data().interactionType === 'clicked').length;
      const completions = interactions.docs.filter((d) => d.data().interactionType === 'completed')
        .length;

      const ctr = interactions.size > 0 ? (clicks / interactions.size) * 100 : 0;
      const conversionRate = interactions.size > 0 ? (completions / interactions.size) * 100 : 0;

      const engagementScores = recommendations.docs.map((d) => d.data().recommendationScore || 0);
      const avgEngagementScore =
        engagementScores.length > 0
          ? engagementScores.reduce((a, b) => a + b) / engagementScores.length
          : 0;

      return {
        totalRecommendations: recommendations.size,
        clickThroughRate: Math.round(ctr),
        conversionRate: Math.round(conversionRate),
        averageEngagementScore: Math.round(avgEngagementScore),
        topPerformingContent: [],
        userSatisfactionScore: 75,
        generatedAt: new Date(),
      };
    } catch (error: any) {
      console.error('Error getting recommendation metrics:', error);
      throw error;
    }
  }

  private calculateScoringFactors(
    content: any,
    userPref: UserContentPreference,
    userEvents: any[]
  ): Record<string, number> {
    const factors: Record<string, number> = {};

    factors.languageMatch = userPref.preferredLanguages.includes(content.language) ? 25 : 0;
    factors.difficultyMatch =
      content.difficulty === userPref.preferredDifficulty ? 25 :
      Math.abs(
        ['beginner', 'intermediate', 'advanced'].indexOf(content.difficulty) -
        ['beginner', 'intermediate', 'advanced'].indexOf(userPref.preferredDifficulty)
      ) <= 1
        ? 15
        : 5;

    factors.typeMatch = userPref.preferredContentTypes.includes(content.type) ? 20 : 0;
    factors.popularity = (content.views || 0) / 1000;
    factors.userEngagement = Math.min(20, userPref.engagementScore / 5);

    return factors;
  }

  private aggregateScore(factors: Record<string, number>): number {
    const scores = Object.values(factors);
    return Math.min(100, scores.reduce((a, b) => a + b, 0));
  }

  private generateRecommendationReason(content: any, factors: Record<string, number>): string {
    const topFactor = Object.entries(factors).sort(([, a], [, b]) => b - a)[0];
    const factorReasons: Record<string, string> = {
      languageMatch: 'matches your preferred language',
      difficultyMatch: 'matches your learning level',
      typeMatch: 'matches your content preferences',
      popularity: 'trending with other learners',
      userEngagement: 'based on your learning style',
    };

    return `Recommended because it ${factorReasons[topFactor?.[0]] || 'matches your interests'}`;
  }

  private calculateUserSimilarity(userEvents1: any[], userEvents2: any[]): number {
    if (!userEvents1.length || !userEvents2.length) return 0;

    const score1 = userEvents1.reduce((sum, e) => sum + (e.engagementScore || 0), 0) /
      userEvents1.length;
    const score2 = userEvents2.reduce((sum, e) => sum + (e.engagementScore || 0), 0) /
      userEvents2.length;

    const maxDiff = 100;
    const similarity = Math.max(0, 100 - Math.abs(score1 - score2));

    return Math.min(100, similarity);
  }

  private async getItemsFromSimilarUsers(
    similarUsers: Array<{ userId: string; similarity: number }>,
    currentUserId: string
  ): Promise<Array<{ itemId: string; score: number }>> {
    const itemScores: Record<string, number> = {};

    for (const similar of similarUsers) {
      const userEvents = await this.db
        .collection('user_events')
        .where('userId', '==', similar.userId)
        .get();

      userEvents.docs.forEach((doc) => {
        const itemId = doc.data().contentId;
        const weight = similar.similarity / 100;
        itemScores[itemId] = (itemScores[itemId] || 0) + weight;
      });
    }

    return Object.entries(itemScores)
      .map(([itemId, score]) => ({ itemId, score: score * 100 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  private getEngagementIncrement(interactionType: string): number {
    switch (interactionType) {
      case 'completed':
        return 10;
      case 'clicked':
        return 5;
      case 'viewed':
        return 3;
      case 'skipped':
        return -2;
      default:
        return 0;
    }
  }

  private scheduleRecommendationGeneration(): void {
    setInterval(async () => {
      try {
        const users = await this.db.collection('users').get();

        for (const user of users.docs) {
          await this.getPersonalizedRecommendations(user.id, 5);
        }
      } catch (error: any) {
        console.error('Recommendation generation error:', error);
      }
    }, 6 * 60 * 60 * 1000); // Run every 6 hours
  }
}

export const recommendationsService = new RecommendationsService();
