import { renderHook, waitFor, act } from '@testing-library/react';
import { usePersonalization } from '../usePersonalization';
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

describe('usePersonalization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render hook', () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: [],
      statusCode: 200,
    });

    const { result } = renderHook(() => usePersonalization());
    expect(result.current).toBeDefined();
  });

  it('should load data on mount', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: [{ id: 'test-1' }],
      statusCode: 200,
    });

    const { result } = renderHook(() => usePersonalization());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
  });

  it('should handle errors', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      error: 'Failed to load data',
      statusCode: 500,
    });

    const { result } = renderHook(() => usePersonalization());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load data');
  });
});
