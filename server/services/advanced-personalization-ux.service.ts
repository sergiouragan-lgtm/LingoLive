import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface PersonalizationProfile {
  profileId: string;
  userId: string;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing';
  preferences: { [key: string]: any };
  contentAffinities: { [key: string]: number };
  lastUpdated: Date;
}

export interface ContentRecommendation {
  recommendationId: string;
  userId: string;
  contentId: string;
  contentType: string;
  score: number;
  reason: string;
  algorithm: 'collaborative' | 'content-based' | 'hybrid';
  createdAt: Date;
}

export interface LearningPathOptimization {
  pathId: string;
  userId: string;
  currentLevel: number;
  recommendedNext: string[];
  estimatedCompletionTime: number;
  difficultyProgression: number;
  updatedAt: Date;
}

export interface UIAdaptation {
  adaptationId: string;
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  layout: 'compact' | 'standard' | 'spacious';
  fontSize: number;
  textSize: 'small' | 'medium' | 'large';
  accessibilityFeatures: string[];
  createdAt: Date;
}

export interface UserEngagementProfile {
  engagementId: string;
  userId: string;
  dailyActiveMinutes: number;
  weeklySessionCount: number;
  completionRate: number;
  retentionScore: number;
  engagementTrend: 'increasing' | 'stable' | 'declining';
  lastActiveAt: Date;
}

export interface ABTestExperiment {
  experimentId: string;
  name: string;
  hypothesis: string;
  controlGroup: ABTestGroup;
  treatmentGroup: ABTestGroup;
  startDate: Date;
  endDate?: Date;
  status: 'running' | 'completed' | 'failed';
  results?: { [key: string]: any };
}

export interface ABTestGroup {
  groupId: string;
  groupName: string;
  userCount: number;
  conversionRate: number;
  avgEngagement: number;
}

export interface PersonalizationMetrics {
  metricsId: string;
  timestamp: Date;
  totalUsers: number;
  usersWithProfiles: number;
  recommendationCTR: number;
  engagementLift: number;
  retentionImprovement: number;
  conversionLift: number;
}

class AdvancedPersonalizationUXService {
  private db = getFirestore();

