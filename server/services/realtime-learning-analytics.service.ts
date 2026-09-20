import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface LearningSession {
  sessionId: string;
  userId: string;
  moduleId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // seconds
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number; // 0-100
  timePerQuestion: number; // average seconds
  struggledConcepts: string[];
  status: 'in_progress' | 'completed' | 'abandoned';
}

export interface PerformanceMetrics {
  userId: string;
  moduleId: string;
  totalSessions: number;
  avgAccuracy: number;
  avgSessionDuration: number;
  improvementTrend: number; // -100 to +100
  masteryLevel: number; // 0-100
  lastAssessed: Date;
}

export interface StruggleIndicator {
  indicatorId: string;
  userId: string;
  moduleId: string;
  concept: string;
  severity: 'low' | 'medium' | 'high'; // based on error frequency
  firstDetectedAt: Date;
  lastDetectedAt: Date;
  interventionSuggestion: string;
  interventionApplied: boolean;
}

export interface InterventionTrigger {
  triggerId: string;
  userId: string;
  triggerType: 'low_accuracy' | 'high_struggle' | 'low_engagement' | 'pace_mismatch';
  severity: number; // 1-10
  recommendedAction: string;
  timestamp: Date;
  actionTaken?: string;
}

export interface LearningPaceAnalysis {
  userId: string;
  moduleId: string;
  paceCategory: 'too_slow' | 'optimal' | 'too_fast';
  avgMinutesPerModule: number;
  recommendedPaceMinutes: number;
  adjustmentFactor: number; // 0.5-2.0 multiplier
  confidence: number; // 0-100
}

class RealTimeLearningAnalyticsService {
  private db: Firestore;
  private activeSessions: Map<string, any> = new Map();

  constructor() {
    this.db = getFirestore();
    this.scheduleMetricsAggregation();
  }

  public async startLearningSession(
    userId: string,
    moduleId: string
  ): Promise<LearningSession> {
    try {
      const sessionId = `session-${userId}-${moduleId}-${Date.now()}`;

      const session: LearningSession = {
        sessionId,
        userId,
        moduleId,
        startTime: new Date(),
        duration: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        accuracy: 0,
        timePerQuestion: 0,
        struggledConcepts: [],
        status: 'in_progress',
      };

      this.activeSessions.set(sessionId, session);

      await this.db
        .collection('learning_sessions')
        .doc(sessionId)
        .set(session);

      logSecurityEvent(
        'LEARNING_SESSION_STARTED' as any,
        'info' as any,
        `Learning session started`,
        { userId, moduleId },
        { sessionId }
      );

      return session;
    } catch (error: any) {
      console.error('Error starting learning session:', error);
      throw error;
    }
  }

  public async recordQuestionAttempt(
    sessionId: string,
    concept: string,
    isCorrect: boolean,
    timeSpentSeconds: number
  ): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      session.questionsAnswered += 1;
      if (isCorrect) {
        session.correctAnswers += 1;
      } else {
        if (!session.struggledConcepts.includes(concept)) {
          session.struggledConcepts.push(concept);
        }
      }

      session.accuracy = Math.round(
        (session.correctAnswers / session.questionsAnswered) * 100
      );
      session.timePerQuestion = Math.round(
        (session.timePerQuestion * (session.questionsAnswered - 1) + timeSpentSeconds) /
          session.questionsAnswered
      );

      await this.db
        .collection('question_attempts')
        .add({
          sessionId,
          concept,
          isCorrect,
          timeSpentSeconds,
          timestamp: new Date(),
        });

