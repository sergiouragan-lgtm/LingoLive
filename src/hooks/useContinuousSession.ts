import { useState, useCallback, useEffect } from 'react';
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { auth } from '../firebase';

export interface ConversationMessage {
  id: string;
  sessionId: string;
  userId: string;
  role: 'student' | 'ai';
  content: string;
  audioBase64?: string;
  language: string;
  timestamp: Date;
  tokenCount?: number;
}

export interface ContinuousSession {
  id: string;
  userId: string;
  startedAt: Date;
  lastActivityAt: Date;
  isActive: boolean;
  messageCount: number;
  totalTokensUsed: number;
  language: string;
  metadata?: {
    difficultyLevel?: string;
    topicsDiscussed?: string[];
    errors?: Array<{ type: string; correction: string }>;
  };
}

interface UseContinuousSessionReturn {
  sessionId: string | null;
  messages: ConversationMessage[];
  session: ContinuousSession | null;
  isLoading: boolean;
  addMessage: (content: string, role: 'student' | 'ai', audioBase64?: string) => Promise<void>;
  loadSessionMessages: (sessionId: string) => Promise<void>;
  createNewSession: (language: string) => Promise<string>;
  endSession: () => Promise<void>;
  sessionDurationSeconds: number;
}

export const useContinuousSession = (): UseContinuousSessionReturn => {
  const db = getFirestore();
  const userId = auth.currentUser?.uid || '';

  const [sessionId, setSessionId] = useState<string | null>(
    () => localStorage.getItem('lingolive_session_id')
  );
  const [session, setSession] = useState<ContinuousSession | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionDurationSeconds, setSessionDurationSeconds] = useState(0);

  // Atualizar duração da sessão a cada segundo
  useEffect(() => {
    if (!session?.isActive) return;

    const interval = setInterval(() => {
      setSessionDurationSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [session?.isActive]);

  // Criar nova sessão
  const createNewSession = useCallback(
    async (language: string): Promise<string> => {
      if (!userId) throw new Error('User not authenticated');

      try {
        setIsLoading(true);
        const newSession: ContinuousSession = {
          id: '',
          userId,
          startedAt: new Date(),
          lastActivityAt: new Date(),
          isActive: true,
          messageCount: 0,
          totalTokensUsed: 0,
          language,
          metadata: {
            topicsDiscussed: [],
            errors: [],
          },
        };

        const docRef = await addDoc(collection(db, 'ai_tutor_sessions'), newSession);
        const createdSessionId = docRef.id;

        const sessionWithId: ContinuousSession = { ...newSession, id: createdSessionId };
        setSession(sessionWithId);
        setSessionId(createdSessionId);
        setMessages([]);
        setSessionDurationSeconds(0);

        localStorage.setItem('lingolive_session_id', createdSessionId);

        return createdSessionId;
      } catch (error) {
        console.error('Error creating session:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, db]
  );

  // Adicionar mensagem à sessão
  const addMessage = useCallback(
    async (content: string, role: 'student' | 'ai', audioBase64?: string) => {
      if (!sessionId || !userId) return;

      try {
        const message: Omit<ConversationMessage, 'id'> = {
          sessionId,
          userId,
          role,
          content,
          audioBase64,
          language: session?.language || 'en',
          timestamp: new Date(),
        };

        const docRef = await addDoc(collection(db, 'ai_tutor_messages'), message);

        // Atualizar última atividade da sessão
        await updateDoc(doc(db, 'ai_tutor_sessions', sessionId), {
          lastActivityAt: Timestamp.now(),
          messageCount: (session?.messageCount || 0) + 1,
        });

        // Atualizar estado local
        setMessages((prev) => [
          ...prev,
          {
            id: docRef.id,
            ...message,
          },
        ]);

        setSession((prev) =>
          prev ? { ...prev, messageCount: prev.messageCount + 1, lastActivityAt: new Date() } : null
        );
      } catch (error) {
        console.error('Error adding message:', error);
        throw error;
      }
    },
    [sessionId, userId, session, db]
  );

  // Carregar mensagens de uma sessão
  const loadSessionMessages = useCallback(
    async (targetSessionId: string) => {
      if (!userId) return;

      try {
        setIsLoading(true);
        const q = query(
          collection(db, 'ai_tutor_messages'),
          where('sessionId', '==', targetSessionId),
          where('userId', '==', userId),
          orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const loadedMessages: ConversationMessage[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            loadedMessages.push({
              id: doc.id,
              sessionId: data.sessionId,
              userId: data.userId,
              role: data.role,
              content: data.content,
              audioBase64: data.audioBase64,
              language: data.language,
              timestamp: data.timestamp?.toDate() || new Date(),
              tokenCount: data.tokenCount,
            });
          });
          setMessages(loadedMessages);
        });

        // Também carregar dados da sessão
        const sessionDoc = await (
          await import('firebase/firestore')
        ).getDoc(doc(db, 'ai_tutor_sessions', targetSessionId));

        if (sessionDoc.exists()) {
          const sessionData = sessionDoc.data();
          const loadedSession: ContinuousSession = {
            id: sessionDoc.id,
            userId: sessionData.userId,
            startedAt: sessionData.startedAt?.toDate() || new Date(),
            lastActivityAt: sessionData.lastActivityAt?.toDate() || new Date(),
            isActive: sessionData.isActive || false,
            messageCount: sessionData.messageCount || 0,
            totalTokensUsed: sessionData.totalTokensUsed || 0,
            language: sessionData.language,
            metadata: sessionData.metadata,
          };
          setSession(loadedSession);
          setSessionDurationSeconds(
            Math.floor((new Date().getTime() - loadedSession.startedAt.getTime()) / 1000)
          );
        }

        return unsubscribe;
      } catch (error) {
        console.error('Error loading messages:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, db]
  );

  // Encerrar sessão
  const endSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      await updateDoc(doc(db, 'ai_tutor_sessions', sessionId), {
        isActive: false,
        lastActivityAt: Timestamp.now(),
      });

      setSession((prev) => (prev ? { ...prev, isActive: false } : null));
      localStorage.removeItem('lingolive_session_id');
      setSessionId(null);
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }, [sessionId, db]);

  return {
    sessionId,
    messages,
    session,
    isLoading,
    addMessage,
    loadSessionMessages,
    createNewSession,
    endSession,
    sessionDurationSeconds,
  };
};
