import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore, DocumentData } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

/**
 * Represents a single error/mistake logged by a student
 */
export interface StudentErrorLog {
  id: string;
  userId: string;
  timestamp: Date;
  lessonId: string;
  exerciseId: string;
  language: string;
  skillArea: string; // e.g., 'grammar', 'vocabulary', 'pronunciation'
  skillSubArea: string; // e.g., 'past-tense', 'articles', 'vowels'
  correctAnswer: string;
  studentAnswer: string;
  errorType: 'incorrect' | 'partial' | 'timeout' | 'skipped';
  confidence?: number; // 0-100, student's confidence level
  contextMetadata?: {
    difficultyLevel?: string;
    attemptNumber?: number;
    timeSpentMs?: number;
  };
}

/**
 * Represents aggregated learning gaps for a student
 */
export interface StudentLearningGap {
  userId: string;
  skillArea: string;
  skillSubArea: string;
  language: string;
  errorCount: number;
  errorRate: number; // 0-100
  lastErrorAt: Date;
  firstErrorAt: Date;
  relatedExercises: string[];
  recommendedActions: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  aggregatedAt: Date;
  status: 'active' | 'closed';
}

/**
 * Learning gap aggregation statistics
 */
export interface AggregationStats {
  totalErrorsProcessed: number;
  gapsCreated: number;
  gapsUpdated: number;
  usersAffected: number;
  executionTimeMs: number;
  timestamp: Date;
}

class LearningGapAggregationService {
  private db: Firestore;
  private readonly ERROR_THRESHOLD = 3; // Minimum errors to create a gap
  private readonly RECENT_DAYS = 7; // Consider errors from last 7 days

  constructor() {
    this.db = getFirestore();
  }

  /**
   * Log an error for a student
   */
  public async logStudentError(errorLog: Omit<StudentErrorLog, 'id'>): Promise<StudentErrorLog> {
    try {
      const errorId = this.db.collection('student_error_logs').doc().id;
      const log: StudentErrorLog = {
        ...errorLog,
        id: errorId,
        timestamp: errorLog.timestamp || new Date(),
      };

      await this.db.collection('student_error_logs').doc(errorId).set(log);

      logSecurityEvent(
        'STUDENT_ERROR_LOGGED' as any,
        'info' as any,
        `Error logged for user ${errorLog.userId} in ${errorLog.skillSubArea}`
      );

      return log;
    } catch (error) {
      console.error('Error logging student error:', error);
      throw new Error(`Failed to log student error: ${(error as Error).message}`);
    }
  }

