import { renderHook, act, waitFor } from '@testing-library/react';
import { useContinuousSession } from '../useContinuousSession';
import * as firebaseModule from '../../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';

// Mock Firebase
jest.mock('../../firebase');
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  Timestamp: {
    now: jest.fn(),
  },
}));

describe('useContinuousSession', () => {
  const mockUserId = 'test-user-123';
  const mockSessionId = 'session-456';
  const mockLanguage = 'Portuguese';

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (firebaseModule.auth.currentUser as any) = { uid: mockUserId };
  });

  describe('createNewSession', () => {
    it('should create a new session and store sessionId in localStorage', async () => {
      const mockDocRef = { id: mockSessionId };
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const { result } = renderHook(() => useContinuousSession());

      let newSessionId: string;
      await act(async () => {
        newSessionId = await result.current.createNewSession(mockLanguage);
      });

      expect(newSessionId).toBe(mockSessionId);
      expect(localStorage.getItem('lingolive_session_id')).toBe(mockSessionId);
      expect(result.current.sessionId).toBe(mockSessionId);
    });

    it('should throw error if user is not authenticated', async () => {
      (firebaseModule.auth.currentUser as any) = null;

      const { result } = renderHook(() => useContinuousSession());

      await act(async () => {
        await expect(result.current.createNewSession(mockLanguage)).rejects.toThrow(
          'User not authenticated'
        );
      });
    });

    it('should initialize session with correct data structure', async () => {
      const mockDocRef = { id: mockSessionId };
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const { result } = renderHook(() => useContinuousSession());

      await act(async () => {
        await result.current.createNewSession(mockLanguage);
      });

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: mockUserId,
          language: mockLanguage,
          isActive: true,
          messageCount: 0,
          totalTokensUsed: 0,
        })
      );
    });
  });

  describe('addMessage', () => {
    beforeEach(() => {
      localStorage.setItem('lingolive_session_id', mockSessionId);
    });

    it('should add a message and update session', async () => {
      const mockDocRef = { id: 'message-789' };
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useContinuousSession());
      result.current.sessionId = mockSessionId;
      result.current.session = {
        id: mockSessionId,
        userId: mockUserId,
        language: mockLanguage,
        startedAt: new Date(),
        lastActivityAt: new Date(),
        isActive: true,
        messageCount: 0,
        totalTokensUsed: 0,
      };

      const messageContent = 'Hello, how are you?';

      await act(async () => {
        await result.current.addMessage(messageContent, 'student');
      });

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          sessionId: mockSessionId,
          userId: mockUserId,
          role: 'student',
          content: messageContent,
        })
      );
    });

    it('should handle AI response messages', async () => {
      const mockDocRef = { id: 'message-789' };
      const audioBase64 = 'data:audio/mp3;base64,ABC123';
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const { result } = renderHook(() => useContinuousSession());
      result.current.sessionId = mockSessionId;
      result.current.session = {
        id: mockSessionId,
        userId: mockUserId,
        language: mockLanguage,
        startedAt: new Date(),
        lastActivityAt: new Date(),
        isActive: true,
        messageCount: 0,
        totalTokensUsed: 0,
      };

      const aiResponse = 'Eu estou bem, obrigado!';

      await act(async () => {
        await result.current.addMessage(aiResponse, 'ai', audioBase64);
      });

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          role: 'ai',
          content: aiResponse,
          audioBase64,
        })
      );
    });

    it('should not add message if no sessionId', async () => {
      const { result } = renderHook(() => useContinuousSession());

      await act(async () => {
        await result.current.addMessage('test', 'student');
      });

      expect(addDoc).not.toHaveBeenCalled();
    });
  });

  describe('endSession', () => {
    beforeEach(() => {
      localStorage.setItem('lingolive_session_id', mockSessionId);
    });

    it('should end session and clear localStorage', async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useContinuousSession());
      result.current.sessionId = mockSessionId;

      await act(async () => {
        await result.current.endSession();
      });

      expect(updateDoc).toHaveBeenCalled();
      expect(localStorage.getItem('lingolive_session_id')).toBeNull();
      expect(result.current.sessionId).toBeNull();
    });

    it('should mark session as inactive', async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useContinuousSession());
      result.current.sessionId = mockSessionId;

      await act(async () => {
        await result.current.endSession();
      });

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          isActive: false,
        })
      );
    });
  });

  describe('session duration tracking', () => {
    it('should increment session duration every second', async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() => useContinuousSession());
      result.current.session = {
        id: mockSessionId,
        userId: mockUserId,
        language: mockLanguage,
        startedAt: new Date(),
        lastActivityAt: new Date(),
        isActive: true,
        messageCount: 0,
        totalTokensUsed: 0,
      };

      expect(result.current.sessionDurationSeconds).toBe(0);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.sessionDurationSeconds).toBe(1);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.sessionDurationSeconds).toBe(6);

      jest.useRealTimers();
    });

    it('should stop tracking when session is inactive', async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() => useContinuousSession());
      result.current.session = {
        id: mockSessionId,
        userId: mockUserId,
        language: mockLanguage,
        startedAt: new Date(),
        lastActivityAt: new Date(),
        isActive: false,
        messageCount: 0,
        totalTokensUsed: 0,
      };

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.sessionDurationSeconds).toBe(0);

      jest.useRealTimers();
    });
  });

  describe('localStorage persistence', () => {
    it('should load sessionId from localStorage on mount', () => {
      localStorage.setItem('lingolive_session_id', mockSessionId);

      const { result } = renderHook(() => useContinuousSession());

      expect(result.current.sessionId).toBe(mockSessionId);
    });

    it('should handle missing sessionId gracefully', () => {
      const { result } = renderHook(() => useContinuousSession());

      expect(result.current.sessionId).toBeNull();
    });
  });
});
