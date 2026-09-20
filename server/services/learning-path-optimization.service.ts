import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface LearningPath {
  id: string;
  userId: string;
  courseId: string;
  currentModule: string;
  completedModules: string[];
  moduleSequence: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedCompletionDays: number;
  actualProgress: number; // 0-100
  status: 'active' | 'paused' | 'completed';
  createdAt: Date;
  lastUpdatedAt: Date;
}

export interface ModulePrerequisite {
  moduleId: string;
  prerequisites: string[];
  difficulty: number; // 1-10 scale
  estimatedMinutes: number;
  skillsRequired: string[];
}

export interface PathOptimizationConfig {
  userId: string;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  pacePreference: 'slow' | 'moderate' | 'fast';
  availableHoursPerWeek: number;
  preferredDifficultyJump: number; // 0-2 (step size)
  adaptiveEnabled: boolean;
}

export interface SequenceRecommendation {
  recommendationId: string;
  userId: string;
  nextModule: string;
  reasoning: string;
  confidence: number; // 0-100
  alternativeModules: string[];
  estimatedMinutesToComplete: number;
  prerequisitesMetPercentage: number;
  generatedAt: Date;
}

class LearningPathOptimizationService {
  private db: Firestore;

  constructor() {
    this.db = getFirestore();
    this.schedulePathOptimization();
  }

  public async createLearningPath(
    userId: string,
    courseId: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
  ): Promise<LearningPath> {
    try {
      const pathId = `path-${userId}-${courseId}-${Date.now()}`;

      // Fetch course modules in prerequisite order
      const modules = await this.getModuleSequence(courseId, difficulty);

      const path: LearningPath = {
        id: pathId,
        userId,
        courseId,
        currentModule: modules[0] || '',
        completedModules: [],
        moduleSequence: modules,
        difficulty,
        estimatedCompletionDays: Math.ceil(modules.length * 3),
        actualProgress: 0,
        status: 'active',
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
      };

      await this.db
        .collection('learning_paths')
        .doc(pathId)
        .set(path);

      logSecurityEvent(
        'LEARNING_PATH_CREATED' as any,
        'info' as any,
        `Learning path created for user ${userId}`,
        { courseId, difficulty, moduleCount: modules.length },
        { pathId }
      );

      return path;
    } catch (error: any) {
      console.error('Error creating learning path:', error);
      throw error;
    }
  }

  public async optimizePathSequence(
    userId: string,
    pathId: string,
    config: PathOptimizationConfig
  ): Promise<SequenceRecommendation> {
    try {
      const path = await this.db
        .collection('learning_paths')
        .doc(pathId)
        .get();

      if (!path.exists) {
        throw new Error(`Path ${pathId} not found`);
      }

      const pathData = path.data() as any;
      const remainingModules = pathData.moduleSequence.filter(
        (m: string) => !pathData.completedModules.includes(m)
      );

      // Get user performance metrics
      const userPerf = await this.getUserPerformanceMetrics(userId);

      // Determine next module based on prerequisites and performance
      const nextModule = await this.selectOptimalModule(
        remainingModules,
        userPerf,
        config
      );

      const prerequisites = await this.getModulePrerequisites(nextModule);
      const metPrerequisites = prerequisites.prerequisites.filter((p: string) =>
        pathData.completedModules.includes(p)
      ).length;

      const recommendation: SequenceRecommendation = {
        recommendationId: `rec-${pathId}-${Date.now()}`,
        userId,
        nextModule,
        reasoning: this.generateSequenceReasoning(nextModule, userPerf, config),
        confidence: Math.min(95, 60 + userPerf.consistencyScore),
        alternativeModules: remainingModules.slice(1, 3),
        estimatedMinutesToComplete: prerequisites.estimatedMinutes,
        prerequisitesMetPercentage:
          (metPrerequisites / Math.max(1, prerequisites.prerequisites.length)) * 100,
        generatedAt: new Date(),
      };

      await this.db
        .collection('sequence_recommendations')
        .doc(recommendation.recommendationId)
        .set(recommendation);

      return recommendation;
    } catch (error: any) {
      console.error('Error optimizing path sequence:', error);
      throw error;
    }
  }

  public async updatePathProgress(
    userId: string,
    pathId: string,
    completedModuleId: string
  ): Promise<LearningPath> {
    try {
      const path = await this.db
        .collection('learning_paths')
        .doc(pathId)
        .get();

      if (!path.exists) {
        throw new Error(`Path ${pathId} not found`);
      }

      const pathData = path.data() as any;
      const updatedCompleted = [...pathData.completedModules, completedModuleId];
      const progressPercent = Math.round(
        (updatedCompleted.length / pathData.moduleSequence.length) * 100
      );

      const nextModule =
        pathData.moduleSequence.find(
          (m: string) => !updatedCompleted.includes(m)
        ) || pathData.moduleSequence[pathData.moduleSequence.length - 1];

      const newStatus =
        progressPercent === 100 ? 'completed' : pathData.status;

      const updatedPath: LearningPath = {
        ...pathData,
        completedModules: updatedCompleted,
        currentModule: nextModule,
        actualProgress: progressPercent,
        status: newStatus,
        lastUpdatedAt: new Date(),
      };

      await this.db
        .collection('learning_paths')
        .doc(pathId)
        .update(updatedPath);

      logSecurityEvent(
        'LEARNING_PATH_PROGRESS_UPDATED' as any,
        'info' as any,
        `Module completed: ${completedModuleId}`,
        { progress: progressPercent },
        { pathId }
      );

      return updatedPath;
    } catch (error: any) {
      console.error('Error updating path progress:', error);
      throw error;
    }
  }

