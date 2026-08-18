'use client';

import { useState, useEffect } from 'react';
import { Clock, Sparkles, Volume2 } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useLocalization } from '../../context/LocalizationContext';

export default function LiveChatAluno() {
  const { localization } = useLocalization();
  const [mensagem, setMensagem] = useState('');
  const [messages, setMessages] = useState<{ id: string, text: string, audioBase64?: string }[]>([]);
  const [status, setStatus] = useState('Pronto para falar');
  const [carregando, setCarregando] = useState(false);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [isBetaExpired, setIsBetaExpired] = useState(() => {
    return localStorage.getItem("lingolive_beta_expired_chat") === "true";
  });

  // Persist beta expiration
  useEffect(() => {
    localStorage.setItem("lingolive_beta_expired_chat", String(isBetaExpired));
  }, [isBetaExpired]);

  // Timer para o plano/sessão de 2 minutos
  useEffect(() => {
    if (isBetaExpired) return;
    const timer = setInterval(() => {
      setTempoDecorrido((prev) => {
        if (prev + 1 >= 120) {
          setIsBetaExpired(true);
          clearInterval(timer);
          return 120;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isBetaExpired]);

  // Simula o envio da fala do aluno para a API da IA
  const enviarFala = async () => {
    if (!mensagem.trim()) return;

    setCarregando(true);
    setStatus('A IA está a pensar...');

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/ia-live', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          alunoId: '1', // ID simulado (Mariana, 15 anos) - deve vir do contexto do usuário
          mensagemUsuario: mensagem,
          localization: localization,
          preferredVoiceId: localStorage.getItem("lingolive_tts_voice_id") || "21m00Tcm4TlvDq8ikWAM"
        }),
      });

      const dados = await response.json();

      if (response.ok) {
        setStatus(`IA disse: "${dados.respostaAI}"`);
        
        const newMessage = {
          id: Date.now().toString(),
          text: dados.respostaAI,
          audioBase64: dados.audioBase64
        };

        setMessages(prev => [...prev, newMessage]);
        
        // REPRODUÇÃO DE ÁUDIO
        if (dados.audioBase64) {
          const audio = new Audio(`data:audio/mp3;base64,${dados.audioBase64}`);
          audio.play();
        }
      } else {
        setStatus('Erro ao obter resposta.');
      }
    } catch (error) {
      console.error('Erro no pipeline de voz:', error);
      setStatus('Erro de conexão.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Live IA Talk</h1>
        <p className="text-sm text-slate-500 mb-6">Pratique o seu segundo idioma em tempo real</p>
        
        {/* Indicador de Status Visual para o Aluno */}
        <div className="mb-4 p-4 bg-slate-100 rounded-xl min-h-[80px] flex items-center justify-center relative">
          {carregando && (
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-indigo-200 rounded-full animate-ping opacity-75"></div>
            </div>
          )}
          <p className="text-slate-700 font-medium relative z-10">{status}</p>
        </div>

        {/* Historico de mensagens */}
        <div className="mb-8 space-y-2 max-h-60 overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg.id} className="p-3 bg-indigo-50 rounded-lg flex items-center justify-between">
              <p className="text-sm text-slate-800 text-left">{msg.text}</p>
              {msg.audioBase64 && (
                <button
                  onClick={() => new Audio(`data:audio/mp3;base64,${msg.audioBase64}`).play()}
                  className="ml-2 p-2 bg-indigo-100 hover:bg-indigo-200 rounded-full text-indigo-700 transition"
                >
                  <Volume2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Simulação de Input de Texto (Substituído por Microfone no MVP Avançado) */}
        <input 
          type="text" 
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Escreva algo ou fale..." 
          className="w-full p-3 border rounded-xl mb-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={carregando}
        />

        <button
          onClick={enviarFala}
          disabled={carregando}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
            carregando ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'
          }`}
        >
          {carregando ? 'A processar...' : 'Enviar Mensagem / Falar'}
        </button>
      </div>

      {/* Beta Time Limit Reached Modal Overlay */}
      {isBetaExpired && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300" id="beta-expired-overlay-chat">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-slate-100 text-center relative overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Top Glow Bar */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600" />
            
            {/* Clock Icon */}
            <div className="mx-auto w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-6 border border-amber-100 shadow-xs animate-bounce">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>

            {/* Title */}
            <h3 className="text-2xl font-display font-black text-slate-900 mb-4 tracking-tight">
              Programa BETA - Tempo Limite
            </h3>

            {/* Description containing the EXACT required Portuguese text */}
            <p className="text-slate-600 text-base font-semibold leading-relaxed mb-8 px-2" id="beta-expired-message-chat">
              Programa BETA tempo terminado, adquira ja o pacote premium e tenha acesso a todas funcionalidades.
            </p>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                id="btn-adquirir-premium-chat"
              >
                <Sparkles className="w-5 h-5 fill-white animate-pulse" />
                <span>Adquirir Pacote Premium</span>
              </button>

              <button
                onClick={() => {
                    localStorage.removeItem("lingolive_beta_expired_chat");
                    signOut(auth);
                }}
                className="w-full py-3.5 text-red-500 hover:text-red-800 font-bold hover:bg-red-50 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-red-100"
                id="btn-sair-chat"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
