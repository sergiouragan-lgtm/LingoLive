import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface FederatedLearningModel {
  id: string;
  name: string;
  version: string;
  taskType: 'engagement' | 'churn' | 'revenue' | 'learning';
  globalAccuracy: number;
  participantCount: number;
  roundNumber: number;
  status: 'initializing' | 'aggregating' | 'distributing' | 'completed';
  createdAt: Date;
  lastRoundAt?: Date;
}

export interface LocalUpdate {
  id: string;
  participantId: string;
  modelId: string;
  round: number;
  weights: Record<string, number[]>;
  accuracy: number;
  dataSize: number;
  timestamp: Date;
}

export interface DifferentialPrivacyConfig {
  epsilon: number; // Privacy budget
  delta: number; // Failure probability
  clipNorm: number; // Gradient clipping threshold
  noiseScale: number; // Gaussian noise scale
}

export interface PrivacyReport {
  reportId: string;
  modelId: string;
  privacyBudgetUsed: number;
  privacyBudgetRemaining: number;
  dataExposureRisk: number; // 0-100
  membershipInferenceRisk: number; // 0-100
  modelInversionRisk: number; // 0-100
  generatedAt: Date;
}

export interface SecureAggregation {
  aggregationId: string;
  round: number;
  modelId: string;
  totalParticipants: number;
  aggregatedParticipants: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  aggregatedWeights?: Record<string, number[]>;
  completedAt?: Date;
}

class FederatedLearningService {
  private db: Firestore;

  constructor() {
    this.db = getFirestore();
    this.scheduleAggregationRounds();
  }

  public async initializeFederatedModel(
    name: string,
    taskType: 'engagement' | 'churn' | 'revenue' | 'learning'
  ): Promise<FederatedLearningModel> {
    try {
      const modelId = `fl-${taskType}-${Date.now()}`;

      const model: FederatedLearningModel = {
        id: modelId,
        name,
        version: '1.0',
        taskType,
        globalAccuracy: 0,
        participantCount: 0,
        roundNumber: 0,
        status: 'initializing',
        createdAt: new Date(),
      };

      await this.db
        .collection('federated_learning_models')
        .doc(modelId)
        .set(model);

      logSecurityEvent(
        'FEDERATED_MODEL_INITIALIZED' as any,
        'info' as any,
        `Federated learning model initialized: ${name}`,
        { taskType },
        { modelId }
      );

      return model;
    } catch (error: any) {
      console.error('Error initializing federated model:', error);
      throw error;
    }
  }

  public async submitLocalUpdate(
    participantId: string,
    modelId: string,
    weights: Record<string, number[]>,
    accuracy: number,
    dataSize: number
  ): Promise<LocalUpdate> {
    try {
      const model = await this.db
        .collection('federated_learning_models')
        .doc(modelId)
        .get();

      if (!model.exists) {
        throw new Error(`Model ${modelId} not found`);
      }

      const modelData = model.data() as any;
      const updateId = `update-${participantId}-${modelId}-${Date.now()}`;

      const update: LocalUpdate = {
        id: updateId,
        participantId,
        modelId,
        round: modelData.roundNumber,
        weights,
        accuracy,
        dataSize,
        timestamp: new Date(),
      };

      await this.db
        .collection('federated_local_updates')
        .doc(updateId)
        .set(update);

      logSecurityEvent(
        'LOCAL_UPDATE_SUBMITTED' as any,
        'info' as any,
        `Local update submitted for model ${modelId}`,
        { participantId, round: modelData.roundNumber },
        { updateId }
      );

      return update;
    } catch (error: any) {
      console.error('Error submitting local update:', error);
      throw error;
    }
  }

  public async aggregateModelUpdates(modelId: string): Promise<FederatedLearningModel> {
    try {
      const model = await this.db
        .collection('federated_learning_models')
        .doc(modelId)
        .get();

      if (!model.exists) {
        throw new Error(`Model ${modelId} not found`);
      }

      const modelData = model.data() as any;
      const currentRound = modelData.roundNumber;

      const updates = await this.db
        .collection('federated_local_updates')
        .where('modelId', '==', modelId)
        .where('round', '==', currentRound)
        .get();

      if (updates.empty) {
        throw new Error(`No updates found for round ${currentRound}`);
      }

      const aggregatedWeights = this.secureWeightAggregation(
        updates.docs.map((d) => d.data() as any)
      );

      const avgAccuracy =
        updates.docs.reduce((sum, d) => sum + (d.data().accuracy || 0), 0) / updates.size;

      const updatedModel: FederatedLearningModel = {
        ...modelData,
        globalAccuracy: avgAccuracy,
        participantCount: updates.size,
        roundNumber: currentRound + 1,
        status: 'distributing',
        lastRoundAt: new Date(),
      };

      await this.db
        .collection('federated_learning_models')
        .doc(modelId)
        .update(updatedModel);

      logSecurityEvent(
        'MODEL_AGGREGATION_COMPLETED' as any,
        'info' as any,
        `Federated model aggregation completed for round ${currentRound}`,
        { participants: updates.size, avgAccuracy },
        { modelId }
      );

      return updatedModel;
    } catch (error: any) {
      console.error('Error aggregating model updates:', error);
      throw error;
    }
  }