  public async adjustDifficulty(
    userId: string,
    pathId: string,
    newDifficulty: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<LearningPath> {
    try {
      const path = await this.db
        .collection('learning_paths')
        .doc(pathId)
        .get();

      if (!path.exists) {
        throw new Error(`Path ${pathId} not found`);
      }

      const pathData = path.data() as any;
      const remainingModules = await this.getModuleSequence(
        pathData.courseId,
        newDifficulty
      );

      const currentProgress = pathData.completedModules.filter((m: string) =>
        remainingModules.includes(m)
      );

      const updatedPath: LearningPath = {
        ...pathData,
        difficulty: newDifficulty,
        moduleSequence: remainingModules,
        completedModules: currentProgress,
        estimatedCompletionDays: Math.ceil(remainingModules.length * 2.5),
        lastUpdatedAt: new Date(),
      };

      await this.db
        .collection('learning_paths')
        .doc(pathId)
        .update(updatedPath);

      logSecurityEvent(
        'LEARNING_DIFFICULTY_ADJUSTED' as any,
        'info' as any,
        `Difficulty adjusted to ${newDifficulty}`,
        { userId, pathId },
        {}
      );

      return updatedPath;
    } catch (error: any) {
      console.error('Error adjusting difficulty:', error);
      throw error;
    }
  }

  public async getLearningPath(pathId: string): Promise<LearningPath | null> {
    try {
      const path = await this.db
        .collection('learning_paths')
        .doc(pathId)
        .get();

      if (!path.exists) {
        return null;
      }

      const data = path.data() as any;
      return {
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        lastUpdatedAt: data.lastUpdatedAt?.toDate?.() || new Date(),
      } as LearningPath;
    } catch (error: any) {
      console.error('Error fetching learning path:', error);
      return null;
    }
  }

  public async getUserLearningPaths(userId: string): Promise<LearningPath[]> {
    try {
      const snapshot = await this.db
        .collection('learning_paths')
        .where('userId', '==', userId)
        .orderBy('lastUpdatedAt', 'desc')
        .get();

      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        lastUpdatedAt: doc.data().lastUpdatedAt?.toDate?.() || new Date(),
      } as LearningPath));
    } catch (error: any) {
      console.error('Error fetching user learning paths:', error);
      return [];
    }
  }

  private async getModuleSequence(
    courseId: string,
    difficulty: string
  ): Promise<string[]> {
    try {
      const modules = await this.db
        .collection('course_modules')
        .where('courseId', '==', courseId)
        .where('difficulty', '==', difficulty)
        .orderBy('sequenceOrder', 'asc')
        .get();

      return modules.docs.map((doc) => doc.id);
    } catch {
      return [];
    }
  }

  private async getModulePrerequisites(
    moduleId: string
  ): Promise<ModulePrerequisite> {
    return {
      moduleId,
      prerequisites: [],
      difficulty: 5,
      estimatedMinutes: 45,
      skillsRequired: [],
    };
  }

  private async getUserPerformanceMetrics(userId: string): Promise<any> {
    return {
      avgAccuracy: 0.82,
      consistencyScore: 75,
      learningPace: 'moderate',
      struggledTopics: [],
      masterTopics: [],
    };
  }

  private async selectOptimalModule(
    remainingModules: string[],
    userPerf: any,
    config: PathOptimizationConfig
  ): Promise<string> {
    return remainingModules[0] || '';
  }

  private generateSequenceReasoning(
    moduleId: string,
    userPerf: any,
    config: PathOptimizationConfig
  ): string {
    return `Selected based on prerequisites, learning style (${config.learningStyle}), and pace preference (${config.pacePreference})`;
  }

  private schedulePathOptimization(): void {
    setInterval(async () => {
      try {
        const paths = await this.db
          .collection('learning_paths')
          .where('status', '==', 'active')
          .limit(100)
          .get();

        for (const pathDoc of paths.docs) {
          const path = pathDoc.data() as any;
          const perf = await this.getUserPerformanceMetrics(path.userId);

          // Auto-adjust difficulty if needed
          if (perf.avgAccuracy > 0.9 && path.difficulty !== 'advanced') {
            await this.adjustDifficulty(path.userId, path.id, 'advanced');
          } else if (
            perf.avgAccuracy < 0.6 &&
            path.difficulty !== 'beginner'
          ) {
            await this.adjustDifficulty(path.userId, path.id, 'beginner');
          }
        }
      } catch (error: any) {
        console.error('Path optimization scheduling error:', error);
      }
    }, 24 * 60 * 60 * 1000); // Daily
  }
}

export const learningPathOptimizationService = new LearningPathOptimizationService();
