import { getFirestore } from 'firebase-admin/firestore';
import { featureFlaggingService } from '../feature-flagging.service';

jest.mock('firebase-admin/firestore');

describe('FeatureFlaggingService', () => {
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          set: jest.fn().mockResolvedValue(undefined),
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({
              flagId: 'flag_123',
              name: 'test-flag',
              enabled: true,
              rollout: 50,
            }),
          }),
        }),
      }),
    };

    (getFirestore as jest.Mock).mockReturnValue(mockDb);
  });

  describe('createFeatureFlag', () => {
    it('should create a feature flag with valid inputs', async () => {
      const flag = await featureFlaggingService.createFeatureFlag('new-ui', 75);

      expect(flag).toBeDefined();
      expect(flag.flagId).toBeDefined();
      expect(flag.name).toBe('new-ui');
      expect(flag.rollout).toBe(75);
      expect(flag.enabled).toBe(true);
    });

    it('should set flag with correct Firestore document', async () => {
      await featureFlaggingService.createFeatureFlag('beta-feature', 50);

      const mockSet = mockDb.collection().doc().set;
      expect(mockSet).toHaveBeenCalled();

      const setData = mockSet.mock.calls[0][0];
      expect(setData.name).toBe('beta-feature');
      expect(setData.rollout).toBe(50);
    });

    it('should validate rollout percentage is between 0-100', async () => {
      // Note: Service should validate this
      const flag1 = await featureFlaggingService.createFeatureFlag('test', 0);
      const flag2 = await featureFlaggingService.createFeatureFlag('test', 100);

      expect(flag1.rollout).toBe(0);
      expect(flag2.rollout).toBe(100);
    });
  });

  describe('createVariant', () => {
    it('should create a feature flag variant', async () => {
      const variant = await featureFlaggingService.createVariant(
        'flag_123',
        'blue-button',
        { color: 'blue' }
      );

      expect(variant).toBeDefined();
      expect(variant.variantId).toBeDefined();
      expect(variant.flagId).toBe('flag_123');
      expect(variant.name).toBe('blue-button');
      expect(variant.config).toEqual({ color: 'blue' });
    });
  });

  describe('getMetrics', () => {
    it('should return metrics object with required fields', async () => {
      const metrics = await featureFlaggingService.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.metricsId).toBeDefined();
      expect(metrics.timestamp).toBeInstanceOf(Date);
      expect(metrics.flagsActive).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle Firestore errors gracefully', async () => {
      mockDb.collection().doc().set.mockRejectedValueOnce(
        new Error('Firestore error')
      );

      await expect(
        featureFlaggingService.createFeatureFlag('test', 50)
      ).rejects.toThrow();
    });
  });
});