  public async applyDifferentialPrivacy(
    weights: Record<string, number[]>,
    config: DifferentialPrivacyConfig
  ): Promise<Record<string, number[]>> {
    try {
      const noisyWeights: Record<string, number[]> = {};

      for (const [key, weightVector] of Object.entries(weights)) {
        // Clip gradients to norm bound
        const norm = Math.sqrt(weightVector.reduce((sum, w) => sum + w * w, 0));
        const clippingFactor = Math.min(1, config.clipNorm / (norm + 1e-6));

        const clippedWeights = weightVector.map((w) => w * clippingFactor);

        // Add Gaussian noise for differential privacy
        const noisedWeights = clippedWeights.map(() => {
          const u1 = Math.random();
          const u2 = Math.random();
          const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
          return z * config.noiseScale;
        });

        noisyWeights[key] = clippedWeights.map((w, i) => w + noisedWeights[i]);
      }

      return noisyWeights;
    } catch (error: any) {
      console.error('Error applying differential privacy:', error);
      throw error;
    }
  }

  public async generatePrivacyReport(modelId: string): Promise<PrivacyReport> {
    try {
      const model = await this.db
        .collection('federated_learning_models')
        .doc(modelId)
        .get();

      if (!model.exists) {
        throw new Error(`Model ${modelId} not found`);
      }

      const updates = await this.db
        .collection('federated_local_updates')
        .where('modelId', '==', modelId)
        .get();

      const privacyBudget = 8.0; // Total epsilon budget
      const privacyBudgetUsed = Math.min(privacyBudget, updates.size * 0.1); // Simplified calculation

      const report: PrivacyReport = {
        reportId: `privacy-${modelId}-${Date.now()}`,
        modelId,
        privacyBudgetUsed,
        privacyBudgetRemaining: Math.max(0, privacyBudget - privacyBudgetUsed),
        dataExposureRisk: Math.max(0, 100 - privacyBudgetUsed * 12.5),
        membershipInferenceRisk: Math.max(0, 50 - updates.size * 0.5),
        modelInversionRisk: Math.max(0, 40 - updates.size * 0.3),
        generatedAt: new Date(),
      };

      await this.db
        .collection('privacy_reports')
        .doc(report.reportId)
        .set(report);

      return report;
    } catch (error: any) {
      console.error('Error generating privacy report:', error);
      throw error;
    }
  }

  public async getFederatedModels(status?: string): Promise<FederatedLearningModel[]> {
    try {
      let query: any = this.db.collection('federated_learning_models');

      if (status) {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        lastRoundAt: doc.data().lastRoundAt?.toDate?.() || undefined,
      } as FederatedLearningModel));
    } catch (error: any) {
      console.error('Error fetching federated models:', error);
      return [];
    }
  }

  public async getLocalUpdates(
    modelId: string,
    round?: number,
    limit: number = 100
  ): Promise<LocalUpdate[]> {
    try {
      let query: any = this.db
        .collection('federated_local_updates')
        .where('modelId', '==', modelId);

      if (round !== undefined) {
        query = query.where('round', '==', round);
      }

      const snapshot = await query
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(),
      } as LocalUpdate));
    } catch (error: any) {
      console.error('Error fetching local updates:', error);
      return [];
    }
  }

  public async getAggregationStatus(modelId: string): Promise<SecureAggregation | null> {
    try {
      const aggregation = await this.db
        .collection('secure_aggregations')
        .where('modelId', '==', modelId)
        .orderBy('round', 'desc')
        .limit(1)
        .get();

      if (aggregation.empty) {
        return null;
      }

      const data = aggregation.docs[0].data() as any;
      return {
        ...data,
        completedAt: data.completedAt?.toDate?.() || undefined,
      } as SecureAggregation;
    } catch (error: any) {
      console.error('Error getting aggregation status:', error);
      return null;
    }
  }

  private secureWeightAggregation(updates: any[]): Record<string, number[]> {
    const aggregated: Record<string, number[]> = {};

    if (updates.length === 0) return aggregated;

    const firstWeights = updates[0].weights;

    for (const key of Object.keys(firstWeights)) {
      const dimension = firstWeights[key].length;
      const avgWeights: number[] = Array(dimension).fill(0);

      for (const update of updates) {
        for (let i = 0; i < dimension; i++) {
          avgWeights[i] += update.weights[key][i];
        }
      }

      aggregated[key] = avgWeights.map((w) => w / updates.length);
    }

    return aggregated;
  }

  private scheduleAggregationRounds(): void {
    setInterval(async () => {
      try {
        const models = await this.getFederatedModels('aggregating');

        for (const model of models) {
          try {
            await this.aggregateModelUpdates(model.id);
          } catch (error) {
            console.error(`Aggregation error for model ${model.id}:`, error);
          }
        }
      } catch (error: any) {
        console.error('Aggregation scheduling error:', error);
      }
    }, 60 * 60 * 1000); // Every hour
  }
}

export const federatedLearningService = new FederatedLearningService();
