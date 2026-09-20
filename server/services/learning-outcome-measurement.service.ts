import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface LearningOutcome {
  outcomeId: string;
  userId: string;
  conceptId: string;
  outcomeType: 'knowledge' | 'skill' | 'attitude' | 'behavior';
  outcomeName: string;
  measurableGoal: string;
  targetMetric: number;
  currentMetric: number;
  achievementPercentage: number;
  measurementMethods: MeasurementMethod[];
  evidence: Evidence[];
  status: 'not-started' | 'in-progress' | 'achieved' | 'exceeded';
  createdAt: Date;
  achievedAt?: Date;
}

export interface MeasurementMethod {
  methodId: string;
  methodName: string;
  methodType: 'assessment' | 'observation' | 'portfolio' | 'rubric' | 'self-report';
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  weight: number;
}

export interface Evidence {
  evidenceId: string;
  methodId: string;
  dataPoint: number;
  measurement: string;
  collectedAt: Date;
  notes?: string;
}

export interface OutcomeAssessmentRubric {
  rubricId: string;
  conceptId: string;
  criteria: RubricCriterion[];
  scoringScale: ScoringLevel[];
  totalPossiblePoints: number;
  createdAt: Date;
}

export interface RubricCriterion {
  criterionId: string;
  name: string;
  description: string;
  maxPoints: number;
  indicators: string[];
}

export interface ScoringLevel {
  level: number;
  label: string;
  description: string;
  minPoints: number;
  maxPoints: number;
}

export interface OutcomeProgression {
  progressionId: string;
  userId: string;
  conceptId: string;
  milestones: Milestone[];
  overallProgress: number;
  completionEstimate: Date;
  lastUpdated: Date;
}

export interface Milestone {
  milestoneId: string;
  name: string;
  targetMetric: number;
  currentMetric: number;
  dueDate: Date;
  completed: boolean;
  completedAt?: Date;
}

class LearningOutcomeMeasurementService {
  private db = getFirestore();

