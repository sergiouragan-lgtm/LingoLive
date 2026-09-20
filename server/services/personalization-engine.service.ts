import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface UserBehaviorProfile {
  profileId: string;
  userId: string;
  sessionCount: number;
  totalEngagementTime: number;
  averageSessionDuration: number;
  peakActivityTimes: string[];
  contentTypePreferences: Record<string, number>;
  difficultyTendency: number;
  completionRate: number;
  lastUpdatedAt: Date;
}

export interface ContentPreference {
  userId: string;
  contentTypeId: string;
  rating: number;
  engagementScore: number;
  completionRate: number;
  frequency: number;
  lastInteractedAt: Date;
}

export interface DifficultyAdaptation {
  adaptationId: string;
  userId: string;
  concept: string;
  currentDifficulty: number;
  recommendedDifficulty: number;
  adjustmentReason: string;
  effectiveness: number;
  appliedAt: Date;
}

export interface SessionCustomization {
  sessionId: string;
  userId: string;
  contentRecommendations: string[];
  exerciseDifficulty: number;
  suggestedPaceMinutesPerModule: number;
  focusAreas: string[];
  breakSuggestions: boolean;
  interactivityLevel: 'low' | 'medium' | 'high';
  generatedAt: Date;
}

export interface LearningVelocity {
  userId: string;
  conceptId: string;
  modulesCompletedPerWeek: number;
  averageTimePerModule: number;
  velocityTrend: 'increasing' | 'stable' | 'decreasing';
  recommendedAdjustment: 'accelerate' | 'maintain' | 'decelerate';
  lastCalculatedAt: Date;
}

class PersonalizationEngineService {
  private db: FirebaseFirestore.Firestore;
  private behaviorCache: Map<string, UserBehaviorProfile> = new Map();

  constructor() {
    this.db = getFirestore();
    this.initializeBehaviorCache();
  }

  private initializeBehaviorCache(): void {
    setInterval(() => {
      this.behaviorCache.clear();
    }, 300000);
  }