      // Check for struggle indicators
      if (!isCorrect) {
        await this.updateStruggleIndicator(session.userId, session.moduleId, concept);
      }
    } catch (error: any) {
      console.error('Error recording question attempt:', error);
    }
  }

  public async endLearningSession(sessionId: string): Promise<LearningSession> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      const endTime = new Date();
      const duration = Math.round(
        (endTime.getTime() - session.startTime.getTime()) / 1000
      );

      const updatedSession: LearningSession = {
        ...session,
        endTime,
        duration,
        status: 'completed',
      };

      await this.db
        .collection('learning_sessions')
        .doc(sessionId)
        .update(updatedSession);

      // Update performance metrics
      await this.updatePerformanceMetrics(session.userId, session.moduleId, updatedSession);

      // Check for intervention triggers
      await this.evaluateInterventionNeeds(session.userId, session.moduleId);

      this.activeSessions.delete(sessionId);

      logSecurityEvent(
        'LEARNING_SESSION_COMPLETED' as any,
        'info' as any,
        `Learning session completed`,
        { accuracy: updatedSession.accuracy, duration },
        { sessionId }
      );

      return updatedSession;
    } catch (error: any) {
      console.error('Error ending learning session:', error);
      throw error;
    }
  }

  public async getPerformanceMetrics(
    userId: string,
    moduleId: string
  ): Promise<PerformanceMetrics> {
    try {
      const sessions = await this.db
        .collection('learning_sessions')
        .where('userId', '==', userId)
        .where('moduleId', '==', moduleId)
        .where('status', '==', 'completed')
        .orderBy('endTime', 'desc')
        .limit(10)
        .get();

      if (sessions.empty) {
        return {
          userId,
          moduleId,
          totalSessions: 0,
          avgAccuracy: 0,
          avgSessionDuration: 0,
          improvementTrend: 0,
          masteryLevel: 0,
          lastAssessed: new Date(),
        };
      }

      const sessionDocs = sessions.docs.map((d) => d.data() as any);

      const avgAccuracy = Math.round(
        sessionDocs.reduce((sum, s) => sum + s.accuracy, 0) / sessionDocs.length
      );
      const avgDuration = Math.round(
        sessionDocs.reduce((sum, s) => sum + s.duration, 0) / sessionDocs.length
      );

      const recentAccuracy = sessionDocs.slice(0, 3).reduce((sum, s) => sum + s.accuracy, 0) / 3;
      const olderAccuracy =
        sessionDocs.slice(3, 6).length > 0
          ? sessionDocs.slice(3, 6).reduce((sum, s) => sum + s.accuracy, 0) /
            sessionDocs.slice(3, 6).length
          : recentAccuracy;

      const improvementTrend = Math.round(recentAccuracy - olderAccuracy);

      const masteryLevel = Math.min(100, avgAccuracy + improvementTrend * 0.5);

      return {
        userId,
        moduleId,
        totalSessions: sessions.size,
        avgAccuracy,
        avgSessionDuration: avgDuration,
        improvementTrend,
        masteryLevel: Math.max(0, masteryLevel),
        lastAssessed: new Date(),
      };
    } catch (error: any) {
      console.error('Error getting performance metrics:', error);
      throw error;
    }
  }

  public async analyzeLearningPace(
    userId: string,
    moduleId: string
  ): Promise<LearningPaceAnalysis> {
    try {
      const metrics = await this.getPerformanceMetrics(userId, moduleId);

      const recommendedPaceMinutes = metrics.avgAccuracy > 80 ? 30 : 45;

      const paceCategory =
        metrics.avgSessionDuration < recommendedPaceMinutes * 0.7
          ? 'too_fast'
          : metrics.avgSessionDuration > recommendedPaceMinutes * 1.3
            ? 'too_slow'
            : 'optimal';

      const adjustmentFactor =
        recommendedPaceMinutes / Math.max(1, metrics.avgSessionDuration / 60);

      return {
        userId,
        moduleId,
        paceCategory,
        avgMinutesPerModule: Math.round(metrics.avgSessionDuration / 60),
        recommendedPaceMinutes,
        adjustmentFactor: Math.round(adjustmentFactor * 100) / 100,
        confidence: Math.min(95, 50 + metrics.totalSessions * 5),
      };
    } catch (error: any) {
      console.error('Error analyzing learning pace:', error);
      throw error;
    }
  }

  public async getStruggleIndicators(userId: string): Promise<StruggleIndicator[]> {
    try {
      const snapshot = await this.db
        .collection('struggle_indicators')
        .where('userId', '==', userId)
        .where('lastDetectedAt', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .get();

      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        firstDetectedAt: doc.data().firstDetectedAt?.toDate?.() || new Date(),
        lastDetectedAt: doc.data().lastDetectedAt?.toDate?.() || new Date(),
      })) as StruggleIndicator[];
    } catch (error: any) {
      console.error('Error fetching struggle indicators:', error);
      return [];
    }
  }

  public async getActiveInterventionTriggers(userId: string): Promise<InterventionTrigger[]> {
    try {
      const snapshot = await this.db
        .collection('intervention_triggers')
        .where('userId', '==', userId)
        .where('actionTaken', '==', null)
        .orderBy('severity', 'desc')
        .limit(10)
        .get();

      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(),
      })) as InterventionTrigger[];
    } catch (error: any) {
      console.error('Error fetching intervention triggers:', error);
      return [];
    }
  }

  private async updateStruggleIndicator(
    userId: string,
    moduleId: string,
    concept: string
  ): Promise<void> {
    try {
      const indicatorId = `struggle-${userId}-${moduleId}-${concept}`;

      const existing = await this.db
        .collection('struggle_indicators')
        .doc(indicatorId)
        .get();

      if (existing.exists) {
        const data = existing.data() as any;
        const occurrences = (data.occurrences || 0) + 1;

        const severity =
          occurrences < 2 ? 'low' : occurrences < 4 ? 'medium' : 'high';

        await this.db
          .collection('struggle_indicators')
          .doc(indicatorId)
          .update({
            occurrences,
            severity,
            lastDetectedAt: new Date(),
          });
      } else {
        await this.db
          .collection('struggle_indicators')
          .doc(indicatorId)
          .set({
            indicatorId,
            userId,
            moduleId,
            concept,
            severity: 'low',
            occurrences: 1,
            firstDetectedAt: new Date(),
            lastDetectedAt: new Date(),
            interventionSuggestion: `Review ${concept} with extra examples`,
            interventionApplied: false,
          });
      }
    } catch (error) {
      console.error('Error updating struggle indicator:', error);
    }
  }

  private async updatePerformanceMetrics(
    userId: string,
    moduleId: string,
    session: LearningSession
  ): Promise<void> {
    try {
      const metricsId = `metrics-${userId}-${moduleId}`;

      await this.db
        .collection('performance_metrics')
        .doc(metricsId)
        .set(
          {
            userId,
            moduleId,
            lastUpdated: new Date(),
          },
          { merge: true }
        );
    } catch (error) {
      console.error('Error updating performance metrics:', error);
    }
  }

  private async evaluateInterventionNeeds(userId: string, moduleId: string): Promise<void> {
    try {
      const metrics = await this.getPerformanceMetrics(userId, moduleId);

      if (metrics.avgAccuracy < 60) {
        await this.createInterventionTrigger(userId, 'low_accuracy', 'high', 'low_accuracy');
      }

      if (metrics.improvementTrend < -10) {
        await this.createInterventionTrigger(
          userId,
          'low_accuracy',
          'medium',
          'declining_performance'
        );
      }

      const pace = await this.analyzeLearningPace(userId, moduleId);
      if (pace.paceCategory === 'too_fast' && metrics.avgAccuracy < 70) {
        await this.createInterventionTrigger(
          userId,
          'pace_mismatch',
          'medium',
          'pace_adjustment_needed'
        );
      }
    } catch (error) {
      console.error('Error evaluating intervention needs:', error);
    }
  }

  private async createInterventionTrigger(
    userId: string,
    triggerType: string,
    severity: string,
    action: string
  ): Promise<void> {
    try {
      const triggerId = `trigger-${userId}-${triggerType}-${Date.now()}`;

      const severityMap = { low: 3, medium: 6, high: 9 };
      const severityScore = severityMap[severity as keyof typeof severityMap] || 5;

      await this.db
        .collection('intervention_triggers')
        .doc(triggerId)
        .set({
          triggerId,
          userId,
          triggerType,
          severity: severityScore,
          recommendedAction: action,
          timestamp: new Date(),
          actionTaken: null,
        });
    } catch (error) {
      console.error('Error creating intervention trigger:', error);
    }
  }

  private scheduleMetricsAggregation(): void {
    setInterval(async () => {
      try {
        const completedSessions = await this.db
          .collection('learning_sessions')
          .where('status', '==', 'completed')
          .orderBy('endTime', 'desc')
          .limit(1000)
          .get();

        console.log(`[Analytics] Aggregated metrics for ${completedSessions.size} sessions`);
      } catch (error: any) {
        console.error('Metrics aggregation error:', error);
      }
    }, 60 * 60 * 1000); // Hourly
  }
}

export const realTimeLearningAnalyticsService = new RealTimeLearningAnalyticsService();
