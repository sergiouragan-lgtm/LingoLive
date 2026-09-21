import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface AdaptiveLearningPath {
  pathId: string;
  userId: string;
  targetLanguage: string;
  proficiencyLevel: string;
  basePathId?: string;
  currentModuleId: string;
  completedModules: string[];
  upcomingModules: string[];
  adjustmentHistory: PathAdjustment[];
  nextRecommendedModule: string;
  estimatedCompletionDate: Date;
  lastAdjustedAt: Date;
  generatedAt: Date;
}

export interface PathAdjustment {
  adjustmentId: string;
  timestamp: Date;
  reason: 'performance' | 'pace' | 'preference' | 'prerequisite' | 'manual';
  previousModuleId: string;
  newModuleId: string;
  impactMetrics: {
    estimatedTimeReduction: number;
    difficultyChange: number;
    relevanceImprovement: number;
  };
}

export interface ModuleSequence {
  moduleId: string;
  title: string;
  description: string;
  concept: string;
  difficulty: number;
  estimatedDuration: number;
  prerequisites: string[];
  objectives: string[];
  assessmentType: string;
  successCriteria: Record<string, any>;
}

export interface LearningPreference {
  userId: string;
  preferredPace: 'slow' | 'moderate' | 'fast' | 'adaptive';
  preferredModuleType: string;
  preferredDuration: number;
  skipDifficulty: boolean;
  focusAreas: string[];
  avoidAreas: string[];
  updatedAt: Date;
}

export interface PathPerformanceMetrics {
  pathId: string;
  moduleId: string;
  completionRate: number;
  averageScore: number;
  timeSpent: number;
  engagementLevel: number;
  mistakePatterns: string[];
  reinforcementNeeded: boolean;
}

class AdaptiveLearningPathsService {
  private db: Firestore;

  constructor() {
    this.db = getFirestore();
  }

