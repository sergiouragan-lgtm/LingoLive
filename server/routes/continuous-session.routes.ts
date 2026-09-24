import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { continuousSessionService } from '../services/continuous-session.service';

const router = Router();

/**
 * POST /api/ia-live
 * Enviar mensagem e obter resposta da IA com contexto de sessão
 */
router.post('/api/ia-live', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;
    const { sessionId, mensagemUsuario, language, conversationHistory = [] } = req.body;

    // Validação de entrada
    if (!sessionId || !mensagemUsuario || !language) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: sessionId, mensagemUsuario, language',
      });
    }

    // Verificar que a sessão pertence ao utilizador
    const session = await continuousSessionService.getSession(sessionId, userId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Sessão não encontrada ou não autorizada',
      });
    }

    if (!session.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Sessão foi encerrada',
      });
    }

    // Gerar resposta da IA
    const { response: aiResponse, tokenCount } = await continuousSessionService.generateAIResponse(
      sessionId,
      userId,
      mensagemUsuario,
      language,
      conversationHistory
    );

    res.json({
      success: true,
      respostaAI: aiResponse,
      tokenCount,
      sessionId,
      sessionActive: true,
    });
  } catch (error) {
    console.error('Error in ia-live endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar mensagem',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/session/:sessionId
 * Obter dados da sessão
 */
router.get('/api/session/:sessionId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;
    const { sessionId } = req.params;

    const session = await continuousSessionService.getSession(sessionId, userId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Sessão não encontrada',
      });
    }

    res.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter sessão',
    });
  }
});

/**
 * POST /api/session/:sessionId/end
 * Encerrar sessão
 */
router.post('/api/session/:sessionId/end', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;
    const { sessionId } = req.params;

    await continuousSessionService.endSession(sessionId, userId);

    res.json({
      success: true,
      message: 'Sessão encerrada',
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao encerrar sessão',
    });
  }
});

/**
 * GET /api/user/session-stats
 * Obter estatísticas de sessão do utilizador
 */
router.get('/api/user/session-stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;

    const stats = await continuousSessionService.getUserSessionStats(userId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error fetching session stats:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter estatísticas',
    });
  }
});

export default router;
