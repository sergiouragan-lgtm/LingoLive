import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface CustomAnomalyThreshold {
  id: string;
  metric: string;
  lowerBound: number;
  upperBound: number;
  sensitivity: 'low' | 'medium' | 'high';
  adaptive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnomalyExplanation {
  anomalyId: string;
  metric: string;
  explanation: string;
  contributingFactors: Array<{
    factor: string;
    impact: number; // 0-100
    description: string;
  }>;
  similarPastAnomalies: string[];
  recommendedActions: string[];
  confidence: number;
  generatedAt: Date;
}

export interface FeatureImportance {
  anomalyId: string;
  features: Array<{
    name: string;
    importance: number; // 0-100
    direction: 'positive' | 'negative';
  }>;
  shapelyValues?: Record<string, number>;
  generatedAt: Date;
}

export interface InterpretabilityReport {
  reportId: string;
  metric: string;
  period: string; // YYYY-MM-DD to YYYY-MM-DD
  totalAnomalies: number;
  explainedAnomalies: number;
  averageConfidence: number;
  topFactors: Array<{ factor: string; frequency: number }>;
  generatedAt: Date;
}

class AnomalyInterpretabilityService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = getFirestore();
    this.scheduleThresholdOptimization();
  }

  public async setCustomThreshold(
    metric: string,
    lowerBound: number,
    upperBound: number,
    sensitivity: 'low' | 'medium' | 'high' = 'medium',
    adaptive: boolean = true
  ): Promise<CustomAnomalyThreshold> {
    try {
      const thresholdId = `threshold-${metric}-${Date.now()}`;

      const threshold: CustomAnomalyThreshold = {
        id: thresholdId,
        metric,
        lowerBound,
        upperBound,
        sensitivity,
        adaptive,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.db
        .collection('custom_anomaly_thresholds')
        .doc(thresholdId)
        .set(threshold);

      logSecurityEvent(
        'CUSTOM_THRESHOLD_SET' as any,
        'info' as any,
        `Custom anomaly threshold set for ${metric}`,
        { metric, lowerBound, upperBound, sensitivity },
        { thresholdId }
      );

      return threshold;
    } catch (error: any) {
      console.error('Error setting custom threshold:', error);
      throw error;
    }
  }

  public async getCustomThresholds(metric?: string): Promise<CustomAnomalyThreshold[]> {
    try {
      let query: any = this.db.collection('custom_anomaly_thresholds');

      if (metric) {
        query = query.where('metric', '==', metric);
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      } as CustomAnomalyThreshold));
    } catch (error: any) {
      console.error('Error fetching custom thresholds:', error);
      return [];
    }
  }

  public async explainAnomaly(anomalyId: string): Promise<AnomalyExplanation> {
    try {
      const anomaly = await this.db
        .collection('anomalies')
        .doc(anomalyId)
        .get();

      if (!anomaly.exists) {
        throw new Error(`Anomaly ${anomalyId} not found`);
      }

      const anomalyData = anomaly.data() as any;
      const contributingFactors = await this.analyzeContributingFactors(anomalyData);
      const similarAnomalies = await this.findSimilarAnomalies(anomalyData);
      const explanation = this.generateExplanationText(anomalyData, contributingFactors);
      const actions = this.recommendActions(anomalyData, contributingFactors);

      const result: AnomalyExplanation = {
        anomalyId,
        metric: anomalyData.metric,
        explanation,
        contributingFactors,
        similarPastAnomalies: similarAnomalies,
        recommendedActions: actions,
        confidence: Math.min(95, 60 + contributingFactors.length * 15),
        generatedAt: new Date(),
      };

      await this.db
        .collection('anomaly_explanations')
        .doc(anomalyId)
        .set(result);

      return result;
    } catch (error: any) {
      console.error('Error explaining anomaly:', error);
      throw error;
    }
  }

  public async getFeatureImportance(anomalyId: string): Promise<FeatureImportance> {
    try {
      const features = [
        { name: 'user_activity', importance: 85, direction: 'positive' as const },
        { name: 'conversion_rate', importance: 72, direction: 'negative' as const },
        { name: 'error_rate', importance: 68, direction: 'positive' as const },
        { name: 'api_latency', importance: 55, direction: 'positive' as const },
        { name: 'cache_hit_rate', importance: 48, direction: 'negative' as const },
      ];

      const importance: FeatureImportance = {
        anomalyId,
        features: features.sort((a, b) => b.importance - a.importance),
        generatedAt: new Date(),
      };

      await this.db
        .collection('feature_importance')
        .doc(anomalyId)
        .set(importance);

      return importance;
    } catch (error: any) {
      console.error('Error calculating feature importance:', error);
      throw error;
    }
  }

  public async generateInterpretabilityReport(
    metric: string,
    startDate: Date,
    endDate: Date
  ): Promise<InterpretabilityReport> {
    try {
      const anomalies = await this.db
        .collection('anomalies')
        .where('metric', '==', metric)
        .where('detectedAt', '>=', startDate)
        .where('detectedAt', '<=', endDate)
        .get();

      const explanations = await this.db
        .collection('anomaly_explanations')
        .where('metric', '==', metric)
        .get();

      const featureFrequency: Record<string, number> = {};
      explanations.docs.forEach((doc) => {
        const data = doc.data();
        data.contributingFactors?.forEach((factor: any) => {
          featureFrequency[factor.factor] = (featureFrequency[factor.factor] || 0) + 1;
        });
      });

      const topFactors = Object.entries(featureFrequency)
        .map(([factor, frequency]) => ({ factor, frequency }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10);

      const avgConfidence =
        explanations.size > 0
          ? explanations.docs.reduce((sum, d) => sum + d.data().confidence, 0) / explanations.size
          : 0;

      const report: InterpretabilityReport = {
        reportId: `report-${metric}-${Date.now()}`,
        metric,
        period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        totalAnomalies: anomalies.size,
        explainedAnomalies: explanations.size,
        averageConfidence: Math.round(avgConfidence),
        topFactors,
        generatedAt: new Date(),
      };

      await this.db
        .collection('interpretability_reports')
        .doc(report.reportId)
        .set(report);

      return report;
    } catch (error: any) {
      console.error('Error generating interpretability report:', error);
      throw error;
    }
  }

  public async updateAdaptiveThreshold(metric: string, newBounds: { lower: number; upper: number }): Promise<void> {
    try {
      const threshold = await this.db
        .collection('custom_anomaly_thresholds')
        .where('metric', '==', metric)
        .where('adaptive', '==', true)
        .limit(1)
        .get();

      if (!threshold.empty) {
        const doc = threshold.docs[0];
        await this.db
          .collection('custom_anomaly_thresholds')
          .doc(doc.id)
          .update({
            lowerBound: newBounds.lower,
            upperBound: newBounds.upper,
            updatedAt: new Date(),
          });

        logSecurityEvent(
          'ADAPTIVE_THRESHOLD_UPDATED' as any,
          'info' as any,
          `Adaptive threshold updated for ${metric}`,
          { metric, ...newBounds },
          {}
        );
      }
    } catch (error: any) {
      console.error('Error updating adaptive threshold:', error);
    }
  }

  private async analyzeContributingFactors(
    anomalyData: any
  ): Promise<Array<{ factor: string; impact: number; description: string }>> {
    const factors = [];

    if (anomalyData.deviation > 50) {
      factors.push({
        factor: 'high_deviation',
        impact: Math.min(100, anomalyData.deviation),
        description: `Deviation from baseline is ${Math.round(anomalyData.deviation)}%`,
      });
    }

    if (anomalyData.type === 'engagement_drop') {
      factors.push({
        factor: 'user_activity',
        impact: 80,
        description: 'Significant drop in user engagement events',
      });
    }

    if (anomalyData.severity === 'critical') {
      factors.push({
        factor: 'severity',
        impact: 90,
        description: 'Critical severity level detected',
      });
    }

    return factors;
  }

  private async findSimilarAnomalies(anomalyData: any): Promise<string[]> {
    try {
      const similar = await this.db
        .collection('anomalies')
        .where('metric', '==', anomalyData.metric)
        .where('type', '==', anomalyData.type)
        .limit(5)
        .get();

      return similar.docs.map((d) => d.id).filter((id) => id !== anomalyData.id);
    } catch {
      return [];
    }
  }

  private generateExplanationText(anomalyData: any, factors: Array<any>): string {
    const severity = anomalyData.severity || 'medium';
    const metric = anomalyData.metric || 'unknown metric';
    const deviation = anomalyData.deviation || 0;

    let text = `A ${severity} severity anomaly was detected in ${metric} `;
    text += `with ${Math.round(deviation)}% deviation from baseline. `;

    if (factors.length > 0) {
      text += `Primary contributing factors: ${factors.map((f) => f.factor).join(', ')}. `;
    }

    text += 'Immediate investigation and remediation recommended.';

    return text;
  }

  private recommendActions(anomalyData: any, factors: Array<any>): string[] {
    const actions: string[] = [];

    if (anomalyData.severity === 'critical') {
      actions.push('Escalate to on-call engineering team');
      actions.push('Review system logs for error patterns');
    }

    if (anomalyData.type === 'engagement_drop') {
      actions.push('Check recent deployments or system changes');
      actions.push('Monitor user retention metrics');
    }

    if (anomalyData.type === 'revenue_change') {
      actions.push('Verify payment gateway status');
      actions.push('Check subscription activity');
    }

    actions.push('Create incident report for post-mortem analysis');

    return actions;
  }

  private scheduleThresholdOptimization(): void {
    setInterval(async () => {
      try {
        const thresholds = await this.getCustomThresholds();

        for (const threshold of thresholds) {
          if (threshold.adaptive) {
            // Calculate optimal bounds based on recent anomalies
            const recentAnomalies = await this.db
              .collection('anomalies')
              .where('metric', '==', threshold.metric)
              .orderBy('detectedAt', 'desc')
              .limit(100)
              .get();

            const values = recentAnomalies.docs.map((d) => d.data().actualValue);
            if (values.length > 0) {
              const mean = values.reduce((a, b) => a + b, 0) / values.length;
              const stdDev = Math.sqrt(values.reduce((sq, v) => sq + Math.pow(v - mean, 2), 0) / values.length);

              const sensitivityMultiplier = {
                low: 3,
                medium: 2,
                high: 1.5,
              }[threshold.sensitivity];

              await this.updateAdaptiveThreshold(threshold.metric, {
                lower: mean - stdDev * sensitivityMultiplier,
                upper: mean + stdDev * sensitivityMultiplier,
              });
            }
          }
        }
      } catch (error: any) {
        console.error('Threshold optimization error:', error);
      }
    }, 6 * 60 * 60 * 1000); // Every 6 hours
  }
}

export const anomalyInterpretabilityService = new AnomalyInterpretabilityService();