  public async generateAdaptivePath(
    userId: string,
    targetLanguage: string,
    proficiencyLevel: string
  ): Promise<AdaptiveLearningPath> {
    try {
      const pathId = `path-${userId}-${targetLanguage}-${Date.now()}`;

      const prefsDoc = await this.db.collection('learning_preferences').doc(userId).get();
      const prefs = prefsDoc.exists ? (prefsDoc.data() as LearningPreference) : null;

      const modules = await this.generateModuleSequence(proficiencyLevel, prefs?.focusAreas || []);

      const path: AdaptiveLearningPath = {
        pathId,
        userId,
        targetLanguage,
        proficiencyLevel,
        currentModuleId: modules[0]?.moduleId || '',
        completedModules: [],
        upcomingModules: modules.slice(1).map(m => m.moduleId),
        adjustmentHistory: [],
        nextRecommendedModule: modules[1]?.moduleId || '',
        estimatedCompletionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        lastAdjustedAt: new Date(),
        generatedAt: new Date(),
      };

      await this.db.collection('adaptive_learning_paths').doc(pathId).set(path);
      logSecurityEvent('ADAPTIVE_PATH_GENERATED' as any, 'info' as any, 'Adaptive learning path generated', { userId, targetLanguage, pathId });
      return path;
    } catch (error) {
      logSecurityEvent('ADAPTIVE_PATH_GENERATION_FAILED' as any, 'error' as any, 'Adaptive path generation failed', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async adjustPathBasedOnPerformance(
    pathId: string,
    userId: string,
    modulePerformance: PathPerformanceMetrics
  ): Promise<AdaptiveLearningPath | null> {
    try {
      const pathDoc = await this.db.collection('adaptive_learning_paths').doc(pathId).get();
      if (!pathDoc.exists) return null;

      const path = pathDoc.data() as AdaptiveLearningPath;

      if (modulePerformance.averageScore < 60) {
        return await this.adjustPathForStruggle(pathId, path, modulePerformance);
      } else if (modulePerformance.averageScore > 85) {
        return await this.adjustPathForAdvancement(pathId, path, modulePerformance);
      }

      return path;
    } catch (error) {
      logSecurityEvent('PATH_ADJUSTMENT_FAILED' as any, 'error' as any, 'Path adjustment failed', { pathId, userId, error: (error as Error).message });
      throw error;
    }
  }

  public async updateModuleCompletion(
    pathId: string,
    moduleId: string,
    score: number,
    timeSpent: number
  ): Promise<AdaptiveLearningPath> {
    try {
      const pathDoc = await this.db.collection('adaptive_learning_paths').doc(pathId).get();
      if (!pathDoc.exists) throw new Error('Path not found');

      const path = pathDoc.data() as AdaptiveLearningPath;
      const completedModules = [...path.completedModules, moduleId];
      const upcomingModules = path.upcomingModules.filter(m => m !== moduleId);

      const metrics: PathPerformanceMetrics = {
        pathId,
        moduleId,
        completionRate: 100,
        averageScore: score,
        timeSpent,
        engagementLevel: Math.min(100, (timeSpent / 60) * 10),
        mistakePatterns: [],
        reinforcementNeeded: score < 70,
      };

      await this.db.collection('path_performance_metrics').doc(`${pathId}-${moduleId}`).set(metrics);

      const adjusted = await this.adjustPathBasedOnPerformance(pathId, path.userId, metrics);

      await this.db.collection('adaptive_learning_paths').doc(pathId).update({
        currentModuleId: upcomingModules[0] || moduleId,
        completedModules,
        upcomingModules,
        lastAdjustedAt: new Date(),
      });

      logSecurityEvent('MODULE_COMPLETION_RECORDED' as any, 'info' as any, 'Module completion recorded', { pathId, moduleId, score });
      return adjusted || path;
    } catch (error) {
      logSecurityEvent('MODULE_COMPLETION_RECORDING_FAILED' as any, 'error' as any, 'Module completion recording failed', { pathId, error: (error as Error).message });
      throw error;
    }
  }

  public async getAdaptivePath(pathId: string): Promise<AdaptiveLearningPath> {
    try {
      const pathDoc = await this.db.collection('adaptive_learning_paths').doc(pathId).get();
      if (!pathDoc.exists) throw new Error('Path not found');

      return pathDoc.data() as AdaptiveLearningPath;
    } catch (error) {
      logSecurityEvent('ADAPTIVE_PATH_FETCH_FAILED' as any, 'error' as any, 'Adaptive path fetch failed', { pathId, error: (error as Error).message });
      throw error;
    }
  }

  public async setLearningPreferences(
    userId: string,
    preferences: Partial<LearningPreference>
  ): Promise<LearningPreference> {
    try {
      const prefs: LearningPreference = {
        userId,
        preferredPace: preferences.preferredPace || 'adaptive',
        preferredModuleType: preferences.preferredModuleType || 'mixed',
        preferredDuration: preferences.preferredDuration || 45,
        skipDifficulty: preferences.skipDifficulty || false,
        focusAreas: preferences.focusAreas || [],
        avoidAreas: preferences.avoidAreas || [],
        updatedAt: new Date(),
      };

      await this.db.collection('learning_preferences').doc(userId).set(prefs);
      logSecurityEvent('LEARNING_PREFERENCES_SET' as any, 'info' as any, 'Learning preferences set', { userId });
      return prefs;
    } catch (error) {
      logSecurityEvent('LEARNING_PREFERENCES_FAILED' as any, 'error' as any, 'Learning preferences setting failed', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async predictCompletionDate(pathId: string): Promise<{ estimatedDate: Date; confidence: number }> {
    try {
      const pathDoc = await this.db.collection('adaptive_learning_paths').doc(pathId).get();
      if (!pathDoc.exists) throw new Error('Path not found');

      const path = pathDoc.data() as AdaptiveLearningPath;
      const remainingModules = path.upcomingModules.length;
      const avgTimePerModule = 45;
      const daysToComplete = Math.ceil((remainingModules * avgTimePerModule) / 60 / 5);

      const estimatedDate = new Date(Date.now() + daysToComplete * 24 * 60 * 60 * 1000);

      logSecurityEvent('COMPLETION_DATE_PREDICTED' as any, 'info' as any, 'Completion date predicted', { pathId, daysToComplete });
      return { estimatedDate, confidence: 0.75 };
    } catch (error) {
      logSecurityEvent('COMPLETION_PREDICTION_FAILED' as any, 'error' as any, 'Completion prediction failed', { pathId, error: (error as Error).message });
      throw error;
    }
  }

  private async adjustPathForStruggle(
    pathId: string,
    path: AdaptiveLearningPath,
    metrics: PathPerformanceMetrics
  ): Promise<AdaptiveLearningPath> {
    const adjustment: PathAdjustment = {
      adjustmentId: `adj-${pathId}-${Date.now()}`,
      timestamp: new Date(),
      reason: 'performance',
      previousModuleId: metrics.moduleId,
      newModuleId: metrics.moduleId,
      impactMetrics: {
        estimatedTimeReduction: -30,
        difficultyChange: -1,
        relevanceImprovement: 0.2,
      },
    };

    await this.db.collection('adaptive_learning_paths').doc(pathId).update({
      adjustmentHistory: [...path.adjustmentHistory, adjustment],
      lastAdjustedAt: new Date(),
    });

    return path;
  }

  private async adjustPathForAdvancement(
    pathId: string,
    path: AdaptiveLearningPath,
    metrics: PathPerformanceMetrics
  ): Promise<AdaptiveLearningPath> {
    const adjustment: PathAdjustment = {
      adjustmentId: `adj-${pathId}-${Date.now()}`,
      timestamp: new Date(),
      reason: 'pace',
      previousModuleId: metrics.moduleId,
      newModuleId: path.nextRecommendedModule,
      impactMetrics: {
        estimatedTimeReduction: 15,
        difficultyChange: 1,
        relevanceImprovement: 0.15,
      },
    };

    await this.db.collection('adaptive_learning_paths').doc(pathId).update({
      adjustmentHistory: [...path.adjustmentHistory, adjustment],
      lastAdjustedAt: new Date(),
    });

    return path;
  }

  private async generateModuleSequence(
    proficiencyLevel: string,
    focusAreas: string[]
  ): Promise<ModuleSequence[]> {
    const modules: ModuleSequence[] = [
      {
        moduleId: 'mod-intro-1',
        title: 'Foundation Review',
        description: 'Review basic grammar and vocabulary',
        concept: 'fundamentals',
        difficulty: 1,
        estimatedDuration: 45,
        prerequisites: [],
        objectives: ['Review basics', 'Build confidence'],
        assessmentType: 'quiz',
        successCriteria: { minimumScore: 70 },
      },
      {
        moduleId: 'mod-conversation-1',
        title: 'Conversational Starters',
        description: 'Common phrases and greetings',
        concept: 'conversation',
        difficulty: 2,
        estimatedDuration: 50,
        prerequisites: ['mod-intro-1'],
        objectives: ['Learn greetings', 'Practice pronunciation'],
        assessmentType: 'speaking',
        successCriteria: { minimumScore: 75 },
      },
    ];

    return modules;
  }
}

export const adaptiveLearningPathsService = new AdaptiveLearningPathsService();
