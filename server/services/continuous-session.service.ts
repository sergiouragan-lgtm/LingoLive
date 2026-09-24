import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { OpenAI } from 'openai';
import { logSecurityEvent } from './security.event.logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SessionMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ContinuousSessionData {
  id: string;
  userId: string;
  language: string;
  startedAt: Date;
  lastActivityAt: Date;
  isActive: boolean;
  messageCount: number;
  totalTokensUsed: number;
}

class ContinuousSessionService {
  private db: Firestore = getFirestore();

  /**
   * Obter contexto de sessão para construir prompt
   */
  async getSessionContext(sessionId: string, userId: string): Promise<SessionMessage[]> {
    try {
      const snapshot = await this.db
        .collection('ai_tutor_messages')
        .where('sessionId', '==', sessionId)
        .where('userId', '==', userId)
        .orderBy('timestamp', 'asc')
        .limit(20)
        .get();

      const messages: SessionMessage[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          role: data.role === 'student' ? 'user' : 'assistant',
          content: data.content,
        });
      });

      return messages;
    } catch (error) {
      console.error('Error getting session context:', error);
      throw error;
    }
  }

  /**
   * Obter dados de sessão
   */
  async getSession(sessionId: string, userId: string): Promise<ContinuousSessionData | null> {
    try {
      const docSnap = await this.db.collection('ai_tutor_sessions').doc(sessionId).get();

      if (!docSnap.exists) {
        return null;
      }

      const data = docSnap.data();

      // Verificar propriedade da sessão
      if (data?.userId !== userId) {
        logSecurityEvent(
          'SESSION_UNAUTHORIZED_ACCESS' as any,
          'warning' as any,
          `Tentativa de acesso não autorizado à sessão ${sessionId}`,
          { userId, sessionId }
        );
        return null;
      }

      return {
        id: sessionId,
        userId: data?.userId || '',
        language: data?.language || 'en',
        startedAt: data?.startedAt?.toDate?.() || new Date(),
        lastActivityAt: data?.lastActivityAt?.toDate?.() || new Date(),
        isActive: data?.isActive || false,
        messageCount: data?.messageCount || 0,
        totalTokensUsed: data?.totalTokensUsed || 0,
      };
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  }

  /**
   * Gerar resposta da IA com contexto de sessão
   */
  async generateAIResponse(
    sessionId: string,
    userId: string,
    userMessage: string,
    language: string,
    conversationHistory: SessionMessage[] = []
  ): Promise<{
    response: string;
    tokenCount: number;
    audioBase64?: string;
  }> {
    try {
      // Obter contexto da sessão
      const sessionContext = await this.getSessionContext(sessionId, userId);
      const fullHistory = [...sessionContext, ...conversationHistory];

      // Construir sistema prompt baseado no idioma
      const systemPrompt = this.buildSystemPrompt(language, sessionContext.length > 0);

      // Chamar OpenAI com histórico
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          ...fullHistory,
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
        top_p: 0.9,
      });

      const aiResponse = response.choices[0].message.content || '';
      const tokenCount = response.usage?.total_tokens || 0;

      // Atualizar uso de tokens na sessão
      await this.updateSessionTokens(sessionId, tokenCount);

      logSecurityEvent(
        'AI_RESPONSE_GENERATED' as any,
        'info' as any,
        `Resposta gerada para sessão ${sessionId}`,
        { sessionId, userId, tokenCount, messageLength: userMessage.length }
      );

      return {
        response: aiResponse,
        tokenCount,
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      logSecurityEvent(
        'AI_RESPONSE_ERROR' as any,
        'error' as any,
        `Erro ao gerar resposta para sessão ${sessionId}: ${(error as Error).message}`,
        { sessionId, userId }
      );
      throw error;
    }
  }

  /**
   * Construir sistema prompt adaptado ao idioma
   */
  private buildSystemPrompt(language: string, hasHistory: boolean): string {
    const basePrompt = `You are an expert language tutor helping students practice ${language}.
Your role is to:
1. Encourage natural conversation
2. Gently correct mistakes without interrupting flow
3. Ask follow-up questions to keep the conversation going
4. Adapt difficulty based on student responses
5. Provide engaging and culturally relevant topics`;

    if (hasHistory) {
      return (
        basePrompt +
        `

The student has been practicing for a while. Continue the conversation naturally,
referencing previous topics if appropriate. Build on what they've learned in this session.`
      );
    }

    return basePrompt;
  }

  /**
   * Atualizar tokens usados em uma sessão
   */
  private async updateSessionTokens(sessionId: string, tokenCount: number): Promise<void> {
    try {
      const docSnap = await this.db.collection('ai_tutor_sessions').doc(sessionId).get();

      if (docSnap.exists) {
        const currentTokens = docSnap.data()?.totalTokensUsed || 0;
        await this.db.collection('ai_tutor_sessions').doc(sessionId).update({
          totalTokensUsed: currentTokens + tokenCount,
          lastActivityAt: FieldValue.serverTimestamp(),
        } as any);
      }
    } catch (error) {
      console.error('Error updating session tokens:', error);
      // Não lance erro - é apenas rastreamento
    }
  }

  /**
   * Encerrar sessão
   */
  async endSession(sessionId: string, userId: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId, userId);

      if (!session) {
        throw new Error('Session not found');
      }

      await this.db.collection('ai_tutor_sessions').doc(sessionId).update({
        isActive: false,
        lastActivityAt: FieldValue.serverTimestamp(),
      } as any);

      logSecurityEvent(
        'SESSION_ENDED' as any,
        'info' as any,
        `Sessão ${sessionId} encerrada`,
        {
          sessionId,
          userId,
          duration: Math.floor((new Date().getTime() - session.startedAt.getTime()) / 1000),
          messageCount: session.messageCount,
        }
      );
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas de sessão do utilizador
   */
  async getUserSessionStats(userId: string): Promise<{
    activeSessions: number;
    totalSessions: number;
    totalMinutesPracticed: number;
    totalMessages: number;
  }> {
    try {
      const snapshot = await this.db
        .collection('ai_tutor_sessions')
        .where('userId', '==', userId)
        .get();

      let activeSessions = 0;
      let totalMinutesPracticed = 0;
      let totalMessages = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isActive) activeSessions++;

        const duration = Math.floor(
          (data.lastActivityAt?.toDate?.() || new Date()).getTime() -
            (data.startedAt?.toDate?.() || new Date()).getTime()
        );
        totalMinutesPracticed += duration / 60000;
        totalMessages += data.messageCount || 0;
      });

      return {
        activeSessions,
        totalSessions: snapshot.size,
        totalMinutesPracticed: Math.round(totalMinutesPracticed),
        totalMessages,
      };
    } catch (error) {
      console.error('Error getting user session stats:', error);
      throw error;
    }
  }
}

export const continuousSessionService = new ContinuousSessionService();
