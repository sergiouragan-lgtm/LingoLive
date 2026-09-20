import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface RiskAssessment {
  assessmentId: string;
  userId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  riskScore: number;
  confidenceLevel: number;
  predictedChurnDate?: Date;
  estimatedRecoveryTime?: number;
  assessedAt: Date;
}

export interface RiskFactor {
  factorId: string;
  category: 'engagement' | 'performance' | 'attendance' | 'motivation' | 'technical';
  description: string;
  severity: number;
  contributes: number;
  trend: 'improving' | 'stable' | 'declining';
  detectedAt: Date;
}

export interface InterventionRecommendation {
  interventionId: string;
  userId: string;
  riskAssessmentId: string;
  interventionType: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  successProbability: number;
  recommendedTiming: string;
  targetOutcome: string;
  implementationSteps: string[];
  estimatedImpact: number;
  createdAt: Date;
}

export interface InterventionExecution {
  executionId: string;
  interventionId: string;
  userId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  actualImpact?: number;
  userResponse: Record<string, any>;
  notes: string;
}

export interface EarlyWarningSignal {
  signalId: string;
  userId: string;
  signalType: string;
  description: string;
  severity: number;
  trend: number;
  precedingFactors: string[];
  actionTaken?: string;
  detectedAt: Date;
}

export interface SuccessProbability {
  probabilityId: string;
  userId: string;
  concept: string;
  successRate: number;
  learningGainPrediction: number;
  timeToMasteryEstimate: number;
  recommendedIntensity: 'low' | 'medium' | 'high';
  calculatedAt: Date;
}

