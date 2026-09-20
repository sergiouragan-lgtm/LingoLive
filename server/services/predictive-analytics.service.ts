import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface ChurnPrediction {
  userId: string;
  churnRiskScore: number; // 0-100
  riskLevel: 'high' | 'medium' | 'low';
  predictedChurnDate?: Date;
  keyFactors: string[];
  recommendedInterventions: string[];
  confidenceScore: number;
  createdAt: Date;
}

export interface UserRiskScore {
  userId: string;
  riskScore: number;
  inactivityDays: number;
  engagementTrend: 'improving' | 'stable' | 'declining';
  lastActiveDateDaysAgo: number;
  daysSinceSignup: number;
  lessonsCompletedLast7Days: number;
  averageSessionDuration: number;
}

export interface LifetimeValue {
  userId: string;
  estimatedLTV: number;
  basedOnMetrics: {
    subscriptionTier: string;
    monthlySpend: number;
    retentionScore: number;
    engagementScore: number;
  };
  projectedARR: number;
}

export interface PredictionAccuracy {
  predictionId: string;
  churnActual: boolean;
  churnPredicted: boolean;
  riskScorePredicted: number;
  accuracy: boolean;
  measuredAt: Date;
}

class PredictiveAnalyticsService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = getFirestore();
    this.startDailyChurnPrediction();
  }

  public async predictChurnRisk(userId: string): Promise<ChurnPrediction> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get user profile
      const userDoc = await this.db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData) {
        throw new Error('User not found');
      }

      const createdAt = userData.createdAt?.toDate?.() || new Date();
      const daysSinceSignup = Math.floor(
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Get recent activity
      const thirtyDaysEvents = await this.db
        .collection('user_events')
        .where('userId', '==', userId)
        .where('timestamp', '>=', thirtyDaysAgo)
        .get();

      const sevenDaysEvents = await this.db
        .collection('user_events')
        .where('userId', '==', userId)
        .where('timestamp', '>=', sevenDaysAgo)
        .get();

      // Find last active date
      let lastActiveAt = createdAt;
      if (thirtyDaysEvents.size > 0) {
        const lastEvent = thirtyDaysEvents.docs.sort(
          (a, b) =>
            (b.data().timestamp?.toDate?.()?.getTime?.() || 0) -
            (a.data().timestamp?.toDate?.()?.getTime?.() || 0)
        )[0];
        lastActiveAt = lastEvent.data().timestamp?.toDate?.() || createdAt;
      }

      const inactivityDays = Math.floor(
        (now.getTime() - lastActiveAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calculate risk score components
      let riskScore = 0;
      const keyFactors: string[] = [];

      // Factor 1: Inactivity (0-40 points)
      if (inactivityDays > 30) {
        riskScore += 40;
        keyFactors.push('No activity for 30+ days');
      } else if (inactivityDays > 14) {
        riskScore += 30;
        keyFactors.push('Inactive for 14+ days');
      } else if (inactivityDays > 7) {
        riskScore += 20;
        keyFactors.push('Inactive for 7+ days');
      }

      // Factor 2: Recent activity trend (0-30 points)
      const thirtyDaysCount = thirtyDaysEvents.size;
      const sevenDaysCount = sevenDaysEvents.size;

      if (thirtyDaysCount < 5) {
        riskScore += 25;
        keyFactors.push('Very low activity this month');
      } else if (sevenDaysCount < thirtyDaysCount / 4) {
        riskScore += 20;
        keyFactors.push('Declining activity trend');
      }

      // Factor 3: Early churn risk (0-20 points)
      if (daysSinceSignup < 7 && thirtyDaysCount < 3) {
        riskScore += 20;
        keyFactors.push('New user with low engagement');
      }

      // Factor 4: Subscription status (0-10 points)
      if (userData.subscription?.status === 'cancelled') {
        riskScore += 10;
        keyFactors.push('Recent subscription cancellation');
      }

      // Calculate engagement trend
      let engagementTrend: 'improving' | 'stable' | 'declining' = 'stable';
      if (sevenDaysCount > thirtyDaysCount / 4) {
        engagementTrend = 'improving';
      } else if (sevenDaysCount < thirtyDaysCount / 4 && thirtyDaysCount > 5) {
        engagementTrend = 'declining';
      }

      // Determine risk level
      let riskLevel: 'high' | 'medium' | 'low' = 'low';
      if (riskScore > 60) {
        riskLevel = 'high';
      } else if (riskScore > 30) {
        riskLevel = 'medium';
      }

      // Estimate churn date for high-risk users
      let predictedChurnDate: Date | undefined;
      if (riskLevel === 'high' && inactivityDays > 7) {
        const daysUntilChurn = Math.max(7 - inactivityDays, 1);
        predictedChurnDate = new Date(now.getTime() + daysUntilChurn * 24 * 60 * 60 * 1000);
      }

      // Recommend interventions
      const interventions = this.getInterventions(riskLevel, keyFactors);

      const prediction: ChurnPrediction = {
        userId,
        churnRiskScore: Math.min(riskScore, 100),
        riskLevel,
        predictedChurnDate,
        keyFactors,
        recommendedInterventions: interventions,
        confidenceScore: Math.round(70 + Math.min(inactivityDays, 20)),
        createdAt: now,
      };

      // Store prediction
      await this.db
        .collection('churn_predictions')
        .doc(`${userId}-${Date.now()}`)
        .set(prediction);

      logSecurityEvent(
        'CHURN_PREDICTED' as any,
        'info' as any,
        `Churn prediction generated for user`,
        { userId },
        { riskScore: prediction.churnRiskScore, level: riskLevel }
      );

      return prediction;
    } catch (error: any) {
      console.error('Error predicting churn:', error);
      throw error;
    }
  }

  public async estimateLTV(userId: string): Promise<LifetimeValue> {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      // Get subscription info
      const subscriptionDoc = await this.db
        .collection('subscriptions')
        .doc(userId)
        .get();

      const subscriptionData = subscriptionDoc.data();
      const tier = subscriptionData?.tier || 'free';

      // Pricing map
      const monthlySpendMap: Record<string, number> = {
        free: 0,
        pro: 9.99,
        premium: 19.99,
        enterprise: 99.99,
      };

      const monthlySpend = monthlySpendMap[tier] || 0;

      // Get engagement metrics
      const metricsDoc = await this.db
        .collection('engagement_metrics')
        .doc(userId)
        .get();

      const metricsData = metricsDoc.data();
      const engagementScore = metricsData?.engagementScore || 0;

      // Calculate retention score (0-100)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const eventsSnapshot = await this.db
        .collection('user_events')
        .where('userId', '==', userId)
        .where('timestamp', '>=', thirtyDaysAgo)
        .get();

      const retentionScore = Math.min(eventsSnapshot.size * 5, 100);

      // Calculate LTV
      const monthlyRetentionRate = Math.max(0.7, retentionScore / 100);
      const avgLTMValue = monthlySpend * 12;
      const estimatedLTV = Math.round(
        avgLTMValue / (1 - monthlyRetentionRate + 0.01)
      );

      const projectedARR = estimatedLTV / 3; // Rough 3-year average

      return {
        userId,
        estimatedLTV,
        basedOnMetrics: {
          subscriptionTier: tier,
          monthlySpend,
          retentionScore,
          engagementScore,
        },
        projectedARR,
      };
    } catch (error: any) {
      console.error('Error estimating LTV:', error);
      return {
        userId,
        estimatedLTV: 0,
        basedOnMetrics: {
          subscriptionTier: 'free',
          monthlySpend: 0,
          retentionScore: 0,
          engagementScore: 0,
        },
        projectedARR: 0,
      };
    }
  }

  public async trackPredictionAccuracy(
    predictionId: string,
    churnActual: boolean,
    churnPredicted: boolean,
    riskScorePredicted: number
  ): Promise<void> {
    try {
      const accuracy: PredictionAccuracy = {
        predictionId,
        churnActual,
        churnPredicted,
        riskScorePredicted,
        accuracy: churnActual === churnPredicted,
        measuredAt: new Date(),
      };

      await this.db
        .collection('prediction_accuracy_logs')
        .doc(predictionId)
        .set(accuracy);

      logSecurityEvent(
        'PREDICTION_ACCURACY_TRACKED' as any,
        'info' as any,
        `Prediction accuracy tracked`,
        {},
        { accurate: accuracy.accuracy, predicted: churnPredicted }
      );
    } catch (error: any) {
      console.error('Error tracking prediction accuracy:', error);
    }
  }

  public async getModelPerformance(): Promise<{
    totalPredictions: number;
    accuracyRate: number;
    precisionRate: number;
    recallRate: number;
  }> {
    try {
      const snapshot = await this.db
        .collection('prediction_accuracy_logs')
        .get();

      if (snapshot.size === 0) {
        return {
          totalPredictions: 0,
          accuracyRate: 0,
          precisionRate: 0,
          recallRate: 0,
        };
      }

      const logs = snapshot.docs.map((doc) => doc.data() as PredictionAccuracy);

      const correct = logs.filter((l) => l.accuracy).length;
      const accuracyRate = Math.round((correct / logs.length) * 100);

      const truePositives = logs.filter(
        (l) => l.churnActual && l.churnPredicted
      ).length;
      const falsePositives = logs.filter(
        (l) => !l.churnActual && l.churnPredicted
      ).length;
      const falseNegatives = logs.filter(
        (l) => l.churnActual && !l.churnPredicted
      ).length;

      const precisionRate = Math.round(
        (truePositives / (truePositives + falsePositives)) * 100
      ) || 0;
      const recallRate = Math.round(
        (truePositives / (truePositives + falseNegatives)) * 100
      ) || 0;

      return {
        totalPredictions: logs.length,
        accuracyRate,
        precisionRate,
        recallRate,
      };
    } catch (error: any) {
      console.error('Error fetching model performance:', error);
      return {
        totalPredictions: 0,
        accuracyRate: 0,
        precisionRate: 0,
        recallRate: 0,
      };
    }
  }

  private getInterventions(
    riskLevel: string,
    factors: string[]
  ): string[] {
    const interventions: string[] = [];

    if (riskLevel === 'high') {
      interventions.push('Send personalized re-engagement email');
      interventions.push('Offer special discount or free trial');
      interventions.push('Schedule customer check-in call');
    }

    if (factors.includes('No activity for 30+ days')) {
      interventions.push('Send win-back campaign');
      interventions.push('Feature new content they might enjoy');
    }

    if (factors.includes('New user with low engagement')) {
      interventions.push('Provide onboarding assistance');
      interventions.push('Suggest guided learning paths');
      interventions.push('Offer early-user bonus lessons');
    }

    if (factors.includes('Declining activity trend')) {
      interventions.push('Send motivation reminder');
      interventions.push('Suggest streak-building challenge');
      interventions.push('Recommend relevant new courses');
    }

    return interventions.slice(0, 5);
  }

  private startDailyChurnPrediction(): void {
    setInterval(() => {
      this.predictAllUsers().catch((err) =>
        console.error('Daily churn prediction error:', err)
      );
    }, 24 * 60 * 60 * 1000);
  }

  private async predictAllUsers(): Promise<void> {
    try {
      const snapshot = await this.db.collection('users').get();
      for (const userDoc of snapshot.docs) {
        await this.predictChurnRisk(userDoc.id);
      }
    } catch (error: any) {
      console.error('Error predicting churn for all users:', error);
    }
  }
}

export const predictiveAnalyticsService = new PredictiveAnalyticsService();
