import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface TutoringSession {
  sessionId: string;
  userId: string;
  conceptId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // seconds
  mistakesIdentified: string[];
  misconceptionsDetected: string[];
  hintsProvided: number;
  status: 'in_progress' | 'completed';
}

export interface HintRequest {
  hintId: string;
  sessionId: string;
  conceptId: string;
  hintLevel: 1 | 2 | 3; // 1=general, 2=specific, 3=solution preview
  hintText: string;
  timeGiven: number; // seconds after problem started
  wasHelpful: boolean;
}

export interface MisconceptionModel {
  misconceptionId: string;
  concept: string;
  description: string;
  commonInUsers: number;
  detectionPattern: string;
  correctionStrategies: string[];
  learningResources: string[];
}

export interface PedagogicalModel {
  userId: string;
  conceptId: string;
  currentUnderstanding: number; // 0-100
  knowledgeGaps: string[];
  preferredTeachingStyle: 'explanatory' | 'scaffolding' | 'discovery' | 'mixed';
  difficultyOptimalRange: { min: number; max: number };
  lastUpdated: Date;
}

export interface GuidedPracticeSession {
  sessionId: string;
  userId: string;
  conceptId: string;
  problemCount: number;
  mistakesOnFirstAttempt: number;
  averageAttemptsPerProblem: number;
  timeToSolve: number[];
  successRate: number; // 0-100
  readyToAssess: boolean;
  completedAt: Date;
}

class IntelligentTutoringService {
  private db: FirebaseFirestore.Firestore;
  private activeSessions: Map<string, any> = new Map();

  constructor() {
    this.db = getFirestore();
    this.scheduleSessionReview();
  }

  public async startTutoringSession(
    userId: string,
    conceptId: string
  ): Promise<TutoringSession> {
    try {
      const sessionId = `tutoring-${userId}-${conceptId}-${Date.now()}`;

      const session: TutoringSession = {
        sessionId,
        userId,
        conceptId,
        startTime: new Date(),
        duration: 0,
        mistakesIdentified: [],
        misconceptionsDetected: [],
        hintsProvided: 0,
        status: 'in_progress',
      };

      this.activeSessions.set(sessionId, session);

      await this.db
        .collection('tutoring_sessions')
        .doc(sessionId)
        .set(session);

      logSecurityEvent(
        'TUTORING_SESSION_STARTED' as any,
        'info' as any,
        `Tutoring session started`,
        { userId, conceptId },
        { sessionId }
      );

      return session;
    } catch (error: any) {
      console.error('Error starting tutoring session:', error);
      throw error;
    }
  }

  public async requestHint(
    sessionId: string,
    attemptNumber: number,
    responseContext: any
  ): Promise<HintRequest> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // Determine hint level based on attempt number
      const hintLevel = Math.min(3, attemptNumber + 1) as 1 | 2 | 3;

      const hintId = `hint-${sessionId}-${Date.now()}`;
      const hintText = this.generateHint(session.conceptId, hintLevel, responseContext);

      const hint: HintRequest = {
        hintId,
        sessionId,
        conceptId: session.conceptId,
        hintLevel,
        hintText,
        timeGiven: Math.round((Date.now() - session.startTime.getTime()) / 1000),
        wasHelpful: false,
      };

      session.hintsProvided += 1;

      await this.db
        .collection('hint_requests')
        .doc(hintId)
        .set(hint);

