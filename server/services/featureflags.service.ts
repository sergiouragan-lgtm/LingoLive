import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';
import crypto from 'crypto';

export type VariantType = 'control' | 'treatment' | 'custom';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  variants: Variant[];
  targeting: {
    userIds?: string[];
    tiers?: Array<'free' | 'pro' | 'premium'>;
    regions?: string[];
    percentageStart?: number;
    percentageEnd?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Variant {
  id: string;
  name: string;
  type: VariantType;
  config: Record<string, any>;
  percentage?: number;
}

export interface ExperimentData {
  userId: string;
  flagId: string;
  variant: string;
  timestamp: Date;
}

export interface FlagEvaluationResult {
  enabled: boolean;
  variant?: Variant;
  reason: string;
}

class FeatureFlagsService {
  private db: Firestore;
  private flagCache: Map<string, { flag: FeatureFlag; expiresAt: number }> = new Map();
  private cacheExpiration = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.db = getFirestore();
  }

  public async createFlag(
    name: string,
    description: string,
    variants: Variant[],
    createdBy: string
  ): Promise<FeatureFlag> {
    const id = crypto.randomUUID();
    const now = new Date();

    const flag: FeatureFlag = {
      id,
      name,
      description,
      enabled: false,
      rolloutPercentage: 0,
      variants,
      targeting: {},
      createdAt: now,
      updatedAt: now,
      createdBy,
    };

    try {
      await this.db.collection('feature_flags').doc(id).set(flag);

      logSecurityEvent(
        'FEATURE_FLAG_CREATED' as any,
        'info' as any,
        `Feature flag created: ${name}`,
        {},
        { flagId: id, variants: variants.length }
      );

      return flag;
    } catch (error: any) {
      logSecurityEvent(
        'FEATURE_FLAG_CREATE_FAILED' as any,
        'warning' as any,
        `Failed to create feature flag: ${error.message}`,
        {},
        { error: error.message }
      );
      throw error;
    }
  }

  public async updateFlag(flagId: string, updates: Partial<FeatureFlag>): Promise<void> {
    try {
      await this.db.collection('feature_flags').doc(flagId).update({
        ...updates,
        updatedAt: new Date(),
      });

      this.flagCache.delete(flagId);

      logSecurityEvent(
        'FEATURE_FLAG_UPDATED' as any,
        'info' as any,
        `Feature flag updated: ${flagId}`,
        {},
        { flagId }
      );
    } catch (error: any) {
      logSecurityEvent(
        'FEATURE_FLAG_UPDATE_FAILED' as any,
        'warning' as any,
        `Failed to update feature flag: ${error.message}`,
        {},
        { flagId, error: error.message }
      );
      throw error;
    }
  }

  public async evaluateFlag(
    userId: string,
    flagId: string,
    userTier: 'free' | 'pro' | 'premium' = 'free',
    userRegion: string = 'US'
  ): Promise<FlagEvaluationResult> {
    try {
      const flag = await this.getFlag(flagId);

      if (!flag) {
        return {
          enabled: false,
          reason: 'Flag not found',
        };
      }

      if (!flag.enabled) {
        return {
          enabled: false,
          reason: 'Flag is disabled',
        };
      }

      // Check targeting rules
      const targeting = flag.targeting;

      if (targeting.userIds && !targeting.userIds.includes(userId)) {
        return {
          enabled: false,
          reason: 'User not in target list',
        };
      }

      if (targeting.tiers && !targeting.tiers.includes(userTier)) {
        return {
          enabled: false,
          reason: 'User tier not targeted',
        };
      }

      if (targeting.regions && !targeting.regions.includes(userRegion)) {
        return {
          enabled: false,
          reason: 'User region not targeted',
        };
      }

      // Rollout percentage check using consistent hashing
      const hash = this.hashUserId(userId, flagId);
      const percentage = (hash % 100) + 1;

      if (percentage > flag.rolloutPercentage) {
        return {
          enabled: false,
          reason: `Below rollout threshold (${percentage}% > ${flag.rolloutPercentage}%)`,
        };
      }

      // Select variant
      let selectedVariant = flag.variants[0]; // Default to first
      if (flag.variants.length > 1) {
        const variantHash = this.hashUserId(`${userId}:variants`, flagId);
        let cumulative = 0;

        for (const variant of flag.variants) {
          const variantPercentage = variant.percentage || Math.floor(100 / flag.variants.length);
          cumulative += variantPercentage;

          if ((variantHash % 100) + 1 <= cumulative) {
            selectedVariant = variant;
            break;
          }
        }
      }

      // Log experiment data
      await this.logExperiment({
        userId,
        flagId,
        variant: selectedVariant.id,
        timestamp: new Date(),
      });

      return {
        enabled: true,
        variant: selectedVariant,
        reason: `Assigned to variant: ${selectedVariant.name}`,
      };
    } catch (error: any) {
      logSecurityEvent(
        'FEATURE_FLAG_EVALUATION_FAILED' as any,
        'warning' as any,
        `Feature flag evaluation failed: ${error.message}`,
        { userId },
        { flagId, error: error.message }
      );

      return {
        enabled: false,
        reason: 'Evaluation error, defaulting to disabled',
      };
    }
  }

  public async getFlag(flagId: string): Promise<FeatureFlag | null> {
    // Check memory cache
    const cached = this.flagCache.get(flagId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.flag;
    }

    try {
      const docSnapshot = await this.db.collection('feature_flags').doc(flagId).get();

      if (docSnapshot.exists) {
        const flag = docSnapshot.data() as FeatureFlag;

        // Store in cache
        this.flagCache.set(flagId, {
          flag,
          expiresAt: Date.now() + this.cacheExpiration,
        });

        return flag;
      }

      return null;
    } catch (error: any) {
      console.error('Error fetching feature flag:', error);
      return null;
    }
  }

  public async getAllFlags(): Promise<FeatureFlag[]> {
    try {
      const snapshot = await this.db.collection('feature_flags').get();
      return snapshot.docs.map((doc) => doc.data() as FeatureFlag);
    } catch (error: any) {
      console.error('Error fetching all flags:', error);
      return [];
    }
  }

  public async getExperimentResults(
    flagId: string,
    from: Date,
    to: Date
  ): Promise<{
    variants: Record<string, number>;
    totalParticipants: number;
    conversionRates: Record<string, number>;
  }> {
    try {
      const snapshot = await this.db
        .collection('experiment_data')
        .where('flagId', '==', flagId)
        .where('timestamp', '>=', from)
        .where('timestamp', '<=', to)
        .get();

      const variantCounts: Record<string, number> = {};
      const totalParticipants = new Set<string>();

      snapshot.docs.forEach((doc) => {
        const data = doc.data() as ExperimentData;
        variantCounts[data.variant] = (variantCounts[data.variant] || 0) + 1;
        totalParticipants.add(data.userId);
      });

      return {
        variants: variantCounts,
        totalParticipants: totalParticipants.size,
        conversionRates: {}, // Can be extended with actual conversion tracking
      };
    } catch (error: any) {
      console.error('Error fetching experiment results:', error);
      return {
        variants: {},
        totalParticipants: 0,
        conversionRates: {},
      };
    }
  }

  private async logExperiment(data: ExperimentData): Promise<void> {
    try {
      await this.db.collection('experiment_data').add({
        ...data,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error logging experiment data:', error);
    }
  }

  private hashUserId(userId: string, flagId: string): number {
    const hash = crypto
      .createHash('md5')
      .update(`${userId}:${flagId}`)
      .digest('hex');

    return parseInt(hash.substring(0, 8), 16);
  }

  public clearCache(): void {
    this.flagCache.clear();
  }

  public async getStats(): Promise<{
    totalFlags: number;
    enabledFlags: number;
    averageRollout: number;
    totalExperiments: number;
  }> {
    try {
      const flagSnapshot = await this.db.collection('feature_flags').get();
      const experimentSnapshot = await this.db.collection('experiment_data').get();

      let totalRollout = 0;
      let enabledCount = 0;

      flagSnapshot.docs.forEach((doc) => {
        const flag = doc.data() as FeatureFlag;
        totalRollout += flag.rolloutPercentage;
        if (flag.enabled) enabledCount++;
      });

      const totalFlags = flagSnapshot.size;
      const averageRollout = totalFlags > 0 ? Math.round((totalRollout / totalFlags) * 100) / 100 : 0;

      return {
        totalFlags,
        enabledFlags: enabledCount,
        averageRollout,
        totalExperiments: experimentSnapshot.size,
      };
    } catch (error: any) {
      console.error('Error fetching feature flag stats:', error);
      return {
        totalFlags: 0,
        enabledFlags: 0,
        averageRollout: 0,
        totalExperiments: 0,
      };
    }
  }
}

export const featureFlagsService = new FeatureFlagsService();