class PredictiveInterventionService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = getFirestore();
  }

  public async assessRisk(userId: string): Promise<RiskAssessment> {
    try {
      const assessmentId = `risk-${userId}-${Date.now()}`;

      const factors = await this.identifyRiskFactors(userId);
      const riskScore = this.calculateRiskScore(factors);
      const riskLevel = this.determineRiskLevel(riskScore);
      const confidence = this.calculateConfidence(factors);

      const assessment: RiskAssessment = {
        assessmentId,
        userId,
        riskLevel,
        riskFactors: factors,
        riskScore,
        confidenceLevel: confidence,
        predictedChurnDate: riskLevel === 'critical' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined,
        estimatedRecoveryTime: riskLevel !== 'low' ? 14 : undefined,
        assessedAt: new Date(),
      };

      await this.db.collection('risk_assessments').doc(assessmentId).set(assessment);
      logSecurityEvent('RISK_ASSESSED' as any, 'info' as any, 'User risk assessed', { userId, riskLevel });
      return assessment;
    } catch (error) {
      logSecurityEvent('RISK_ASSESSMENT_FAILED' as any, 'error' as any, 'Risk assessment failed', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async recommendInterventions(
    userId: string,
    riskAssessmentId: string
  ): Promise<InterventionRecommendation[]> {
    try {
      const assessmentDoc = await this.db.collection('risk_assessments').doc(riskAssessmentId).get();
      if (!assessmentDoc.exists) throw new Error('Assessment not found');

      const assessment = assessmentDoc.data() as RiskAssessment;
      const recommendations: InterventionRecommendation[] = [];

      for (const factor of assessment.riskFactors) {
        const intervention = this.matchInterventionToFactor(userId, factor, riskAssessmentId);
        recommendations.push(intervention);
        await this.db.collection('intervention_recommendations').doc(intervention.interventionId).set(intervention);
      }

      logSecurityEvent('INTERVENTIONS_RECOMMENDED' as any, 'info' as any, 'Interventions recommended', { userId, count: recommendations.length });
      return recommendations;
    } catch (error) {
      logSecurityEvent('INTERVENTION_RECOMMENDATION_FAILED' as any, 'error' as any, 'Intervention recommendation failed', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async executeIntervention(
    interventionId: string,
    userId: string
  ): Promise<InterventionExecution> {
    try {
      const executionId = `exec-${interventionId}-${Date.now()}`;

      const interventionDoc = await this.db.collection('intervention_recommendations').doc(interventionId).get();
      if (!interventionDoc.exists) throw new Error('Intervention not found');

      const intervention = interventionDoc.data() as InterventionRecommendation;

      const execution: InterventionExecution = {
        executionId,
        interventionId,
        userId,
        startedAt: new Date(),
        status: 'in_progress',
        userResponse: {},
        notes: `Intervention started: ${intervention.interventionType}`,
      };

      await this.db.collection('intervention_executions').doc(executionId).set(execution);
      logSecurityEvent('INTERVENTION_EXECUTED' as any, 'info' as any, 'Intervention executed', { userId, interventionId });
      return execution;
    } catch (error) {
      logSecurityEvent('INTERVENTION_EXECUTION_FAILED' as any, 'error' as any, 'Intervention execution failed', { interventionId, error: (error as Error).message });
      throw error;
    }
  }

  public async monitorInterventionProgress(
    executionId: string,
    progressData: Record<string, any>
  ): Promise<InterventionExecution> {
    try {
      const execDoc = await this.db.collection('intervention_executions').doc(executionId).get();
      if (!execDoc.exists) throw new Error('Execution not found');

      const execution = execDoc.data() as InterventionExecution;

      const updated = {
        ...execution,
        userResponse: progressData,
        actualImpact: this.calculateInterventionImpact(progressData),
        lastUpdatedAt: new Date(),
      };

      await this.db.collection('intervention_executions').doc(executionId).set(updated);
      logSecurityEvent('INTERVENTION_PROGRESS_MONITORED' as any, 'info' as any, 'Intervention progress monitored', { executionId });
      return updated;
    } catch (error) {
      logSecurityEvent('PROGRESS_MONITORING_FAILED' as any, 'error' as any, 'Progress monitoring failed', { executionId, error: (error as Error).message });
      throw error;
    }
  }

  public async detectEarlyWarnings(userId: string): Promise<EarlyWarningSignal[]> {
    try {
      const signals: EarlyWarningSignal[] = [];

      const sessionsSnapshot = await this.db
        .collection('learning_sessions')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();

      const sessions = sessionsSnapshot.docs.map(d => d.data() as any);

      const completionRate = sessions.filter((s: any) => s.completed).length / sessions.length;
      if (completionRate < 0.5) {
        const signal: EarlyWarningSignal = {
          signalId: `signal-${userId}-completion-${Date.now()}`,
          userId,
          signalType: 'low_completion',
          description: `Low completion rate: ${Math.round(completionRate * 100)}%`,
          severity: 8,
          trend: -0.1,
          precedingFactors: ['missed_sessions', 'low_scores'],
          detectedAt: new Date(),
        };
        signals.push(signal);
      }

      const avgScore = sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length;
      if (avgScore < 60) {
        const signal: EarlyWarningSignal = {
          signalId: `signal-${userId}-performance-${Date.now()}`,
          userId,
          signalType: 'low_performance',
          description: `Low performance score: ${avgScore.toFixed(1)}`,
          severity: 7,
          trend: -0.05,
          precedingFactors: ['conceptual_gaps', 'insufficient_practice'],
          detectedAt: new Date(),
        };
        signals.push(signal);
      }

      for (const signal of signals) {
        await this.db.collection('early_warning_signals').doc(signal.signalId).set(signal);
      }

      logSecurityEvent('EARLY_WARNINGS_DETECTED' as any, 'info' as any, 'Early warning signals detected', { userId, count: signals.length });
      return signals;
    } catch (error) {
      logSecurityEvent('WARNING_DETECTION_FAILED' as any, 'error' as any, 'Warning detection failed', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async predictSuccess(userId: string, conceptId: string): Promise<SuccessProbability> {
    try {
      const probabilityId = `prob-${userId}-${conceptId}-${Date.now()}`;

      const sessionsSnapshot = await this.db
        .collection('learning_sessions')
        .where('userId', '==', userId)
        .where('concept', '==', conceptId)
        .get();

      const sessions = sessionsSnapshot.docs.map(d => d.data() as any);
      const scores = sessions.map((s: any) => s.score || 0);
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;

      const successRate = Math.min(1, avgScore / 100);
      const trend = this.calculateTrend(scores);
      const timeToMastery = this.estimateTimeToMastery(successRate, trend);

      const probability: SuccessProbability = {
        probabilityId,
        userId,
        concept: conceptId,
        successRate,
        learningGainPrediction: Math.max(0, (100 - avgScore) / 100),
        timeToMasteryEstimate: timeToMastery,
        recommendedIntensity: successRate > 0.8 ? 'low' : successRate > 0.5 ? 'medium' : 'high',
        calculatedAt: new Date(),
      };

      await this.db.collection('success_probabilities').doc(probabilityId).set(probability);
      logSecurityEvent('SUCCESS_PREDICTED' as any, 'info' as any, 'Success probability predicted', { userId, conceptId });
      return probability;
    } catch (error) {
      logSecurityEvent('SUCCESS_PREDICTION_FAILED' as any, 'error' as any, 'Success prediction failed', { userId, error: (error as Error).message });
      throw error;
    }
  }

  private async identifyRiskFactors(userId: string): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];

    const sessionsSnapshot = await this.db
      .collection('learning_sessions')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();

    const sessions = sessionsSnapshot.docs.map(d => d.data() as any);

    const completionRate = sessions.filter((s: any) => s.completed).length / sessions.length;
    if (completionRate < 0.7) {
      factors.push({
        factorId: `factor-engagement-${userId}`,
        category: 'engagement',
        description: 'Low session completion rate',
        severity: 0.8,
        contributes: 0.3,
        trend: 'declining',
        detectedAt: new Date(),
      });
    }

    const avgScore = sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length || 0;
    if (avgScore < 65) {
      factors.push({
        factorId: `factor-performance-${userId}`,
        category: 'performance',
        description: 'Low average assessment scores',
        severity: 0.7,
        contributes: 0.4,
        trend: 'stable',
        detectedAt: new Date(),
      });
    }

    return factors;
  }

  private calculateRiskScore(factors: RiskFactor[]): number {
    if (factors.length === 0) return 0;
    return Math.min(1, factors.reduce((sum, f) => sum + f.severity * f.contributes, 0));
  }

  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 0.75) return 'critical';
    if (score >= 0.5) return 'high';
    if (score >= 0.25) return 'medium';
    return 'low';
  }

  private calculateConfidence(factors: RiskFactor[]): number {
    return Math.min(1, 0.7 + factors.length * 0.05);
  }

  private matchInterventionToFactor(
    userId: string,
    factor: RiskFactor,
    assessmentId: string
  ): InterventionRecommendation {
    const interventionId = `interv-${userId}-${factor.category}-${Date.now()}`;

    const interventionMap: Record<string, string> = {
      engagement: 'motivational_coaching',
      performance: 'remedial_tutoring',
      attendance: 'attendance_tracking',
      motivation: 'goal_setting',
      technical: 'tech_support',
    };

    return {
      interventionId,
      userId,
      riskAssessmentId: assessmentId,
      interventionType: interventionMap[factor.category] || 'general_support',
      priority: factor.severity > 0.7 ? 'immediate' : 'high',
      successProbability: 0.75,
      recommendedTiming: 'within_24_hours',
      targetOutcome: `Improve ${factor.category}`,
      implementationSteps: ['Step 1: Contact student', 'Step 2: Assess needs', 'Step 3: Provide support'],
      estimatedImpact: 0.4,
      createdAt: new Date(),
    };
  }

  private calculateInterventionImpact(progressData: Record<string, any>): number {
    return Math.min(1, (progressData.sessionsCompleted || 0) * 0.1 + (progressData.scoreImprovement || 0) * 0.05);
  }

  private calculateTrend(scores: number[]): number {
    if (scores.length < 2) return 0;
    const recent = scores.slice(0, 3).reduce((a, b) => a + b) / 3;
    const older = scores.slice(-3).reduce((a, b) => a + b) / 3;
    return recent - older;
  }

  private estimateTimeToMastery(successRate: number, trend: number): number {
    const baseTime = 20;
    const rateAdjustment = (1 - successRate) * 10;
    const trendAdjustment = trend > 0 ? -5 : 5;
    return Math.max(5, baseTime + rateAdjustment + trendAdjustment);
  }
}

export const predictiveInterventionService = new PredictiveInterventionService();
