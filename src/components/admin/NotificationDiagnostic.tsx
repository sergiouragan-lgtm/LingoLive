import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Send, 
  Trash2, 
  Trophy, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Sparkles, 
  Activity,
  Layers,
  Play,
  Terminal,
  Clock
} from 'lucide-react';
import { notificationService } from '../../services/notification.service';
import { getAuth } from 'firebase/auth';

interface LocalNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  timestamp: string;
}

export function NotificationDiagnostic() {
  const [customTitle, setCustomTitle] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [customType, setCustomType] = useState('info');
  const [liveEvents, setLiveEvents] = useState<LocalNotification[]>([]);
  const [storedNotifications, setStoredNotifications] = useState<LocalNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'trigger' | 'history'>('trigger');

  const auth = getAuth();
  const userId = auth.currentUser?.uid || 'anonymous';

  // Load notifications from localStorage
  const loadStoredNotifications = () => {
    const key = `lingolive_notifications_${userId}`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setStoredNotifications(JSON.parse(stored));
      } else {
        setStoredNotifications([]);
      }
    } catch (e) {
      console.error('Error loading stored notifications:', e);
    }
  };

  useEffect(() => {
    loadStoredNotifications();

    // Listen to live notification events
    const handleNewNotification = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const newNotif = customEvent.detail as LocalNotification;
        setLiveEvents((prev) => [newNotif, ...prev].slice(0, 10));
        
        // Reload stored list
        setTimeout(() => {
          loadStoredNotifications();
        }, 100);
      }
    };

    window.addEventListener('lingolive_new_notification', handleNewNotification);
    return () => {
      window.removeEventListener('lingolive_new_notification', handleNewNotification);
    };
  }, [userId]);

  // Handle firing a predefined scenario
  const handleTriggerPredefined = (title: string, message: string, type: string) => {
    notificationService.notifyUser(userId, { title, message, type });
  };

  // Handle firing a custom composed notification
  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMessage.trim()) return;

    const titleToUse = customTitle.trim() || 'Notificação de Teste';
    notificationService.notifyUser(userId, {
      title: titleToUse,
      message: customMessage.trim(),
      type: customType
    });

    setCustomTitle('');
    setCustomMessage('');
  };

  // Clear simulated diagnostic lists
  const handleClearHistory = () => {
    const key = `lingolive_notifications_${userId}`;
    try {
      localStorage.removeItem(key);
      setStoredNotifications([]);
      setLiveEvents([]);
    } catch (e) {
      console.error('Error clearing notifications:', e);
    }
  };

  const predefinedScenarios = [
    {
      title: '🏆 Nova Conquista!',
      message: 'Completou a sua primeira conversa por voz de 5 minutos com o AI Tutor!',
      type: 'achievement',
      bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800',
      icon: <Trophy className="w-5 h-5 text-amber-600" />,
      label: 'Conquista'
    },
    {
      title: '🟢 Sincronização Concluída',
      message: 'A exportação das turmas e alunos foi finalizada com segurança no banco principal.',
      type: 'success',
      bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      label: 'Sucesso'
    },
    {
      title: '🔴 Erro de Ligação',
      message: 'Latência na API Gemini excedeu 3000ms. O sistema entrou em modo de contingência local.',
      type: 'error',
      bg: 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-800',
      icon: <AlertCircle className="w-5 h-5 text-rose-600" />,
      label: 'Erro Crítico'
    },
    {
      title: '🔵 Atualização do Sistema',
      message: 'As salas de conversação do LingoLIVE passarão por uma breve manutenção programada às 02:00 UTC.',
      type: 'info',
      bg: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-800',
      icon: <Info className="w-5 h-5 text-indigo-600" />,
      label: 'Informação'
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs max-w-4xl mx-auto my-6" id="notification-diagnostic-panel">
      {/* Header section with pulsating badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl relative">
            <Bell className="w-6 h-6 animate-pulse" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-ping" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Painel de Diagnóstico de Notificações</h2>
            <p className="text-xs text-slate-500 mt-1">
              Valide e depure o fluxo de eventos, persistência local e renderização de Toasts em tempo real.
            </p>
          </div>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('trigger')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'trigger' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Disparar Alertas
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Histórico ({storedNotifications.length})
          </button>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'trigger' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Column 1: Predefined Scenarios */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-800 text-sm">Cenários Predefinidos</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                Clique em qualquer cenário abaixo para disparar instantaneamente uma simulação através do barramento de eventos globais.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {predefinedScenarios.map((sc, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTriggerPredefined(sc.title, sc.message, sc.type)}
                    className={`flex flex-col text-left p-4 rounded-2xl border ${sc.bg} transition-all cursor-pointer shadow-2xs`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="p-1.5 bg-white/80 rounded-xl shadow-3xs">
                        {sc.icon}
                      </div>
                      <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase px-2 py-0.5 bg-white/60 rounded-full">
                        {sc.label}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold leading-tight line-clamp-1">{sc.title}</h4>
                    <p className="text-[11px] mt-1 opacity-90 leading-snug line-clamp-2">{sc.message}</p>
                  </motion.button>
                ))}
              </div>

              {/* Live Events Stream log (terminal style) */}
              <div className="bg-slate-950 rounded-2xl p-4 font-mono text-xs text-emerald-400 mt-6 shadow-inner border border-slate-800">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                    <span>REGISTO DE EVENTOS EM TEMPO REAL</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {liveEvents.length === 0 ? (
                    <p className="text-slate-500 italic text-[11px]">A aguardar disparos de notificações no barramento...</p>
                  ) : (
                    liveEvents.map((e) => (
                      <div key={e.id} className="text-[11px] leading-relaxed border-l-2 border-emerald-500 pl-2">
                        <span className="text-slate-500 font-semibold">[{new Date(e.timestamp).toLocaleTimeString()}]</span>{' '}
                        <span className="text-amber-300">[{e.type.toUpperCase()}]</span>{' '}
                        <span className="text-slate-200 font-bold">{e.title}:</span>{' '}
                        <span className="text-slate-300">{e.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Column 2: Custom Notification Composer Form */}
            <div className="lg:col-span-5 bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-3xs">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-indigo-500" />
                <h3 className="font-bold text-slate-800 text-sm">Compor Alerta Personalizado</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Personalize os textos e tipologias para testar quebras de layout, limites de caracteres ou tradução regional.
              </p>

              <form onSubmit={handleSendCustom} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Título do Alerta</label>
                  <input
                    type="text"
                    placeholder="ex: Vocabulário Diário Disponível"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800 shadow-3xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Conteúdo da Mensagem</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Componha os detalhes da mensagem a enviar ao utilizador..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800 shadow-3xs resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Tipo de Notificação</label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 shadow-3xs"
                  >
                    <option value="info">🔵 Informação (Info)</option>
                    <option value="success">🟢 Sucesso (Success)</option>
                    <option value="error">🔴 Erro Crítico (Error)</option>
                    <option value="achievement">🏆 Conquista (Achievement)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!customMessage.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar para o Event Bus</span>
                </button>
              </form>
            </div>

          </div>
        ) : (
          /* History Tab: Local Storage notifications state */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Notificações em Local Storage</h3>
                <p className="text-xs text-slate-500 mt-1">Este histórico reflete as últimas 50 notificações mantidas localmente para o utilizador.</p>
              </div>
              
              {storedNotifications.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-rose-100 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpar Diagnósticos</span>
                </button>
              )}
            </div>

            {storedNotifications.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2 animate-bounce" />
                <p className="text-xs text-slate-500 font-semibold">Nenhuma notificação armazenada no histórico.</p>
                <p className="text-[11px] text-slate-400 mt-1">Dispare alertas na aba "Disparar Alertas" para povoar a cache.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {storedNotifications.map((n) => {
                  let style = { bg: 'bg-indigo-50/50 border-indigo-100', icon: <Info className="w-4 h-4 text-indigo-600" /> };
                  if (n.type === 'achievement') {
                    style = { bg: 'bg-amber-50/50 border-amber-100', icon: <Trophy className="w-4 h-4 text-amber-600" /> };
                  } else if (n.type === 'success') {
                    style = { bg: 'bg-emerald-50/50 border-emerald-100', icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" /> };
                  } else if (n.type === 'error') {
                    style = { bg: 'bg-rose-50/50 border-rose-100', icon: <AlertCircle className="w-4 h-4 text-rose-600" /> };
                  }

                  return (
                    <div
                      key={n.id}
                      className={`p-3.5 rounded-2xl border ${style.bg} flex items-start gap-3 transition-all`}
                    >
                      <div className="p-1.5 bg-white rounded-lg shadow-3xs shrink-0">
                        {style.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{n.title}</h4>
                          <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" />
                            {new Date(n.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">{n.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
