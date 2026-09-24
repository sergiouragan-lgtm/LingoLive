'use client';

import { useState, useEffect } from 'react';
import { Clock, Sparkles, Volume2, LogOut, RotateCcw } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useLocalization } from '../../context/LocalizationContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useMonitoring } from '../../hooks/useMonitoring';
import { useContinuousSession } from '../../hooks/useContinuousSession';
import { formatTime } from '../../utils/formatTime';

export default function LiveChatAluno() {
  const { localization } = useLocalization();
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  // Use novo sistema de sessões contínuas
  const {
    sessionId,
    messages,
    session,
    isLoading,
    addMessage,
    createNewSession,
    endSession,
    sessionDurationSeconds,
  } = useContinuousSession();

  const [mensagem, setMensagem] = useState('');
  const [status, setStatus] = useState('Pronto para falar');
  const [carregando, setCarregando] = useState(false);
  const [isSessionStarting, setIsSessionStarting] = useState(false);

  // Lifecycle tracking - Initialize session on component mount
  useEffect(() => {
    if (userId && !sessionId) {
      startNewSession();
    }
  }, [userId]);

  useEffect(() => {
    if (userId && sessionId) {
      trackEvent('live_chat_aluno_accessed', {
        localization,
        sessionId,
      });
    }
  }, [userId, sessionId, trackEvent, localization]);

  // Iniciar nova sessão
  const startNewSession = async () => {
    try {
      setIsSessionStarting(true);
      await createNewSession(localization);
      setStatus('Sessão iniciada. Pronto para falar!');
    } catch (error) {
      console.error('Error starting session:', error);
      setStatus('Erro ao iniciar sessão.');
    } finally {
      setIsSessionStarting(false);
    }
  };

  // Finalizar sessão atual
  const handleEndSession = async () => {
    if (confirm('Tem a certeza que quer terminar esta sessão?')) {
      try {
        await endSession();
        setStatus('Sessão finalizada.');
        setMensagem('');
      } catch (error) {
        console.error('Error ending session:', error);
        setStatus('Erro ao finalizar sessão.');
      }
    }
  };

  // Enviar mensagem para a IA
  const enviarFala = async () => {
    if (!mensagem.trim()) return;
    if (!sessionId) {
      setStatus('Por favor, inicie uma nova sessão primeiro.');
      return;
    }

    setCarregando(true);
    setStatus('A IA está a pensar...');

    try {
      // Adicionar mensagem do utilizador
      await addMessage(mensagem, 'student');

      if (userId) {
        trackEvent('live_chat_message_sent', {
          messageLength: mensagem.length,
          messagesCount: messages.length + 1,
          sessionDuration: sessionDurationSeconds,
          sessionId,
        });
      }

      // Chamar API da IA
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/ia-live', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          sessionId,
          userId,
          mensagemUsuario: mensagem,
          language: localization,
          preferredVoiceId: localStorage.getItem("lingolive_tts_voice_id") || "21m00Tcm4TlvDq8ikWAM",
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      const dados = await response.json();

      if (response.ok) {
        // Adicionar resposta da IA
        await addMessage(dados.respostaAI, 'ai', dados.audioBase64);

        setStatus(`IA: "${dados.respostaAI.substring(0, 50)}..."`);

        if (userId) {
          trackEvent('ai_response_received', {
            responseLength: dados.respostaAI.length,
            hasAudio: !!dados.audioBase64,
            tokenCount: dados.tokenCount,
            sessionId,
          });
        }

        // REPRODUÇÃO DE ÁUDIO
        if (dados.audioBase64) {
          const audio = new Audio(`data:audio/mp3;base64,${dados.audioBase64}`);
          audio.play().catch(err => console.error('Audio playback error:', err));
        }
      } else {
        setStatus('Erro ao obter resposta. Tente novamente.');
        if (userId) {
          trackEvent('ai_response_failed', {
            statusCode: response.status,
            sessionId,
          });
        }
      }
    } catch (error) {
      console.error('Erro na comunicação:', error);
      setStatus('Erro de conexão. Verifique sua internet.');
      if (userId) {
        trackEvent('live_chat_error', {
          errorMessage: String(error),
          sessionId,
        });
      }
    } finally {
      setCarregando(false);
      setMensagem('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full">
        {/* Header com duração da sessão */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">Live IA Talk</h1>
            <p className="text-sm text-slate-500">Sessão Contínua Ilimitada</p>
          </div>
          <div className="text-right">
            {session && (
              <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl border border-green-200">
                <Clock className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-xs text-green-600 font-semibold">Duração:</p>
                  <p className="text-lg font-bold text-green-700">{formatTime(sessionDurationSeconds)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status da sessão */}
        {!sessionId && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-amber-800 text-sm font-medium mb-3">Nenhuma sessão ativa. Inicie uma nova:</p>
            <button
              onClick={startNewSession}
              disabled={isSessionStarting || isLoading}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-400 text-white font-bold rounded-xl transition-all"
            >
              {isSessionStarting ? 'A iniciar...' : 'Iniciar Nova Sessão'}
            </button>
          </div>
        )}

        {/* Indicador de Status Visual */}
        <div className="mb-6 p-4 bg-slate-100 rounded-xl min-h-[80px] flex items-center justify-center relative">
          {carregando && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-indigo-200 rounded-full animate-ping opacity-75"></div>
            </div>
          )}
          <p className="text-slate-700 font-medium relative z-10 text-center">{status}</p>
        </div>

        {/* Histórico de mensagens */}
        <div className="mb-6 space-y-3 max-h-96 overflow-y-auto bg-slate-50 p-4 rounded-xl">
          {messages.length === 0 ? (
            <p className="text-slate-500 text-center py-8 text-sm">Sem mensagens ainda. Comece a conversar!</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-lg flex items-start gap-3 ${
                  msg.role === 'student'
                    ? 'bg-indigo-100 border border-indigo-200'
                    : 'bg-green-100 border border-green-200'
                }`}
              >
                <div className="flex-1">
                  <p className={`text-xs font-semibold mb-1 ${
                    msg.role === 'student' ? 'text-indigo-700' : 'text-green-700'
                  }`}>
                    {msg.role === 'student' ? 'Você' : 'IA'}
                  </p>
                  <p className="text-sm text-slate-800">{msg.content}</p>
                </div>
                {msg.audioBase64 && msg.role === 'ai' && (
                  <button
                    onClick={() => new Audio(`data:audio/mp3;base64,${msg.audioBase64}`).play()}
                    className="p-2 bg-green-200 hover:bg-green-300 rounded-full text-green-700 transition flex-shrink-0"
                    title="Reproduzir áudio"
                  >
                    <Volume2 size={16} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input de Texto */}
        <input
          type="text"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && enviarFala()}
          placeholder="Escreva a sua mensagem..."
          className="w-full p-3 border border-slate-300 rounded-xl mb-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
          disabled={carregando || !sessionId || isLoading}
        />

        {/* Botões de ação */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={enviarFala}
            disabled={carregando || !sessionId || isLoading}
            className={`py-3 rounded-xl font-bold text-white transition-all ${
              carregando || !sessionId || isLoading
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'
            }`}
          >
            {carregando ? 'A processar...' : 'Enviar'}
          </button>

          <button
            onClick={handleEndSession}
            disabled={!sessionId || isLoading}
            className="py-3 rounded-xl font-bold text-red-600 hover:text-red-700 hover:bg-red-50 transition-all border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            Terminar
          </button>
        </div>

        {/* Informações de sessão */}
        {session && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <p className="text-slate-500 text-xs font-semibold mb-1">MENSAGENS</p>
                <p className="text-2xl font-bold text-slate-800">{session.messageCount}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs font-semibold mb-1">IDIOMA</p>
                <p className="text-xl font-bold text-slate-800 capitalize">{session.language}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs font-semibold mb-1">STATUS</p>
                <p className={`text-lg font-bold ${session.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {session.isActive ? 'Ativa' : 'Encerrada'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
