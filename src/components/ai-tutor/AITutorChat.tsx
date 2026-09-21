import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Mic, Square, MessageCircle, BookOpen, Lightbulb, CheckCircle2 } from 'lucide-react';
import { auth } from '../../firebase';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useMonitoring } from '../../hooks/useMonitoring';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

interface Message {
  id: string;
  role: 'user' | 'tutor';
  content: string;
  timestamp: number;
  type?: 'text' | 'grammar-correction' | 'pronunciation-feedback' | 'suggestion';
  metadata?: {
    corrected?: string;
    explanation?: string;
    confidence?: number;
  };
}

interface TutorSession {
  id: string;
  userId: string;
  startedAt: number;
  endedAt?: number;
  language: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  topic?: string;
  messages: Message[];
  xpEarned: number;
  focusAreas?: string[];
}

interface AITutorChatProps {
  userId: string;
  language: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  sessionId?: string;
  onClose?: () => void;
}

export const AITutorChat: React.FC<AITutorChatProps> = ({
  userId,
  language,
  level,
  sessionId,
  onClose,
}) => {
  const authUserId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(authUserId);
  const { monitors } = useMonitoring();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<TutorSession | null>(null);

  // Track chat session opened
  useEffect(() => {
    if (authUserId) {
      trackEvent('ai_tutor_chat_session_opened', {
        language,
        level,
        sessionId: sessionId || 'new',
      });
    }
  }, [authUserId, trackEvent, language, level, sessionId]);

  // Use the hook with collection path and handle the returned array
  const { data: sessions } = useRealtimeSync<TutorSession>(
    'ai_tutor_sessions',
    [],
    { enabled: !!sessionId }
  );

  useEffect(() => {
    if (sessions && sessions.length > 0) {
      const currentSession = sessions.find(s => s.id === sessionId);
      if (currentSession) {
        setSession(currentSession);
        setMessages(currentSession.messages || []);
      }
    }
  }, [sessions, sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processPronunciation(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone access denied:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processPronunciation = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('language', language);

      const token = await getAuthToken();
      const response = await fetch('/api/tutor/pronunciation-check', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const { transcribed, feedback, confidence } = await response.json();
      setTranscript(transcribed);

      // Track pronunciation check
      if (authUserId) {
        trackEvent('ai_tutor_pronunciation_checked', {
          language,
          level,
          confidence: confidence || 0,
          transcribedLength: transcribed?.length || 0,
        });
      }

      const feedbackMessage: Message = {
        id: Date.now().toString(),
        role: 'tutor',
        content: feedback,
        timestamp: Date.now(),
        type: 'pronunciation-feedback',
        metadata: { confidence },
      };

      setMessages((prev) => [...prev, feedbackMessage]);
    } catch (error) {
      console.error('Pronunciation processing failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      type: 'text',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const token = await getAuthToken();
      const response = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text,
          language,
          level,
          conversationHistory: messages.slice(-5),
          userId,
        }),
      });

      const { reply, type, metadata, suggestions } = await response.json();

      // Track message sent
      if (authUserId) {
        trackEvent('ai_tutor_message_sent', {
          language,
          level,
          messageLength: text.length,
          messageType: type || 'text',
          hasSuggestions: !!suggestions && suggestions.length > 0,
        });
      }

      const tutorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'tutor',
        content: reply,
        timestamp: Date.now(),
        type: type || 'text',
        metadata,
      };

      setMessages((prev) => [...prev, tutorMessage]);

      if (suggestions && suggestions.length > 0) {
        const suggestionMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'tutor',
          content: suggestions.join('\n'),
          timestamp: Date.now(),
          type: 'suggestion',
        };
        setMessages((prev) => [...prev, suggestionMessage]);
      }
    } catch (error) {
      console.error('Chat request failed:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'tutor',
        content:
          'Desculpe, houve um erro ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: Date.now(),
        type: 'text',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getAuthToken = async (): Promise<string> => {
    return (await (window as any).auth?.currentUser?.getIdToken?.()) || '';
  };

  const handleClose = useCallback(() => {
    if (authUserId) {
      trackEvent('ai_tutor_chat_closed', {
        language,
        level,
        messageCount: messages.length,
        sessionDuration: session ? Date.now() - session.startedAt : 0,
      });
    }
    onClose?.();
  }, [authUserId, trackEvent, language, level, messages.length, session, onClose]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <MessageCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">AI Tutor</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {level} • {language}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : message.type === 'pronunciation-feedback'
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-bl-none'
                      : message.type === 'grammar-correction'
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-bl-none'
                        : message.type === 'suggestion'
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-bl-none'
                          : 'bg-gray-100 dark:bg-gray-700 rounded-bl-none'
                }`}
              >
                {message.type === 'pronunciation-feedback' && (
                  <div className="flex items-start gap-2 mb-2">
                    <Mic className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                      Feedback de Pronúncia
                    </span>
                  </div>
                )}

                {message.type === 'grammar-correction' && (
                  <div className="flex items-start gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
                      Correção Gramatical
                    </span>
                  </div>
                )}

                {message.type === 'suggestion' && (
                  <div className="flex items-start gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                      Sugestões
                    </span>
                  </div>
                )}

                <p
                  className={`text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'text-white'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {message.content}
                </p>

                {message.metadata?.corrected && (
                  <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border-l-2 border-green-500">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Forma correta:</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {message.metadata.corrected}
                    </p>
                    {message.metadata.explanation && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        {message.metadata.explanation}
                      </p>
                    )}
                  </div>
                )}

                {message.metadata?.confidence !== undefined && (
                  <div className="mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400" />
                    <span className="text-xs text-green-700 dark:text-green-300">
                      Confiança: {Math.round(message.metadata.confidence * 100)}%
                    </span>
                  </div>
                )}

                <p className="text-xs opacity-70 mt-2">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg rounded-bl-none p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Transcript Display */}
      {transcript && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border-t border-indigo-200 dark:border-indigo-800"
        >
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">Transcrição:</p>
          <p className="text-sm text-indigo-900 dark:text-indigo-100">{transcript}</p>
        </motion.div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-slate-800">
        <div className="flex gap-3 mb-3">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
              isRecording
                ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800'
            }`}
            disabled={isLoading}
          >
            {isRecording ? (
              <Square className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(input);
                }
              }}
              placeholder="Escreva sua resposta ou use o microfone..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400"
              disabled={isLoading || isRecording}
            />

            <button
              onClick={() => handleSendMessage(input)}
              disabled={!input.trim() || isLoading || isRecording}
              className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Pressione Enter para enviar ou use o microfone para praticar pronúncia
        </p>
      </div>
    </div>
  );
};
