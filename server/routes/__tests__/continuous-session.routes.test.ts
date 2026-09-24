import request from 'supertest';
import express, { Express } from 'express';
import continuousSessionRouter from '../continuous-session.routes';
import { continuousSessionService } from '../../services/continuous-session.service';
import { requireAuth } from '../../middleware/requireAuth';

// Mock services and middleware
jest.mock('../../services/continuous-session.service');
jest.mock('../../middleware/requireAuth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = { uid: 'test-user-123' };
    next();
  },
}));

describe('Continuous Session Routes', () => {
  let app: Express;
  const mockUserId = 'test-user-123';
  const mockSessionId = 'session-456';

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(continuousSessionRouter);
    jest.clearAllMocks();
  });

  describe('POST /api/ia-live', () => {
    it('should send message and get AI response', async () => {
      const mockResponse = 'Olá! Como posso ajudar?';

      (continuousSessionService.getSession as jest.Mock).mockResolvedValue({
        id: mockSessionId,
        userId: mockUserId,
        isActive: true,
        language: 'Portuguese',
      });

      (continuousSessionService.generateAIResponse as jest.Mock).mockResolvedValue({
        response: mockResponse,
        tokenCount: 45,
      });

      const response = await request(app)
        .post('/api/ia-live')
        .send({
          sessionId: mockSessionId,
          mensagemUsuario: 'Olá, como estás?',
          language: 'Portuguese',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          respostaAI: mockResponse,
          tokenCount: 45,
        })
      );
    });

    it('should return 400 if required fields missing', async () => {
      const response = await request(app)
        .post('/api/ia-live')
        .send({
          mensagemUsuario: 'Hello',
          // Missing sessionId and language
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('obrigatórios'),
        })
      );
    });

    it('should return 404 if session not found', async () => {
      (continuousSessionService.getSession as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/ia-live')
        .send({
          sessionId: 'non-existent',
          mensagemUsuario: 'Hello',
          language: 'Portuguese',
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('não encontrada'),
        })
      );
    });

    it('should return 400 if session is not active', async () => {
      (continuousSessionService.getSession as jest.Mock).mockResolvedValue({
        id: mockSessionId,
        userId: mockUserId,
        isActive: false,
        language: 'Portuguese',
      });

      const response = await request(app)
        .post('/api/ia-live')
        .send({
          sessionId: mockSessionId,
          mensagemUsuario: 'Hello',
          language: 'Portuguese',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('encerrada'),
        })
      );
    });

    it('should handle OpenAI API errors gracefully', async () => {
      (continuousSessionService.getSession as jest.Mock).mockResolvedValue({
        id: mockSessionId,
        userId: mockUserId,
        isActive: true,
        language: 'Portuguese',
      });

      (continuousSessionService.generateAIResponse as jest.Mock).mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      const response = await request(app)
        .post('/api/ia-live')
        .send({
          sessionId: mockSessionId,
          mensagemUsuario: 'Hello',
          language: 'Portuguese',
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('processar'),
        })
      );
    });
  });

  describe('GET /api/session/:sessionId', () => {
    it('should return session data', async () => {
      const mockSession = {
        id: mockSessionId,
        userId: mockUserId,
        language: 'Portuguese',
        isActive: true,
        messageCount: 5,
        totalTokensUsed: 100,
      };

      (continuousSessionService.getSession as jest.Mock).mockResolvedValue(mockSession);

      const response = await request(app).get(`/api/session/${mockSessionId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          session: mockSession,
        })
      );
    });

    it('should return 404 if session not found', async () => {
      (continuousSessionService.getSession as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get(`/api/session/non-existent`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('não encontrada'),
        })
      );
    });
  });

  describe('POST /api/session/:sessionId/end', () => {
    it('should end session successfully', async () => {
      (continuousSessionService.endSession as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app).post(`/api/session/${mockSessionId}/end`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('encerrada'),
        })
      );
      expect(continuousSessionService.endSession).toHaveBeenCalledWith(
        mockSessionId,
        mockUserId
      );
    });

    it('should handle end session errors', async () => {
      (continuousSessionService.endSession as jest.Mock).mockRejectedValue(
        new Error('Session not found')
      );

      const response = await request(app).post(`/api/session/${mockSessionId}/end`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('finalizar'),
        })
      );
    });
  });

  describe('GET /api/user/session-stats', () => {
    it('should return user session statistics', async () => {
      const mockStats = {
        activeSessions: 1,
        totalSessions: 5,
        totalMinutesPracticed: 120,
        totalMessages: 250,
      };

      (continuousSessionService.getUserSessionStats as jest.Mock).mockResolvedValue(
        mockStats
      );

      const response = await request(app).get('/api/user/session-stats');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          stats: mockStats,
        })
      );
    });

    it('should handle stats retrieval errors', async () => {
      (continuousSessionService.getUserSessionStats as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/api/user/session-stats');

      expect(response.status).toBe(500);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('estatísticas'),
        })
      );
    });
  });

  describe('Authorization checks', () => {
    it('should include userId in all requests', async () => {
      (continuousSessionService.getSession as jest.Mock).mockResolvedValue(null);

      await request(app).get(`/api/session/${mockSessionId}`);

      // Middleware should have set user
      expect(continuousSessionService.getSession).toHaveBeenCalledWith(
        mockSessionId,
        mockUserId
      );
    });
  });

  describe('Error handling', () => {
    it('should return proper error format on all failures', async () => {
      (continuousSessionService.generateAIResponse as jest.Mock).mockRejectedValue(
        new Error('Test error')
      );

      const response = await request(app)
        .post('/api/ia-live')
        .send({
          sessionId: mockSessionId,
          mensagemUsuario: 'Hello',
          language: 'Portuguese',
        });

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('error');
      expect(response.body.success).toBe(false);
    });
  });
});