      return hint;
    } catch (error: any) {
      console.error('Error requesting hint:', error);
      throw error;
    }
  }

  public async recordMistake(
    sessionId: string,
    mistakeType: string,
    expectedAnswer: string,
    studentAnswer: string
  ): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      if (!session.mistakesIdentified.includes(mistakeType)) {
        session.mistakesIdentified.push(mistakeType);
      }

      // Detect misconception
      const misconception = await this.detectMisconception(
        session.conceptId,
        mistakeType,
        studentAnswer,
        expectedAnswer
      );

      if (
        misconception &&
        !session.misconceptionsDetected.includes(misconception.misconceptionId)
      ) {
        session.misconceptionsDetected.push(misconception.misconceptionId);

        // Log detected misconception
        logSecurityEvent(
          'MISCONCEPTION_DETECTED' as any,
          'info' as any,
          `Misconception detected: ${misconception.description}`,
          { conceptId: session.conceptId },
          { sessionId }
        );
      }

      await this.db
        .collection('mistake_log')
        .add({
          sessionId,
          mistakeType,
          expectedAnswer,
          studentAnswer,
          misconceptionId: misconception?.misconceptionId || null,
          timestamp: new Date(),
        });
    } catch (error: any) {
      console.error('Error recording mistake:', error);
    }
  }

  public async completeTutoringSession(sessionId: string): Promise<TutoringSession> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      const endTime = new Date();
      const duration = Math.round(
        (endTime.getTime() - session.startTime.getTime()) / 1000
      );

      const updatedSession: TutoringSession = {
        ...session,
        endTime,
        duration,
        status: 'completed',
      };

      await this.db
        .collection('tutoring_sessions')
        .doc(sessionId)
        .update(updatedSession);

      // Update pedagogical model
      await this.updatePedagogicalModel(session.userId, session.conceptId, session);

      this.activeSessions.delete(sessionId);

      return updatedSession;
    } catch (error: any) {
      console.error('Error completing tutoring session:', error);
      throw error;
    }
  }

  public async startGuidedPractice(
    userId: string,
    conceptId: string,
    problemCount: number = 5
  ): Promise<GuidedPracticeSession> {
    try {
      const sessionId = `practice-${userId}-${conceptId}-${Date.now()}`;

      const practice: GuidedPracticeSession = {
        sessionId,
        userId,
        conceptId,
        problemCount,
        mistakesOnFirstAttempt: 0,
        averageAttemptsPerProblem: 1,
        timeToSolve: [],
        successRate: 0,
        readyToAssess: false,
        completedAt: new Date(),
      };

      await this.db
        .collection('guided_practice_sessions')
        .doc(sessionId)
        .set(practice);

      return practice;
    } catch (error: any) {
      console.error('Error starting guided practice:', error);
      throw error;
    }
  }

  public async completePracticeProblem(
    practiceSessionId: string,
    problemIndex: number,
    isCorrect: boolean,
    attemptsNeeded: number,
    timeSpentSeconds: number
  ): Promise<void> {
    try {
      const practice = await this.db
        .collection('guided_practice_sessions')
        .doc(practiceSessionId)
        .get();

      if (!practice.exists) {
        throw new Error(`Practice session not found`);
      }

      const data = practice.data() as any;

      if (!isCorrect) {
        data.mistakesOnFirstAttempt += 1;
      }

      data.timeToSolve.push(timeSpentSeconds);

      const totalAttempts =
        data.timeToSolve.length > 0
          ? data.timeToSolve.reduce((a: number, b: number) => a + b, 0) /
            data.timeToSolve.length
          : 1;

      data.averageAttemptsPerProblem = Math.round(totalAttempts * 10) / 10;
      data.successRate = Math.round(
        ((data.problemCount - data.mistakesOnFirstAttempt) / data.problemCount) *
          100
      );

      // Determine readiness for assessment
      data.readyToAssess =
        data.successRate >= 80 && data.averageAttemptsPerProblem <= 1.5;

      await this.db
        .collection('guided_practice_sessions')
        .doc(practiceSessionId)
        .update(data);

      if (data.readyToAssess) {
        logSecurityEvent(
          'PRACTICE_MASTERY_REACHED' as any,
          'info' as any,
          `Student ready for assessment after practice`,
          { successRate: data.successRate },
          { practiceSessionId }
        );
      }
    } catch (error: any) {
      console.error('Error completing practice problem:', error);
    }
  }

  public async getPedagogicalModel(userId: string, conceptId: string): Promise<PedagogicalModel> {
    try {
      const modelId = `${userId}-${conceptId}`;
      const doc = await this.db
        .collection('pedagogical_models')
        .doc(modelId)
        .get();

      if (doc.exists) {
        const data = doc.data() as any;
        return {
          ...data,
          lastUpdated: data.lastUpdated?.toDate?.() || new Date(),
        };
      }

      return {
        userId,
        conceptId,
        currentUnderstanding: 0,
        knowledgeGaps: [],
        preferredTeachingStyle: 'mixed',
        difficultyOptimalRange: { min: 3, max: 7 },
        lastUpdated: new Date(),
      };
    } catch (error: any) {
      console.error('Error getting pedagogical model:', error);
      throw error;
    }
  }

  public async getMisconceptionModel(
    misconceptionId: string
  ): Promise<MisconceptionModel | null> {
    try {
      const doc = await this.db
        .collection('misconception_models')
        .doc(misconceptionId)
        .get();

      if (!doc.exists) {
        return null;
      }

      return doc.data() as MisconceptionModel;
    } catch {
      return null;
    }
  }

  private generateHint(
    conceptId: string,
    hintLevel: 1 | 2 | 3,
    context: any
  ): string {
    const hints: Record<string, Record<number, string>> = {
      default: {
        1: 'Think about the key concepts we discussed. What pattern do you see?',
        2: `Look at the specific ${context?.topic || 'element'} you're working with.`,
        3: 'Try breaking the problem into smaller steps.',
      },
    };

    const hintSet = hints[conceptId] || hints.default;
    return hintSet[hintLevel] || 'Try a different approach.';
  }

  private async detectMisconception(
    conceptId: string,
    mistakeType: string,
    studentAnswer: string,
    expectedAnswer: string
  ): Promise<MisconceptionModel | null> {
    try {
      // Search for matching misconception pattern
      const misconceptions = await this.db
        .collection('misconception_models')
        .where('concept', '==', conceptId)
        .limit(10)
        .get();

      for (const doc of misconceptions.docs) {
        const model = doc.data() as any;
        if (
          mistakeType.includes(model.detectionPattern) ||
          studentAnswer.includes(model.detectionPattern)
        ) {
          return {
            misconceptionId: doc.id,
            concept: model.concept,
            description: model.description,
            commonInUsers: model.commonInUsers,
            detectionPattern: model.detectionPattern,
            correctionStrategies: model.correctionStrategies,
            learningResources: model.learningResources,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error detecting misconception:', error);
      return null;
    }
  }

  private async updatePedagogicalModel(
    userId: string,
    conceptId: string,
    session: TutoringSession
  ): Promise<void> {
    try {
      const modelId = `${userId}-${conceptId}`;
      const currentModel = await this.getPedagogicalModel(userId, conceptId);

      // Update understanding level based on mistakes
      let newUnderstanding = currentModel.currentUnderstanding;
      const mistakeCount = session.mistakesIdentified.length;

      if (mistakeCount === 0) {
        newUnderstanding = Math.min(100, newUnderstanding + 20);
      } else if (mistakeCount <= 2) {
        newUnderstanding = Math.min(100, newUnderstanding + 10);
      } else {
        newUnderstanding = Math.max(0, newUnderstanding - 10);
      }

      const knowledgeGaps = [...currentModel.knowledgeGaps, ...session.mistakesIdentified];

      await this.db
        .collection('pedagogical_models')
        .doc(modelId)
        .set(
          {
            userId,
            conceptId,
            currentUnderstanding: newUnderstanding,
            knowledgeGaps: [...new Set(knowledgeGaps)],
            lastUpdated: new Date(),
          },
          { merge: true }
        );
    } catch (error) {
      console.error('Error updating pedagogical model:', error);
    }
  }

  private scheduleSessionReview(): void {
    setInterval(async () => {
      try {
        const sessions = await this.db
          .collection('tutoring_sessions')
          .where('status', '==', 'completed')
          .orderBy('endTime', 'desc')
          .limit(100)
          .get();

        console.log(`[Tutoring] Reviewed ${sessions.size} tutoring sessions`);
      } catch (error: any) {
        console.error('Session review error:', error);
      }
    }, 60 * 60 * 1000); // Hourly
  }
}

export const intelligentTutoringService = new IntelligentTutoringService();