  /**
   * Aggregate errors into learning gaps for a specific user
   */
  public async aggregateUserGaps(userId: string): Promise<StudentLearningGap[]> {
    try {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - this.RECENT_DAYS);

      // Get recent errors for this user
      const errorSnapshot = await this.db
        .collection('student_error_logs')
        .where('userId', '==', userId)
        .where('timestamp', '>=', recentDate)
        .orderBy('timestamp', 'desc')
        .get();

      if (errorSnapshot.empty) {
        return [];
      }

      // Group errors by skill area and sub-area
      const groupedErrors = new Map<string, StudentErrorLog[]>();

      errorSnapshot.forEach((doc) => {
        const error = doc.data() as StudentErrorLog;
        const key = `${error.skillArea}:${error.skillSubArea}:${error.language}`;

        if (!groupedErrors.has(key)) {
          groupedErrors.set(key, []);
        }
        groupedErrors.get(key)!.push(error);
      });

      // Create/update learning gaps
      const gaps: StudentLearningGap[] = [];

      for (const [key, errors] of groupedErrors.entries()) {
        const [skillArea, skillSubArea, language] = key.split(':');

        // Only create gap if error count meets threshold
        if (errors.length >= this.ERROR_THRESHOLD) {
          const errorRate = (errors.length / errorSnapshot.size) * 100;
          const sortedByTime = [...errors].sort((a, b) =>
            (b.timestamp as any) - (a.timestamp as any)
          );

          const gap: StudentLearningGap = {
            userId,
            skillArea,
            skillSubArea,
            language,
            errorCount: errors.length,
            errorRate: Math.round(errorRate),
            lastErrorAt: sortedByTime[0].timestamp,
            firstErrorAt: sortedByTime[sortedByTime.length - 1].timestamp,
            relatedExercises: [...new Set(errors.map(e => e.exerciseId))],
            recommendedActions: this.generateRecommendations(skillArea, skillSubArea, errorRate),
            priority: this.calculatePriority(errorRate, errors.length),
            aggregatedAt: new Date(),
            status: 'active',
          };

          gaps.push(gap);

          // Save or update the learning gap
          const gapId = `${userId}:${skillArea}:${skillSubArea}:${language}`;
          await this.db.collection('student_learning_gaps').doc(gapId).set(gap, { merge: true });
        }
      }

      return gaps;
    } catch (error) {
      console.error('Error aggregating user gaps:', error);
      throw new Error(`Failed to aggregate learning gaps: ${(error as Error).message}`);
    }
  }

  /**
   * Run batch aggregation for all users (typically called by a scheduled job)
   */
  public async aggregateAllGaps(limitUsers?: number): Promise<AggregationStats> {
    try {
      const startTime = Date.now();
      let totalErrorsProcessed = 0;
      let gapsCreated = 0;
      let gapsUpdated = 0;
      const usersAffected = new Set<string>();

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - this.RECENT_DAYS);

      // Get all recent errors
      const errorSnapshot = await this.db
        .collection('student_error_logs')
        .where('timestamp', '>=', recentDate)
        .get();

      totalErrorsProcessed = errorSnapshot.size;

      // Get unique users
      const userIds = new Set<string>();
      errorSnapshot.forEach((doc) => {
        const error = doc.data() as StudentErrorLog;
        userIds.add(error.userId);
      });

      const usersToProcess = limitUsers
        ? Array.from(userIds).slice(0, limitUsers)
        : Array.from(userIds);

      // Process each user
      for (const userId of usersToProcess) {
        const gaps = await this.aggregateUserGaps(userId);

        if (gaps.length > 0) {
          usersAffected.add(userId);
          // Count new vs updated gaps (simplified - in production track separately)
          gapsCreated += gaps.length;
        }
      }

      const executionTimeMs = Date.now() - startTime;

      const stats: AggregationStats = {
        totalErrorsProcessed,
        gapsCreated,
        gapsUpdated: 0, // Track separately in production
        usersAffected: usersAffected.size,
        executionTimeMs,
        timestamp: new Date(),
      };

      // Log aggregation stats
      await this.db.collection('aggregation_stats').doc().set(stats);

      logSecurityEvent(
        'LEARNING_GAPS_AGGREGATED' as any,
        'info' as any,
        `Aggregated ${stats.gapsCreated} gaps for ${stats.usersAffected} users`
      );

      return stats;
    } catch (error) {
      console.error('Error during batch aggregation:', error);
      throw new Error(`Batch aggregation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get learning gaps for a user
   */
  public async getUserGaps(userId: string): Promise<StudentLearningGap[]> {
    try {
      const snapshot = await this.db
        .collection('student_learning_gaps')
        .where('userId', '==', userId)
        .where('status', '==', 'active')
        .orderBy('priority')
        .get();

      return snapshot.docs.map(doc => doc.data() as StudentLearningGap);
    } catch (error) {
      console.error('Error fetching user gaps:', error);
      throw new Error(`Failed to fetch learning gaps: ${(error as Error).message}`);
    }
  }

  /**
   * Get learning gaps by skill area
   */
  public async getGapsBySkillArea(
    userId: string,
    skillArea: string
  ): Promise<StudentLearningGap[]> {
    try {
      const snapshot = await this.db
        .collection('student_learning_gaps')
        .where('userId', '==', userId)
        .where('skillArea', '==', skillArea)
        .where('status', '==', 'active')
        .get();

      return snapshot.docs.map(doc => doc.data() as StudentLearningGap);
    } catch (error) {
      console.error('Error fetching gaps by skill area:', error);
      throw new Error(`Failed to fetch gaps: ${(error as Error).message}`);
    }
  }

  /**
   * Mark a learning gap as closed (resolved)
   */
  public async closeGap(userId: string, skillArea: string, skillSubArea: string, language: string): Promise<void> {
    try {
      const gapId = `${userId}:${skillArea}:${skillSubArea}:${language}`;
      await this.db.collection('student_learning_gaps').doc(gapId).update({
        status: 'closed',
        closedAt: new Date(),
      });

      logSecurityEvent(
        'LEARNING_GAP_CLOSED' as any,
        'info' as any,
        `Gap closed for user ${userId}`
      );
    } catch (error) {
      console.error('Error closing gap:', error);
      throw new Error(`Failed to close gap: ${(error as Error).message}`);
    }
  }

  /**
   * Generate personalized recommendations based on gaps
   */
  private generateRecommendations(
    skillArea: string,
    skillSubArea: string,
    errorRate: number
  ): string[] {
    const recommendations: string[] = [];

    recommendations.push(`Practice ${skillSubArea} exercises regularly`);

    if (errorRate > 50) {
      recommendations.push(`Review foundational concepts in ${skillArea}`);
      recommendations.push('Consider a focused learning module');
    }

    if (errorRate > 70) {
      recommendations.push('Book a tutoring session for intensive help');
    }

    recommendations.push(`Use spaced repetition for ${skillSubArea}`);

    return recommendations;
  }

  /**
   * Calculate priority based on error rate and frequency
   */
  private calculatePriority(errorRate: number, errorCount: number): 'critical' | 'high' | 'medium' | 'low' {
    if (errorRate > 70 || errorCount > 10) return 'critical';
    if (errorRate > 50 || errorCount > 7) return 'high';
    if (errorRate > 30 || errorCount > 5) return 'medium';
    return 'low';
  }

  /**
   * Get aggregation statistics
   */
  public async getAggregationStats(limitDays: number = 7): Promise<AggregationStats[]> {
    try {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - limitDays);

      const snapshot = await this.db
        .collection('aggregation_stats')
        .where('timestamp', '>=', sinceDate)
        .orderBy('timestamp', 'desc')
        .get();

      return snapshot.docs.map(doc => doc.data() as AggregationStats);
    } catch (error) {
      console.error('Error fetching aggregation stats:', error);
      throw new Error(`Failed to fetch stats: ${(error as Error).message}`);
    }
  }
}

export const learningGapAggregationService = new LearningGapAggregationService();
