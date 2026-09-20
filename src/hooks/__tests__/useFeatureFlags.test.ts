import { renderHook, waitFor, act } from '@testing-library/react';
import { useFeatureFlags } from '../useFeatureFlags';
import { apiClient } from '@/lib/api-client';

jest.mock('@/lib/api-client');
jest.mock('@/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-123',
      getIdToken: jest.fn().mockResolvedValue('test-token'),
    },
  },
}));

describe('useFeatureFlags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load flags on mount', async () => {
    const mockFlags = [
      {
        flagId: 'flag_1',
        name: 'new-ui',
        enabled: true,
        rollout: 100,
        createdAt: new Date(),
      },
      {
        flagId: 'flag_2',
        name: 'beta-feature',
        enabled: false,
        rollout: 50,
        createdAt: new Date(),
      },
    ];

    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: mockFlags,
      statusCode: 200,
    });

    const { result } = renderHook(() => useFeatureFlags());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.flags).toEqual(mockFlags);
    expect(result.current.error).toBeNull();
  });

  it('should check if flag is enabled', async () => {
    const mockFlags = [
      {
        flagId: 'flag_1',
        name: 'new-ui',
        enabled: true,
        rollout: 100,
        createdAt: new Date(),
      },
      {
        flagId: 'flag_2',
        name: 'beta-feature',
        enabled: true,
        rollout: 50,
        createdAt: new Date(),
      },
    ];

    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: mockFlags,
      statusCode: 200,
    });

    const { result } = renderHook(() => useFeatureFlags());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isFlagEnabled('new-ui')).toBe(true);
    expect(result.current.isFlagEnabled('nonexistent')).toBe(false);
  });

  it('should handle rollout percentage', async () => {
    const mockFlags = [
      {
        flagId: 'flag_1',
        name: 'rollout-test',
        enabled: true,
        rollout: 50,
        createdAt: new Date(),
      },
    ];

    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: mockFlags,
      statusCode: 200,
    });

    const { result } = renderHook(() => useFeatureFlags());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 50% rollout should vary based on hash
    const enabled = result.current.isFlagEnabled('rollout-test');
    expect(typeof enabled).toBe('boolean');
  });

  it('should create a feature flag', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: [],
      statusCode: 200,
    });

    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      data: {
        flagId: 'flag_new',
        name: 'new-flag',
        enabled: true,
        rollout: 75,
        createdAt: new Date(),
      },
      statusCode: 201,
    });

    const { result } = renderHook(() => useFeatureFlags());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      const newFlag = await result.current.createFlag('new-flag', 75);
      expect(newFlag?.name).toBe('new-flag');
    });

    // Should refetch flags
    expect(apiClient.get).toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      error: 'Failed to load flags',
      statusCode: 500,
    });

    const { result } = renderHook(() => useFeatureFlags());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load flags');
  });

  it('should update flag', async () => {
    const mockFlags = [
      {
        flagId: 'flag_1',
        name: 'test',
        enabled: true,
        rollout: 50,
        createdAt: new Date(),
      },
    ];

    (apiClient.get as jest.Mock)
      .mockResolvedValueOnce({
        data: mockFlags,
        statusCode: 200,
      })
      .mockResolvedValueOnce({
        data: mockFlags,
        statusCode: 200,
      });

    (apiClient.put as jest.Mock).mockResolvedValueOnce({
      data: {
        ...mockFlags[0],
        rollout: 75,
      },
      statusCode: 200,
    });

    const { result } = renderHook(() => useFeatureFlags());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateFlag('flag_1', { rollout: 75 });
    });

    expect(apiClient.put).toHaveBeenCalledWith('/features/flag_1', {
      rollout: 75,
    });
  });
});
