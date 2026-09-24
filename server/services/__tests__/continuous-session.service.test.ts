import { continuousSessionService } from '../continuous-session.service';
import * as admin from 'firebase-admin';
import { OpenAI } from 'openai';

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn(),
  })),
}));

// Mock OpenAI
jest.mock('openai');

describe('ContinuousSessionService', () => {
  const mockUserId = 'test-user-123';
  const mockSessionId = 'session-456';
  const mockLanguage = 'Portuguese';

  let mockDb: any;
  let mockOpenAI: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn(),
      update: jest.fn(),
    };

    (admin.firestore as jest.Mock).mockReturnValue(mockDb);

    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };

    (OpenAI as jest.Mock).mockImplementation(() => mockOpenAI);
  });

  describe('getSession', () => {
    it('should return session data for authorized user', async () => {
      const mockSessionData = {
        id: mockSessionId,
        userId: mockUserId,
        language: mockLanguage,
        isActive: true,
        messageCount: 5,
        totalTokensUsed: 100,
        startedAt: new Date(),
        lastActivityAt: new Date(),
      };

      mockDb.get.mockResolvedValue({
        exists: true,
        data: () => mockSessionData,
      });

      const session = await continuousSessionService.getSession(mockSessionId, mockUserId);

      expect(session).toBeDefined();
      expect(session?.userId).toBe(mockUserId);
      expect(session?.isActive).toBe(true);
    });

    it('should return null if session not found', async () => {
      mockDb.get.mockResolvedValue({
        exists: false,
      });

      const session = await continuousSessionService.getSession(mockSessionId, mockUserId);

      expect(session).toBeNull();
    });

    it('should return null if user is not session owner', async () => {
      const differentUserId = 'different-user-789';

      mockDb.get.mockResolvedValue({
        exists: true,
        data: () => ({
          userId: differentUserId,
          language: mockLanguage,
        }),
      });

      const session = await continuousSessionService.getSession(mockSessionId, mockUserId);

      expect(session).toBeNull();
    });
  });

  describe('getSessionContext', () => {
    it('should return last 20 messages from session', async () => {
      const mockMessages = Array.from({ length: 20 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'student' : 'ai',
        content: `Message ${i}`,
      }));

      mockDb.get.mockResolvedValue({
        forEach: (callback: any) => mockMessages.forEach(callback),
      });

      const context = await continuousSessionService.getSessionContext(mockSessionId, mockUserId);

      expect(context).toHaveLength(20);
      expect(context[0].role).toBe('user' || 'assistant');
    });

    it('should return empty array if no messages', async () => {
      mockDb.get.mockResolvedValue({
        forEach: jest.fn(),
      });

      const context = await continuousSessionService.getSessionContext(mockSessionId, mockUserId);

      expect(context).toEqual([]);
    });
  });

  describe('generateAIResponse', () => {
    it('should generate AI response with proper context', async () => {
      const mockResponse = 'Olá! Como posso ajudar?';
      const mockTokens = 45;

      mockDb.get.mockResolvedValue({
        forEach: jest.fn(),
      });

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: mockResponse,
            },
          },
        ],
        usage: {
          total_tokens: mockTokens,
        },
      });

      const result = await continuousSessionService.generateAIResponse(
        mockSessionId,
        mockUserId,
        'Olá, como estás?',
        mockLanguage
      );

      expect(result.response).toBe(mockResponse);
      expect(result.tokenCount).toBe(mockTokens);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4-turbo-preview',
          temperature: 0.7,
          max_tokens: 300,
        })
      );
    });

    it('should include conversation history in prompt', async () => {
      const mockHistory = [
        { role: 'user' as const, content: 'Olá' },
        { role: 'assistant' as const, content: 'Olá! Como estás?' },
      ];

      mockDb.get.mockResolvedValue({
        forEach: jest.fn(),
      });

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
        usage: { total_tokens: 50 },
      });

      await continuousSessionService.generateAIResponse(
        mockSessionId,
        mockUserId,
        'Estou bem, obrigado',
        mockLanguage,
        mockHistory
      );

      const callArgs = mockOpenAI.chat.completions.create.mock.calls[0][0];
      expect(callArgs.messages).toContainEqual(mockHistory[0]);
      expect(callArgs.messages).toContainEqual(mockHistory[1]);
    });

    it('should throw error on OpenAI API failure', async () => {
      mockDb.get.mockResolvedValue({
        forEach: jest.fn(),
      });

      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      await expect(
        continuousSessionService.generateAIResponse(
          mockSessionId,
          mockUserId,
          'Hello',
          mockLanguage
        )
      ).rejects.toThrow();
    });
  });

  describe('endSession', () => {
    it('should mark session as inactive', async () => {
      mockDb.get.mockResolvedValue({
        exists: true,
        data: () => ({
          userId: mockUserId,
          startedAt: new Date(),
        }),
      });

      mockDb.update.mockResolvedValue(undefined);

      await continuousSessionService.endSession(mockSessionId, mockUserId);

      expect(mockDb.update).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
        })
      );
    });

    it('should throw error if session not found', async () => {
      mockDb.get.mockResolvedValue({
        exists: false,
      });

      await expect(
        continuousSessionService.endSession(mockSessionId, mockUserId)
      ).rejects.toThrow('Session not found');
    });

    it('should calculate session duration', async () => {
      const startTime = new Date(Date.now() - 3600000); // 1 hour ago

      mockDb.get.mockResolvedValue({
        exists: true,
        data: () => ({
          userId: mockUserId,
          startedAt: startTime,
        }),
      });

      mockDb.update.mockResolvedValue(undefined);

      await continuousSessionService.endSession(mockSessionId, mockUserId);

      // Should have calculated duration
      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe('getUserSessionStats', () => {
    it('should return correct statistics for user', async () => {
      const mockSessions = [
        {
          isActive: true,
          startedAt: new Date(),
          lastActivityAt: new Date(),
          messageCount: 10,
        },
        {
          isActive: false,
          startedAt: new Date(Date.now() - 7200000),
          lastActivityAt: new Date(Date.now() - 3600000),
          messageCount: 20,
        },
      ];

      mockDb.get.mockResolvedValue({
        size: 2,
        forEach: (callback: any) => mockSessions.forEach(callback),
      });

      const stats = await continuousSessionService.getUserSessionStats(mockUserId);

      expect(stats.totalSessions).toBe(2);
      expect(stats.activeSessions).toBe(1);
      expect(stats.totalMessages).toBe(30);
    });

    it('should return zero stats for user with no sessions', async () => {
      mockDb.get.mockResolvedValue({
        size: 0,
        forEach: jest.fn(),
      });

      const stats = await continuousSessionService.getUserSessionStats(mockUserId);

      expect(stats.totalSessions).toBe(0);
      expect(stats.activeSessions).toBe(0);
      expect(stats.totalMessages).toBe(0);
    });
  });

  describe('system prompt generation', () => {
    it('should generate language-appropriate system prompt', async () => {
      mockDb.get.mockResolvedValue({
        forEach: jest.fn(),
      });

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
        usage: { total_tokens: 50 },
      });

      await continuousSessionService.generateAIResponse(
        mockSessionId,
        mockUserId,
        'Hello',
        'Portuguese'
      );

      const callArgs = mockOpenAI.chat.completions.create.mock.calls[0][0];
      const systemPrompt = callArgs.messages[0].content;

      expect(systemPrompt).toContain('Portuguese');
      expect(systemPrompt).toContain('language tutor');
    });

    it('should adjust prompt for returning students', async () => {
      const mockMessages = [
        { role: 'user' as const, content: 'Olá' },
        { role: 'assistant' as const, content: 'Olá! Como estás?' },
      ];

      mockDb.get.mockResolvedValue({
        forEach: (callback: any) => mockMessages.forEach(callback),
      });

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
        usage: { total_tokens: 50 },
      });

      await continuousSessionService.generateAIResponse(
        mockSessionId,
        mockUserId,
        'Tenho uma pergunta',
        mockLanguage
      );

      const callArgs = mockOpenAI.chat.completions.create.mock.calls[0][0];
      const systemPrompt = callArgs.messages[0].content;

      expect(systemPrompt).toContain('Continue the conversation');
    });
  });
});