  async createLearningOutcome(
    userId: string,
    conceptId: string,
    outcomeType: 'knowledge' | 'skill' | 'attitude' | 'behavior',
    outcomeName: string,
    measurableGoal: string,
    targetMetric: number,
    measurementMethods: MeasurementMethod[]
  ): Promise<LearningOutcome> {
    try {
      const outcomeId = `outcome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const outcome: LearningOutcome = {
        outcomeId,
        userId,
        conceptId,
        outcomeType,
        outcomeName,
        measurableGoal,
        targetMetric,
        currentMetric: 0,
        achievementPercentage: 0,
        measurementMethods,
        evidence: [],
        status: 'not-started',
        createdAt: new Date(),
      };

      await this.db.collection('learning_outcomes').doc(outcomeId).set(outcome);

      logSecurityEvent('OUTCOME_CREATED' as any, 'info' as any, 'Learning outcome created', {
        userId,
        conceptId,
        outcomeType,
      });

      return outcome;
    } catch (error) {
      logSecurityEvent('OUTCOME_CREATION_FAILED' as any, 'error' as any, 'Failed to create learning outcome', {
        userId,
        conceptId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recordOutcomeEvidence(
    outcomeId: string,
    methodId: string,
    dataPoint: number,
    measurement: string,
    notes?: string
  ): Promise<LearningOutcome> {
    try {
      const outcomeDoc = await this.db.collection('learning_outcomes').doc(outcomeId).get();
      const outcome = outcomeDoc.data() as LearningOutcome;

      const evidenceId = `evidence_${Date.now()}`;
      const evidence: Evidence = {
        evidenceId,
        methodId,
        dataPoint,
        measurement,
        collectedAt: new Date(),
        notes,
      };

      outcome.evidence.push(evidence);
      outcome.currentMetric = this.aggregateMetrics(outcome.evidence, outcome.measurementMethods);
      outcome.achievementPercentage = (outcome.currentMetric / outcome.targetMetric) * 100;
      outcome.status = this.determineOutcomeStatus(outcome.achievementPercentage);

      if (outcome.status === 'achieved' && !outcome.achievedAt) {
        outcome.achievedAt = new Date();
      }

      await this.db.collection('learning_outcomes').doc(outcomeId).update({
        evidence: outcome.evidence,
        currentMetric: outcome.currentMetric,
        achievementPercentage: outcome.achievementPercentage,
        status: outcome.status,
        achievedAt: outcome.achievedAt,
      });

      logSecurityEvent('EVIDENCE_RECORDED' as any, 'info' as any, 'Outcome evidence recorded', {
        outcomeId,
        methodId,
        dataPoint,
      });

      return outcome;
    } catch (error) {
      logSecurityEvent('EVIDENCE_RECORDING_FAILED' as any, 'error' as any, 'Failed to record evidence', {
        outcomeId,
        methodId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createAssessmentRubric(
    conceptId: string,
    criteria: RubricCriterion[],
    scoringScale: ScoringLevel[]
  ): Promise<OutcomeAssessmentRubric> {
    try {
      const rubricId = `rubric_${conceptId}_${Date.now()}`;
      const totalPossiblePoints = criteria.reduce((sum, c) => sum + c.maxPoints, 0);

      const rubric: OutcomeAssessmentRubric = {
        rubricId,
        conceptId,
        criteria,
        scoringScale,
        totalPossiblePoints,
        createdAt: new Date(),
      };

      await this.db.collection('outcome_rubrics').doc(rubricId).set(rubric);

      logSecurityEvent('RUBRIC_CREATED' as any, 'info' as any, 'Assessment rubric created', {
        conceptId,
        criterionCount: criteria.length,
      });

      return rubric;
    } catch (error) {
      logSecurityEvent('RUBRIC_CREATION_FAILED' as any, 'error' as any, 'Failed to create rubric', {
        conceptId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async scoreWithRubric(rubricId: string, studentResponses: { criterionId: string; pointsEarned: number }[]): Promise<any> {
    try {
      const rubricDoc = await this.db.collection('outcome_rubrics').doc(rubricId).get();
      const rubric = rubricDoc.data() as OutcomeAssessmentRubric;

      let totalPointsEarned = 0;

      studentResponses.forEach((response) => {
        const criterion = rubric.criteria.find((c) => c.criterionId === response.criterionId);
        if (criterion) {
          totalPointsEarned += Math.min(response.pointsEarned, criterion.maxPoints);
        }
      });

      const scorePercentage = (totalPointsEarned / rubric.totalPossiblePoints) * 100;
      const scoringLevel = rubric.scoringScale.find(
        (level) => scorePercentage >= level.minPoints && scorePercentage <= level.maxPoints
      );

      const score = {
        scoreId: `score_${Date.now()}`,
        rubricId,
        totalPointsEarned,
        totalPossiblePoints: rubric.totalPossiblePoints,
        scorePercentage,
        level: scoringLevel?.level || 0,
        levelLabel: scoringLevel?.label || 'Incomplete',
        generatedAt: new Date(),
      };

      await this.db.collection('rubric_scores').doc(score.scoreId).set(score);

      logSecurityEvent('RUBRIC_SCORED' as any, 'info' as any, 'Response scored with rubric', {
        rubricId,
        scorePercentage,
      });

      return score;
    } catch (error) {
      logSecurityEvent('RUBRIC_SCORING_FAILED' as any, 'error' as any, 'Failed to score rubric', {
        rubricId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async trackOutcomeProgression(
    userId: string,
    conceptId: string,
    milestones: Milestone[]
  ): Promise<OutcomeProgression> {
    try {
      const progressionId = `progression_${userId}_${conceptId}`;

      const progression: OutcomeProgression = {
        progressionId,
        userId,
        conceptId,
        milestones,
        overallProgress: 0,
        completionEstimate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        lastUpdated: new Date(),
      };

      await this.db.collection('outcome_progressions').doc(progressionId).set(progression);

      logSecurityEvent('PROGRESSION_TRACKED' as any, 'info' as any, 'Outcome progression tracked', {
        userId,
        conceptId,
        milestoneCount: milestones.length,
      });

      return progression;
    } catch (error) {
      logSecurityEvent('PROGRESSION_TRACKING_FAILED' as any, 'error' as any, 'Failed to track progression', {
        userId,
        conceptId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async generateOutcomeReport(userId: string, conceptId: string): Promise<any> {
    try {
      const query = await this.db
        .collection('learning_outcomes')
        .where('userId', '==', userId)
        .where('conceptId', '==', conceptId)
        .get();

      const outcomes = query.docs.map((doc) => doc.data() as LearningOutcome);

      const report = {
        reportId: `outcome_report_${Date.now()}`,
        userId,
        conceptId,
        outcomeCount: outcomes.length,
        achievedCount: outcomes.filter((o) => o.status === 'achieved').length,
        inProgressCount: outcomes.filter((o) => o.status === 'in-progress').length,
        averageAchievementPercentage:
          outcomes.length > 0 ? outcomes.reduce((sum, o) => sum + o.achievementPercentage, 0) / outcomes.length : 0,
        outcomes: outcomes.map((o) => ({
          outcomeName: o.outcomeName,
          status: o.status,
          achievementPercentage: o.achievementPercentage,
        })),
        generatedAt: new Date(),
      };

      await this.db.collection('outcome_reports').doc(report.reportId).set(report);

      logSecurityEvent('OUTCOME_REPORT_GENERATED' as any, 'info' as any, 'Outcome report generated', {
        userId,
        conceptId,
        outcomeCount: outcomes.length,
      });

      return report;
    } catch (error) {
      logSecurityEvent('OUTCOME_REPORT_FAILED' as any, 'error' as any, 'Failed to generate outcome report', {
        userId,
        conceptId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private aggregateMetrics(evidence: Evidence[], methods: MeasurementMethod[]): number {
    if (evidence.length === 0) return 0;

    let weightedSum = 0;
    let weightSum = 0;

    methods.forEach((method) => {
      const methodEvidence = evidence.filter((e) => e.methodId === method.methodId);
      if (methodEvidence.length > 0) {
        const avgDataPoint = methodEvidence.reduce((sum, e) => sum + e.dataPoint, 0) / methodEvidence.length;
        weightedSum += avgDataPoint * method.weight;
        weightSum += method.weight;
      }
    });

    return weightSum > 0 ? weightedSum / weightSum : 0;
  }

  private determineOutcomeStatus(achievementPercentage: number): 'not-started' | 'in-progress' | 'achieved' | 'exceeded' {
    if (achievementPercentage === 0) return 'not-started';
    if (achievementPercentage < 100) return 'in-progress';
    if (achievementPercentage >= 120) return 'exceeded';
    return 'achieved';
  }
}

export const learningOutcomeMeasurementService = new LearningOutcomeMeasurementService();