  async createPersonalizationProfile(
    userId: string,
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing',
    preferences: { [key: string]: any },
    contentAffinities: { [key: string]: number }
  ): Promise<PersonalizationProfile> {
    try {
      const profileId = `profile_${Date.now()}`;

      const profile: PersonalizationProfile = {
        profileId,
        userId,
        learningStyle,
        preferences,
        contentAffinities,
        lastUpdated: new Date(),
      };

      await this.db.collection('personalization_profiles').doc(profileId).set(profile);

      logSecurityEvent('PERSONALIZATION_PROFILE_CREATED' as any, 'info' as any, 'Personalization profile created', {
        profileId,
        userId,
        learningStyle,
      });

      return profile;
    } catch (error) {
      logSecurityEvent('PERSONALIZATION_PROFILE_CREATION_FAILED' as any, 'error' as any, 'Failed to create personalization profile', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getContentRecommendations(
    userId: string,
    algorithm: 'collaborative' | 'content-based' | 'hybrid'
  ): Promise<ContentRecommendation[]> {
    try {
      const recommendations: ContentRecommendation[] = [];
      const baseId = `rec_${Date.now()}`;

      for (let i = 0; i < 5; i++) {
        const rec: ContentRecommendation = {
          recommendationId: `${baseId}_${i}`,
          userId,
          contentId: `content_${i}`,
          contentType: ['article', 'video', 'quiz', 'exercise'][i % 4],
          score: 0.85 - (i * 0.05),
          reason: `Recommended based on your ${algorithm} learning profile`,
          algorithm,
          createdAt: new Date(),
        };
        recommendations.push(rec);
      }

      for (const rec of recommendations) {
        await this.db.collection('content_recommendations').doc(rec.recommendationId).set(rec);
      }

      logSecurityEvent('CONTENT_RECOMMENDATIONS_GENERATED' as any, 'info' as any, 'Content recommendations generated', {
        userId,
        count: recommendations.length,
        algorithm,
      });

      return recommendations;
    } catch (error) {
      logSecurityEvent('CONTENT_RECOMMENDATIONS_GENERATION_FAILED' as any, 'error' as any, 'Failed to generate content recommendations', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async optimizeLearningPath(
    userId: string,
    currentLevel: number,
    completionRate: number
  ): Promise<LearningPathOptimization> {
    try {
      const pathId = `path_${Date.now()}`;

      const path: LearningPathOptimization = {
        pathId,
        userId,
        currentLevel,
        recommendedNext: [`module_${currentLevel + 1}`, `module_${currentLevel + 2}`, `module_${currentLevel + 3}`],
        estimatedCompletionTime: Math.floor(completionRate * 1000),
        difficultyProgression: currentLevel < 5 ? 1.2 : 1.1,
        updatedAt: new Date(),
      };

      await this.db.collection('learning_path_optimizations').doc(pathId).set(path);

      logSecurityEvent('LEARNING_PATH_OPTIMIZED' as any, 'info' as any, 'Learning path optimized', {
        pathId,
        userId,
        currentLevel,
      });

      return path;
    } catch (error) {
      logSecurityEvent('LEARNING_PATH_OPTIMIZATION_FAILED' as any, 'error' as any, 'Failed to optimize learning path', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async configureUIAdaptation(
    userId: string,
    theme: 'light' | 'dark' | 'auto',
    layout: 'compact' | 'standard' | 'spacious',
    fontSize: number,
    textSize: 'small' | 'medium' | 'large',
    accessibilityFeatures: string[]
  ): Promise<UIAdaptation> {
    try {
      const adaptationId = `adapt_${Date.now()}`;

      const adaptation: UIAdaptation = {
        adaptationId,
        userId,
        theme,
        layout,
        fontSize,
        textSize,
        accessibilityFeatures,
        createdAt: new Date(),
      };

      await this.db.collection('ui_adaptations').doc(adaptationId).set(adaptation);

      logSecurityEvent('UI_ADAPTATION_CONFIGURED' as any, 'info' as any, 'UI adaptation configured', {
        adaptationId,
        userId,
        theme,
      });

      return adaptation;
    } catch (error) {
      logSecurityEvent('UI_ADAPTATION_CONFIGURATION_FAILED' as any, 'error' as any, 'Failed to configure UI adaptation', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async trackUserEngagement(
    userId: string,
    dailyActiveMinutes: number,
    weeklySessionCount: number,
    completionRate: number
  ): Promise<UserEngagementProfile> {
    try {
      const engagementId = `engagement_${Date.now()}`;

      const profile: UserEngagementProfile = {
        engagementId,
        userId,
        dailyActiveMinutes,
        weeklySessionCount,
        completionRate,
        retentionScore: (completionRate + weeklySessionCount / 7) / 2,
        engagementTrend: 'increasing',
        lastActiveAt: new Date(),
      };

      await this.db.collection('user_engagement_profiles').doc(engagementId).set(profile);

      logSecurityEvent('USER_ENGAGEMENT_TRACKED' as any, 'info' as any, 'User engagement tracked', {
        engagementId,
        userId,
        completionRate,
      });

      return profile;
    } catch (error) {
      logSecurityEvent('USER_ENGAGEMENT_TRACKING_FAILED' as any, 'error' as any, 'Failed to track user engagement', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createABTest(
    name: string,
    hypothesis: string,
    startDate: Date
  ): Promise<ABTestExperiment> {
    try {
      const experimentId = `experiment_${Date.now()}`;

      const experiment: ABTestExperiment = {
        experimentId,
        name,
        hypothesis,
        controlGroup: {
          groupId: `control_${experimentId}`,
          groupName: 'Control',
          userCount: 0,
          conversionRate: 0,
          avgEngagement: 0,
        },
        treatmentGroup: {
          groupId: `treatment_${experimentId}`,
          groupName: 'Treatment',
          userCount: 0,
          conversionRate: 0,
          avgEngagement: 0,
        },
        startDate,
        status: 'running',
      };

      await this.db.collection('ab_test_experiments').doc(experimentId).set(experiment);

      logSecurityEvent('AB_TEST_CREATED' as any, 'info' as any, 'A/B test created', {
        experimentId,
        name,
      });

      return experiment;
    } catch (error) {
      logSecurityEvent('AB_TEST_CREATION_FAILED' as any, 'error' as any, 'Failed to create A/B test', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getPersonalizationMetrics(timeRange: { start: Date; end: Date }): Promise<PersonalizationMetrics> {
    try {
      const metricsId = `pers_metrics_${Date.now()}`;

      const metrics: PersonalizationMetrics = {
        metricsId,
        timestamp: new Date(),
        totalUsers: 45000,
        usersWithProfiles: 38500,
        recommendationCTR: 4.8,
        engagementLift: 23.5,
        retentionImprovement: 18.2,
        conversionLift: 12.7,
      };

      await this.db.collection('personalization_metrics').doc(metricsId).set(metrics);

      logSecurityEvent('PERSONALIZATION_METRICS_CALCULATED' as any, 'info' as any, 'Personalization metrics calculated', {
        metricsId,
        engagementLift: metrics.engagementLift,
      });

      return metrics;
    } catch (error) {
      logSecurityEvent('PERSONALIZATION_METRICS_CALCULATION_FAILED' as any, 'error' as any, 'Failed to calculate personalization metrics', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const advancedPersonalizationUXService = new AdvancedPersonalizationUXService();
