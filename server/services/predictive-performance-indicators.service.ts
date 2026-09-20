import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface PerformancePrediction {
  predictionId: string;
  userId: string;
  conceptId: string;
  predictedScore: number;
  confidenceScore: number;
  predictionDate: Date;
  predictionWindow: 'week' | 'month' | 'quarter';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendedActions: string[];
}

export interface RiskIndicator {
  indicatorId: string;
  userId: string;
  indicatorType: 'engagement' | 'performance' | 'retention' | 'behavioral';
  riskScore: number;
  threshold: number;
  trend: 'improving' | 'stable' | 'declining';
  riskFactors: RiskFactor[];
  lastUpdated: Date;
}

export interface RiskFactor {
  factorName: string;
  severity: 'low' | 'medium' | 'high';
  weight: number;
  description: string;
}

export interface SuccessProbability {
  probabilityId: string;
  userId: string;
  outcomeName: string;
  successProbability: number;
  historicalSuccessRate: number;
  predictiveFactors: string[];
  calculatedAt: Date;
}

export interface PerformanceTrendForecast {
  forecastId: string;
  userId: string;
  forecastPeriod: 'next-week' | 'next-month' | 'next-quarter';
  trendDirection: 'improving' | 'stable' | 'declining';
  expectedScoreChange: number;
  forecastAccuracy: number;
  forecastedDataPoints: ForecastPoint[];
}

export interface ForecastPoint {
  date: Date;
  predictedScore: number;
  confidenceInterval: { lower: number; upper: number };
}

export interface InterventionRecommendation {
  recommendationId: string;
  userId: string;
  interventionType: 'tutoring' | 'resource' | 'practice' | 'assessment' | 'mentoring';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetArea: string;
  estimatedImpact: number;
  recommendedDuration: number;
  expectedOutcome: string;
}

export interface LearningTrajectory {
  trajectoryId: string;
  userId: string;
  conceptId: string;
  currentLevel: number;
  projectedLevel: number;
  trajectory: 'accelerating' | 'on-track' | 'slowing' | 'stalled';
  milestoneDates: MilestoneDate[];
  lastAnalyzed: Date;
}

export interface MilestoneDate {
  milestone: string;
  projectedDate: Date;
  confidence: number;
}

class PredictivePerformanceIndicatorsService {
  private db = getFirestore();

