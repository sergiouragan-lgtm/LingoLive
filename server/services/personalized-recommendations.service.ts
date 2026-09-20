import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface ContentItem {
  id: string;
  title: string;
  type: 'lesson' | 'quiz' | 'exercise' | 'video' | 'article';
  topic: string;
  difficulty: number; // 1-10
  duration: number; // minutes
  popularity: number; // 0-100
  rating: number; // 1-5
  tags: string[];
  createdAt: Date;
}

export interface UserProfile {
  userId: string;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  preferredContentTypes: string[];
  masteredTopics: string[];
  struggledTopics: string[];
  engagementScore: number; // 0-100
  completionRate: number; // 0-100
}

export interface ContentRecommendation {
  recommendationId: string;
  userId: string;
  contentId: string;
  reason: string;
  relevanceScore: number; // 0-100
  expectedEngagement: number; // 0-100
  diversityScore: number; // how different from recent content
  timestamp: Date;
}

export interface RecommendationMetrics {
  userId: string;
  totalRecommendations: number;
  clickedRecommendations: number;
  completedRecommendations: number;
  avgRelevanceScore: number;
  avgEngagementTime: number;
  ctr: number; // click-through rate
}

class PersonalizedRecommendationsService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = getFirestore();
    this.scheduleRecommendationUpdate();
  }

  public async getContentRecommendations(
    userId: string,
    limit: number = 5
  ): Promise<ContentRecommendation[]> {
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        throw new Error(`User profile not found for ${userId}`);
      }

      // Get user's interaction history
      const interactions = await this.getUserInteractions(userId, 100);
      const recentContentIds = interactions.map((i: any) => i.contentId);

      // Fetch all content items
      const allContent = await this.getAllContent();

      // Score and rank content
      const scoredContent = allContent
        .filter((c: any) => !recentContentIds.includes(c.id))
        .map((content: any) => ({
          ...content,
          relevance: this.calculateRelevance(content, userProfile),
          engagement: this.calculateEngagementPotential(content, userProfile),
          diversity: this.calculateDiversity(content, interactions),
        }))
        .sort(
          (a: any, b: any) =>
            b.relevance * 0.5 +
            b.engagement * 0.3 +
            b.diversity * 0.2 -
            (a.relevance * 0.5 + a.engagement * 0.3 + a.diversity * 0.2)
        )
        .slice(0, limit);

      // Create recommendation records
      const recommendations: ContentRecommendation[] = [];
      for (const item of scoredContent) {
        const rec: ContentRecommendation = {
          recommendationId: `rec-${userId}-${item.id}-${Date.now()}`,
          userId,
          contentId: item.id,
          reason: this.generateRecommendationReason(item, userProfile),
          relevanceScore: item.relevance,
          expectedEngagement: item.engagement,
          diversityScore: item.diversity,
          timestamp: new Date(),
        };

        await this.db
          .collection('content_recommendations')
          .doc(rec.recommendationId)
          .set(rec);

        recommendations.push(rec);
      }

      return recommendations;
    } catch (error: any) {
      console.error('Error generating content recommendations:', error);
      throw error;
    }
  }

  public async recordRecommendationClick(
    recommendationId: string,
    userId: string
  ): Promise<void> {
    try {
      await this.db
        .collection('recommendation_interactions')
        .add({
          recommendationId,
          userId,
          action: 'click',
          timestamp: new Date(),
        });

      logSecurityEvent(
        'RECOMMENDATION_CLICKED' as any,
        'info' as any,
        `User clicked recommendation`,
        { userId },
        { recommendationId }
      );
    } catch (error: any) {
      console.error('Error recording recommendation click:', error);
    }
  }

  public async recordContentCompletion(
    userId: string,
    contentId: string,
    timeSpentSeconds: number
  ): Promise<void> {
    try {
      await this.db
        .collection('content_interactions')
        .add({
          userId,
          contentId,
          action: 'completed',
          timeSpentSeconds,
          timestamp: new Date(),
        });

      // Update user engagement score
      await this.updateUserEngagement(userId, 10);
    } catch (error: any) {
      console.error('Error recording content completion:', error);
    }
  }

  public async getRecommendationMetrics(userId: string): Promise<RecommendationMetrics> {
    try {
      const recommendations = await this.db
        .collection('content_recommendations')
        .where('userId', '==', userId)
        .get();

      const interactions = await this.db
        .collection('recommendation_interactions')
        .where('userId', '==', userId)
        .where('action', '==', 'click')
        .get();

      const totalRecs = recommendations.size;
      const clicked = interactions.size;
      const ctr = totalRecs > 0 ? (clicked / totalRecs) * 100 : 0;

      const avgRelevance =
        recommendations.size > 0
          ? recommendations.docs.reduce((sum, d) => sum + d.data().relevanceScore, 0) /
            recommendations.size
          : 0;

      const completions = await this.db
        .collection('content_interactions')
        .where('userId', '==', userId)
        .where('action', '==', 'completed')
        .get();

      const avgEngagementTime =
        completions.size > 0
          ? completions.docs.reduce((sum, d) => sum + d.data().timeSpentSeconds, 0) /
            completions.size
          : 0;

      return {
        userId,
        totalRecommendations: totalRecs,
        clickedRecommendations: clicked,
        completedRecommendations: completions.size,
        avgRelevanceScore: Math.round(avgRelevance),
        avgEngagementTime: Math.round(avgEngagementTime),
        ctr: Math.round(ctr),
      };
    } catch (error: any) {
      console.error('Error getting recommendation metrics:', error);
      throw error;
    }
  }

  public async updateUserProfile(
    userId: string,
    profile: Partial<UserProfile>
  ): Promise<void> {
    try {
      await this.db
        .collection('user_profiles')
        .doc(userId)
        .set(profile, { merge: true });

      logSecurityEvent(
        'USER_PROFILE_UPDATED' as any,
        'info' as any,
        `User profile updated`,
        { userId },
        {}
      );
    } catch (error: any) {
      console.error('Error updating user profile:', error);
    }
  }

  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const doc = await this.db
        .collection('user_profiles')
        .doc(userId)
        .get();

      if (!doc.exists) {
        return null;
      }

      return doc.data() as UserProfile;
    } catch {
      return null;
    }
  }

  private async getUserInteractions(userId: string, limit: number): Promise<any[]> {
    try {
      const snapshot = await this.db
        .collection('content_interactions')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((d) => d.data());
    } catch {
      return [];
    }
  }

  private async getAllContent(): Promise<ContentItem[]> {
    try {
      const snapshot = await this.db.collection('content_library').get();
      return snapshot.docs.map((d) => ({
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() || new Date(),
      })) as ContentItem[];
    } catch {
      return [];
    }
  }

  private calculateRelevance(content: any, userProfile: UserProfile): number {
    let score = 50;

    if (userProfile.preferredContentTypes.includes(content.type)) {
      score += 20;
    }

    if (userProfile.masteredTopics.includes(content.topic)) {
      score += 10;
    }

    if (!userProfile.struggledTopics.includes(content.topic)) {
      score += 15;
    }

    score += content.rating * 5;
    score = Math.min(100, score);

    return score;
  }

  private calculateEngagementPotential(
    content: any,
    userProfile: UserProfile
  ): number {
    let score = content.popularity;

    if (userProfile.struggledTopics.includes(content.topic)) {
      score += 15;
    }

    score = Math.min(100, score);
    return score;
  }

  private calculateDiversity(content: any, interactions: any[]): number {
    const recentTopics = interactions
      .slice(0, 10)
      .map((i: any) => i.topic);

    const topicRepetition = recentTopics.filter((t: string) => t === content.topic).length;

    return Math.max(0, 100 - topicRepetition * 15);
  }

  private generateRecommendationReason(
    content: any,
    userProfile: UserProfile
  ): string {
    if (userProfile.struggledTopics.includes(content.topic)) {
      return `Recommended because you're learning ${content.topic}`;
    }

    if (userProfile.preferredContentTypes.includes(content.type)) {
      return `Based on your preference for ${content.type} content`;
    }

    return `Highly rated ${content.type} on ${content.topic}`;
  }

  private async updateUserEngagement(userId: string, points: number): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId);
      if (profile) {
        const newScore = Math.min(100, (profile.engagementScore || 0) + points);
        await this.updateUserProfile(userId, { engagementScore: newScore });
      }
    } catch (error) {
      console.error('Error updating engagement:', error);
    }
  }

  private scheduleRecommendationUpdate(): void {
    setInterval(async () => {
      try {
        const users = await this.db
          .collection('users')
          .select('id')
          .limit(100)
          .get();

        for (const userDoc of users.docs) {
          try {
            await this.getContentRecommendations(userDoc.id, 5);
          } catch (error) {
            console.error(`Recommendation update error for user ${userDoc.id}:`, error);
          }
        }
      } catch (error: any) {
        console.error('Recommendation scheduling error:', error);
      }
    }, 12 * 60 * 60 * 1000); // Every 12 hours
  }
}

export const personalizedRecommendationsService = new PersonalizedRecommendationsService();