  public async buildBehaviorProfile(userId: string): Promise<UserBehaviorProfile> {
    try {
      if (this.behaviorCache.has(userId)) {
        return this.behaviorCache.get(userId)!;
      }

      const sessionsSnapshot = await this.db
        .collection('learning_sessions')
        .where('userId', '==', userId)
        .get();

      const sessions = sessionsSnapshot.docs.map(doc => doc.data() as any);

      let totalTime = 0;
      let totalDuration = 0;
      const contentTypeScores: Record<string, number> = {};
      const difficultyScores: number[] = [];
      let completedCount = 0;

      for (const session of sessions) {
        totalTime += session.duration || 0;
        totalDuration += 1;
        difficultyScores.push(session.difficulty || 0);
        if (session.contentType) {
          contentTypeScores[session.contentType] = (contentTypeScores[session.contentType] || 0) + 1;
        }
        if (session.completed) completedCount += 1;
      }

      const profile: UserBehaviorProfile = {
        profileId: `profile-${userId}`,
        userId,
        sessionCount: totalDuration,
        totalEngagementTime: totalTime,
        averageSessionDuration: totalDuration > 0 ? totalTime / totalDuration : 0,
        peakActivityTimes: this.calculatePeakTimes(sessions),
        contentTypePreferences: contentTypeScores,
        difficultyTendency: difficultyScores.length > 0 ? difficultyScores.reduce((a, b) => a + b, 0) / difficultyScores.length : 3,
        completionRate: totalDuration > 0 ? completedCount / totalDuration : 0,
        lastUpdatedAt: new Date(),
      };

      this.behaviorCache.set(userId, profile);
      await this.db.collection('behavior_profiles').doc(userId).set(profile);
      logSecurityEvent('BEHAVIOR_PROFILE_BUILT' as any, 'info' as any, 'Behavior profile built', { userId });
      return profile;
    } catch (error) {
      logSecurityEvent('BEHAVIOR_PROFILE_BUILD_FAILED' as any, 'error' as any, 'Behavior profile build failed', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async analyzeContentPreferences(userId: string): Promise<ContentPreference[]> {
    try {
      const prefsSnapshot = await this.db
        .collection('content_interactions')
        .where('userId', '==', userId)
        .get();

      const contentPrefs: Map<string, ContentPreference> = new Map();

      for (const doc of prefsSnapshot.docs) {
        const interaction = doc.data() as any;
        const contentTypeId = interaction.contentTypeId;

        if (!contentPrefs.has(contentTypeId)) {
          contentPrefs.set(contentTypeId, {
            userId,
            contentTypeId,
            rating: 0,
            engagementScore: 0,
            completionRate: 0,
            frequency: 0,
            lastInteractedAt: new Date(),
          });
        }

        const pref = contentPrefs.get(contentTypeId)!;
        pref.frequency += 1;
        pref.rating = (pref.rating + (interaction.rating || 0)) / 2;
        pref.engagementScore = Math.max(pref.engagementScore, interaction.engagementScore || 0);
        pref.completionRate = (pref.completionRate + (interaction.completed ? 1 : 0)) / 2;
        pref.lastInteractedAt = new Date(interaction.timestamp);
      }

      const prefs = Array.from(contentPrefs.values());
      logSecurityEvent('CONTENT_PREFERENCES_ANALYZED' as any, 'info' as any, 'Content preferences analyzed', { userId, count: prefs.length });
      return prefs;
    } catch (error) {
      logSecurityEvent('CONTENT_ANALYSIS_FAILED' as any, 'error' as any, 'Content analysis failed', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async adaptDifficulty(
    userId: string,
    conceptId: string,
    currentScore: number
  ): Promise<DifficultyAdaptation> {
    try {
      const adaptationId = `adapt-${userId}-${conceptId}-${Date.now()}`;

      let recommendedDifficulty = 3;
      let reason = 'baseline';

      if (currentScore > 85) {
        recommendedDifficulty = 5;
        reason = 'mastery';
      } else if (currentScore > 70) {
        recommendedDifficulty = 4;
        reason = 'proficiency';
      } else if (currentScore < 50) {
        recommendedDifficulty = 2;
        reason = 'struggling';
      }

      const adaptation: DifficultyAdaptation = {
        adaptationId,
        userId,
        concept: conceptId,
        currentDifficulty: 3,
        recommendedDifficulty,
        adjustmentReason: reason,
        effectiveness: 0.8,
        appliedAt: new Date(),
      };

      await this.db.collection('difficulty_adaptations').doc(adaptationId).set(adaptation);
      logSecurityEvent('DIFFICULTY_ADAPTED' as any, 'info' as any, 'Difficulty adapted', { userId, conceptId, newDifficulty: recommendedDifficulty });
      return adaptation;
    } catch (error) {
      logSecurityEvent('DIFFICULTY_ADAPTATION_FAILED' as any, 'error' as any, 'Difficulty adaptation failed', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async generateSessionCustomization(userId: string): Promise<SessionCustomization> {
    try {
      const sessionId = `session-${userId}-${Date.now()}`;
      const profile = await this.buildBehaviorProfile(userId);
      const contentPrefs = await this.analyzeContentPreferences(userId);

      const topContentTypes = contentPrefs
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, 3)
        .map(p => p.contentTypeId);

      const customization: SessionCustomization = {
        sessionId,
        userId,
        contentRecommendations: topContentTypes,
        exerciseDifficulty: Math.round(profile.difficultyTendency),
        suggestedPaceMinutesPerModule: Math.max(30, Math.min(60, profile.averageSessionDuration)),
        focusAreas: this.identifyFocusAreas(profile),
        breakSuggestions: profile.averageSessionDuration > 60,
        interactivityLevel: profile.completionRate > 0.8 ? 'high' : 'medium',
        generatedAt: new Date(),
      };

      await this.db.collection('session_customizations').doc(sessionId).set(customization);
      logSecurityEvent('SESSION_CUSTOMIZED' as any, 'info' as any, 'Session customized', { userId, sessionId });
      return customization;
    } catch (error) {
      logSecurityEvent('SESSION_CUSTOMIZATION_FAILED' as any, 'error' as any, 'Session customization failed', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async calculateLearningVelocity(userId: string, conceptId: string): Promise<LearningVelocity> {
    try {
      const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);

      const sessionsSnapshot = await this.db
        .collection('learning_sessions')
        .where('userId', '==', userId)
        .where('concept', '==', conceptId)
        .where('timestamp', '>=', fourWeeksAgo)
        .get();

      const completedCount = sessionsSnapshot.docs.filter(d => (d.data() as any).completed).length;
      const totalTime = sessionsSnapshot.docs.reduce((sum, d) => sum + ((d.data() as any).duration || 0), 0);
      const averageTime = completedCount > 0 ? totalTime / completedCount : 0;

      let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
      let recommendation: 'accelerate' | 'maintain' | 'decelerate' = 'maintain';

      if (averageTime < 30) {
        trend = 'increasing';
        recommendation = 'accelerate';
      } else if (averageTime > 60) {
        trend = 'decreasing';
        recommendation = 'decelerate';
      }

      const velocity: LearningVelocity = {
        userId,
        conceptId,
        modulesCompletedPerWeek: completedCount / 4,
        averageTimePerModule: averageTime,
        velocityTrend: trend,
        recommendedAdjustment: recommendation,
        lastCalculatedAt: new Date(),
      };

      await this.db.collection('learning_velocities').doc(`${userId}-${conceptId}`).set(velocity);
      logSecurityEvent('LEARNING_VELOCITY_CALCULATED' as any, 'info' as any, 'Learning velocity calculated', { userId, conceptId });
      return velocity;
    } catch (error) {
      logSecurityEvent('VELOCITY_CALCULATION_FAILED' as any, 'error' as any, 'Velocity calculation failed', { userId, error: (error as Error).message });
      throw error;
    }
  }

  private calculatePeakTimes(sessions: any[]): string[] {
    const timeDistribution: Record<string, number> = {};

    for (const session of sessions) {
      const hour = new Date(session.timestamp?.toDate?.() || new Date()).getHours();
      timeDistribution[hour] = (timeDistribution[hour] || 0) + 1;
    }

    return Object.entries(timeDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);
  }

  private identifyFocusAreas(profile: UserBehaviorProfile): string[] {
    const areas: string[] = [];

    if (profile.completionRate < 0.7) areas.push('completion');
    if (profile.difficultyTendency < 2) areas.push('foundational');
    if (profile.averageSessionDuration < 30) areas.push('endurance');

    return areas;
  }
}

export const personalizationEngineService = new PersonalizationEngineService();