  async predictStudentPerformance(userId: string, conceptId: string): Promise<PerformancePrediction> {
    try {
      const predictionId = `prediction_${userId}_${conceptId}_${Date.now()}`;

      const historyQuery = await this.db
        .collection('formative_assessments')
        .where('userId', '==', userId)
        .where('conceptId', '==', conceptId)
        .orderBy('completedAt', 'desc')
        .limit(10)
        .get();

      const assessments = historyQuery.docs.map((doc) => doc.data() as any);

      const predictedScore = this.predictScore(assessments);
      const confidenceScore = this.calculateConfidence(assessments);
      const riskLevel = this.determineRiskLevel(predictedScore);

      const prediction: PerformancePrediction = {
        predictionId,
        userId,
        conceptId,
        predictedScore,
        confidenceScore,
        predictionDate: new Date(),
        predictionWindow: 'month',
        riskLevel,
        recommendedActions: this.generateRecommendations(riskLevel, predictedScore),
      };

      await this.db.collection('performance_predictions').doc(predictionId).set(prediction);

      logSecurityEvent('PERFORMANCE_PREDICTED' as any, 'info' as any, 'Performance predicted', {
        userId,
        conceptId,
        predictedScore,
        riskLevel,
      });

      return prediction;
    } catch (error) {
      logSecurityEvent('PERFORMANCE_PREDICTION_FAILED' as any, 'error' as any, 'Failed to predict performance', {
        userId,
        conceptId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async calculateRiskIndicators(userId: string): Promise<RiskIndicator[]> {
    try {
      const indicators: RiskIndicator[] = [];

      // Engagement risk
      const activityQuery = await this.db
        .collection('user_activities')
        .where('userId', '==', userId)
        .where('timestamp', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .get();

      const engagementRisk = this.calculateEngagementRisk(activityQuery.size);

      indicators.push({
        indicatorId: `risk_eng_${userId}_${Date.now()}`,
        userId,
        indicatorType: 'engagement',
        riskScore: engagementRisk.score,
        threshold: 50,
        trend: engagementRisk.score < 30 ? 'declining' : 'stable',
        riskFactors: engagementRisk.factors,
        lastUpdated: new Date(),
      });

      // Performance risk
      const assessmentQuery = await this.db
        .collection('formative_assessments')
        .where('userId', '==', userId)
        .limit(5)
        .get();

      const assessments = assessmentQuery.docs.map((doc) => doc.data() as any);
      const performanceRisk = this.calculatePerformanceRisk(assessments);

      indicators.push({
        indicatorId: `risk_perf_${userId}_${Date.now()}`,
        userId,
        indicatorType: 'performance',
        riskScore: performanceRisk.score,
        threshold: 60,
        trend: performanceRisk.score > 70 ? 'improving' : 'stable',
        riskFactors: performanceRisk.factors,
        lastUpdated: new Date(),
      });

      await this.db.collection('risk_indicators').add({
        userId,
        indicators,
        calculatedAt: new Date(),
      });

      logSecurityEvent('RISK_CALCULATED' as any, 'info' as any, 'Risk indicators calculated', {
        userId,
        indicatorCount: indicators.length,
      });

      return indicators;
    } catch (error) {
      logSecurityEvent('RISK_CALCULATION_FAILED' as any, 'error' as any, 'Failed to calculate risk indicators', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async predictSuccessProbability(userId: string, outcomeName: string): Promise<SuccessProbability> {
    try {
      const probabilityId = `success_${userId}_${Date.now()}`;

      const historyQuery = await this.db
        .collection('learning_outcomes')
        .where('userId', '==', userId)
        .get();

      const outcomes = historyQuery.docs.map((doc) => doc.data() as any);
      const completedOutcomes = outcomes.filter((o) => o.status === 'achieved');

      const historicalSuccessRate = outcomes.length > 0 ? (completedOutcomes.length / outcomes.length) * 100 : 0;
      const successProbability = Math.min(100, historicalSuccessRate + 15); // Add 15% boost for new outcomes

      const probability: SuccessProbability = {
        probabilityId,
        userId,
        outcomeName,
        successProbability,
        historicalSuccessRate,
        predictiveFactors: this.identifySuccessFactors(outcomes),
        calculatedAt: new Date(),
      };

      await this.db.collection('success_probabilities').doc(probabilityId).set(probability);

      logSecurityEvent('SUCCESS_PROBABILITY_CALCULATED' as any, 'info' as any, 'Success probability calculated', {
        userId,
        outcomeName,
        successProbability,
      });

      return probability;
    } catch (error) {
      logSecurityEvent('SUCCESS_PROBABILITY_FAILED' as any, 'error' as any, 'Failed to calculate success probability', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async forecastPerformanceTrend(userId: string): Promise<PerformanceTrendForecast> {
    try {
      const forecastId = `forecast_${userId}_${Date.now()}`;

      const assessmentQuery = await this.db
        .collection('formative_assessments')
        .where('userId', '==', userId)
        .orderBy('completedAt', 'desc')
        .limit(15)
        .get();

      const assessments = assessmentQuery.docs.map((doc) => doc.data() as any);
      const scores = assessments.map((a) => a.overallScore).reverse();

      const trendDirection = this.calculateTrendDirection(scores);
      const expectedScoreChange = this.calculateScoreChange(scores);
      const forecastedDataPoints = this.generateForecastPoints(scores, trendDirection);

      const forecast: PerformanceTrendForecast = {
        forecastId,
        userId,
        forecastPeriod: 'next-month',
        trendDirection,
        expectedScoreChange,
        forecastAccuracy: Math.min(95, 50 + assessments.length * 3),
        forecastedDataPoints,
      };

      await this.db.collection('performance_forecasts').doc(forecastId).set(forecast);

      logSecurityEvent('TREND_FORECASTED' as any, 'info' as any, 'Performance trend forecasted', {
        userId,
        trendDirection,
        expectedScoreChange,
      });

      return forecast;
    } catch (error) {
      logSecurityEvent('TREND_FORECAST_FAILED' as any, 'error' as any, 'Failed to forecast trend', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async generateInterventionRecommendations(userId: string): Promise<InterventionRecommendation[]> {
    try {
      const recommendations: InterventionRecommendation[] = [];
      const riskIndicators = await this.calculateRiskIndicators(userId);

      for (const indicator of riskIndicators) {
        if (indicator.riskScore > 60) {
          const recommendation: InterventionRecommendation = {
            recommendationId: `intervention_${userId}_${Date.now()}`,
            userId,
            interventionType: this.determineInterventionType(indicator.indicatorType),
            priority: this.determinePriority(indicator.riskScore),
            targetArea: indicator.indicatorType,
            estimatedImpact: 100 - indicator.riskScore,
            recommendedDuration: this.recommendedDuration(indicator.riskScore),
            expectedOutcome: `Improve ${indicator.indicatorType} by 20-30%`,
          };

          recommendations.push(recommendation);
        }
      }

      await this.db.collection('intervention_recommendations').add({
        userId,
        recommendations,
        generatedAt: new Date(),
      });

      logSecurityEvent('INTERVENTIONS_RECOMMENDED' as any, 'info' as any, 'Intervention recommendations generated', {
        userId,
        recommendationCount: recommendations.length,
      });

      return recommendations;
    } catch (error) {
      logSecurityEvent('INTERVENTION_RECOMMENDATION_FAILED' as any, 'error' as any, 'Failed to generate recommendations', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async analyzeLearningTrajectory(userId: string, conceptId: string): Promise<LearningTrajectory> {
    try {
      const trajectoryId = `trajectory_${userId}_${conceptId}_${Date.now()}`;

      const competencyQuery = await this.db
        .collection('competency_maps')
        .where('userId', '==', userId)
        .where('conceptId', '==', conceptId)
        .limit(1)
        .get();

      const competency = competencyQuery.docs[0]?.data() as any;
      const currentLevel = competency?.masteryLevel || 0;

      const assessmentQuery = await this.db
        .collection('formative_assessments')
        .where('userId', '==', userId)
        .where('conceptId', '==', conceptId)
        .get();

      const assessments = assessmentQuery.docs.map((doc) => doc.data() as any);
      const projectedLevel = this.calculateProjectedLevel(currentLevel, assessments);
      const trajectory = this.determineTrajectory(currentLevel, projectedLevel);

      const milestoneDates = this.generateMilestoneDates(currentLevel, projectedLevel);

      const learning: LearningTrajectory = {
        trajectoryId,
        userId,
        conceptId,
        currentLevel,
        projectedLevel,
        trajectory,
        milestoneDates,
        lastAnalyzed: new Date(),
      };

      await this.db.collection('learning_trajectories').doc(trajectoryId).set(learning);

      logSecurityEvent('TRAJECTORY_ANALYZED' as any, 'info' as any, 'Learning trajectory analyzed', {
        userId,
        conceptId,
        trajectory,
      });

      return learning;
    } catch (error) {
      logSecurityEvent('TRAJECTORY_ANALYSIS_FAILED' as any, 'error' as any, 'Failed to analyze trajectory', {
        userId,
        conceptId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private predictScore(assessments: any[]): number {
    if (assessments.length === 0) return 50;
    const avgScore = assessments.reduce((sum, a) => sum + a.overallScore, 0) / assessments.length;
    const trend = assessments.length >= 2 ? (assessments[0].overallScore - assessments[assessments.length - 1].overallScore) / assessments.length : 0;
    return Math.min(100, Math.max(0, avgScore + trend));
  }

  private calculateConfidence(assessments: any[]): number {
    return Math.min(95, 30 + assessments.length * 5);
  }

  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'low';
    if (score >= 70) return 'medium';
    if (score >= 60) return 'high';
    return 'critical';
  }

  private generateRecommendations(riskLevel: string, score: number): string[] {
    if (riskLevel === 'critical') {
      return ['Seek immediate tutoring', 'Review core concepts', 'Practice more frequently'];
    } else if (riskLevel === 'high') {
      return ['Increase practice sessions', 'Review challenging topics', 'Schedule study sessions'];
    }
    return ['Continue current pace', 'Challenge yourself with advanced topics'];
  }

  private calculateEngagementRisk(activityCount: number): { score: number; factors: RiskFactor[] } {
    const score = Math.max(0, 100 - activityCount * 8);
    return {
      score,
      factors: score > 50 ? [{ factorName: 'Low activity', severity: 'high', weight: 0.7, description: 'Less than expected activities' }] : [],
    };
  }

  private calculatePerformanceRisk(assessments: any[]): { score: number; factors: RiskFactor[] } {
    const avgScore = assessments.length > 0 ? assessments.reduce((sum, a) => sum + a.overallScore, 0) / assessments.length : 75;
    const score = avgScore;
    return {
      score,
      factors: avgScore < 70 ? [{ factorName: 'Below average score', severity: 'high', weight: 0.8, description: 'Performance below target' }] : [],
    };
  }

  private identifySuccessFactors(outcomes: any[]): string[] {
    const factors: string[] = [];
    const achievedCount = outcomes.filter((o) => o.status === 'achieved').length;
    if (achievedCount > 0) {
      factors.push('Previous success experience');
      factors.push('Consistent engagement');
    }
    return factors;
  }

  private calculateTrendDirection(scores: number[]): 'improving' | 'stable' | 'declining' {
    if (scores.length < 2) return 'stable';
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2)).reduce((a, b) => a + b) / Math.ceil(scores.length / 2);
    const secondHalf = scores.slice(Math.floor(scores.length / 2)).reduce((a, b) => a + b) / Math.floor(scores.length / 2);
    if (secondHalf > firstHalf + 5) return 'improving';
    if (secondHalf < firstHalf - 5) return 'declining';
    return 'stable';
  }

  private calculateScoreChange(scores: number[]): number {
    if (scores.length < 2) return 0;
    return (scores[scores.length - 1] - scores[0]) / scores.length;
  }

  private generateForecastPoints(scores: number[], trend: string): ForecastPoint[] {
    const points: ForecastPoint[] = [];
    const lastScore = scores.length > 0 ? scores[scores.length - 1] : 75;
    const changePerWeek = trend === 'improving' ? 2 : trend === 'declining' ? -2 : 0;

    for (let i = 0; i < 4; i++) {
      const futureDate = new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const predictedScore = lastScore + changePerWeek * (i + 1);
      points.push({
        date: futureDate,
        predictedScore: Math.min(100, Math.max(0, predictedScore)),
        confidenceInterval: { lower: predictedScore - 10, upper: predictedScore + 10 },
      });
    }

    return points;
  }

  private determineInterventionType(indicatorType: string): 'tutoring' | 'resource' | 'practice' | 'assessment' | 'mentoring' {
    switch (indicatorType) {
      case 'performance':
        return 'tutoring';
      case 'engagement':
        return 'mentoring';
      case 'retention':
        return 'practice';
      default:
        return 'resource';
    }
  }

  private determinePriority(riskScore: number): 'low' | 'medium' | 'high' | 'urgent' {
    if (riskScore >= 80) return 'urgent';
    if (riskScore >= 70) return 'high';
    if (riskScore >= 60) return 'medium';
    return 'low';
  }

  private recommendedDuration(riskScore: number): number {
    return Math.ceil((100 - riskScore) / 10);
  }

  private calculateProjectedLevel(currentLevel: number, assessments: any[]): number {
    const improvement = assessments.length > 0 ? Math.min(1, assessments.length * 0.2) : 0;
    return Math.min(5, currentLevel + improvement);
  }

  private determineTrajectory(current: number, projected: number): 'accelerating' | 'on-track' | 'slowing' | 'stalled' {
    const diff = projected - current;
    if (diff > 1) return 'accelerating';
    if (diff > 0) return 'on-track';
    if (diff === 0) return 'slowing';
    return 'stalled';
  }

  private generateMilestoneDates(current: number, projected: number): MilestoneDate[] {
    const milestones: MilestoneDate[] = [];
    for (let i = Math.ceil(current); i <= Math.floor(projected); i++) {
      milestones.push({
        milestone: `Level ${i} mastery`,
        projectedDate: new Date(Date.now() + (i - current) * 30 * 24 * 60 * 60 * 1000),
        confidence: 0.7,
      });
    }
    return milestones;
  }
}

export const predictivePerformanceIndicatorsService = new PredictivePerformanceIndicatorsService();
