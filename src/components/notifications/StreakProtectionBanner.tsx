import React, { useState, useEffect } from 'react';
import { Flame, Snowflake, Zap, AlertTriangle, CheckCircle2, X, Bell, ShieldAlert, Sparkles, Coins } from 'lucide-react';
import { StreakData } from '../../types';
import { requestNotificationPermission, showLocalWebNotification, isPushNotificationSupported } from '../../lib/pushNotifications';

interface StreakProtectionBannerProps {
  streakData: StreakData;
  onActivateInstantFreeze: () => void;
  onStartPractice: () => void;
  onDismiss?: () => void;
  compact?: boolean;
}

export const StreakProtectionBanner: React.FC<StreakProtectionBannerProps> = ({
  streakData,
  onActivateInstantFreeze,
  onStartPractice,
  onDismiss,
  compact = false
}) => {
  const [permission, setPermission] = useState<string>('default');
  const [isDismissed, setIsDismissed] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  // Helper to get local YYYY-MM-DD
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const today = getTodayString();
  const hasPracticedToday = streakData.lastDate === today;
  const isStreakAtRisk = streakData.count > 0 && !hasPracticedToday;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    try {
      const res = await requestNotificationPermission();
      setPermission(res);
      if (res === 'granted') {
        showLocalWebNotification(
          '🔔 Notificações Ativadas!',
          `Notificaremos quando a sua sequência de ${streakData.count} dias estiver em risco.`
        );
      }
    } catch (err) {
      console.warn('Could not request notification permission:', err);
    }
  };

  const handleFreezeClick = () => {
    setIsActivating(true);
    try {
      onActivateInstantFreeze();
    } finally {
      setTimeout(() => setIsActivating(false), 600);
    }
  };

  if (!isStreakAtRisk || isDismissed) {
    return null;
  }

  const practicePoints = streakData.practicePoints ?? 100;
  const streakFreezes = streakData.streakFreezes ?? 0;
  const canAffordFreeze = streakFreezes > 0 || practicePoints >= 50;

  if (compact) {
    return (
      <div 
        id="streak-protection-compact-banner"
        className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between gap-3 animate-pulse"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 animate-bounce" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-amber-900 truncate">
              Sequência de {streakData.count} dia{streakData.count > 1 ? 's' : ''} em risco!
            </div>
            <div className="text-[11px] text-amber-700 truncate">
              Ainda não praticou hoje.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleFreezeClick}
            disabled={!canAffordFreeze || isActivating}
            className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
            title="Usar Congelamento para Proteger a Sequência"
          >
            <Snowflake className="w-3.5 h-3.5" />
            <span>{streakFreezes > 0 ? 'Usar Grátis' : 'Congelar (50 pts)'}</span>
          </button>
          <button
            onClick={onStartPractice}
            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Praticar</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="streak-protection-warning-banner"
      className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-5 md:p-6 text-white shadow-xl shadow-amber-600/15 border border-amber-400/30 mb-6 transition-all duration-300 animate-fadeIn"
    >
      {/* Background Decorative Element */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        
        {/* Left Side: Danger Info */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-200 shadow-inner">
              <Flame className="w-7 h-7 md:w-8 md:h-8 text-amber-300 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-orange-600 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-red-500/80 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-red-400/30 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Atenção
              </span>
              <span className="text-amber-100 text-xs font-semibold">
                Expira às 23:59 de hoje
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-extrabold text-white tracking-tight">
              A sua Sequência de <span className="text-amber-200 underline decoration-amber-300 decoration-wavy">{streakData.count} dia{streakData.count > 1 ? 's' : ''}</span> está em Risco!
            </h3>
            <p className="text-xs md:text-sm text-amber-100/90 leading-relaxed max-w-xl">
              Ainda não completou a sua prática diária hoje. Evite a perda da sua ofensiva ativando um <strong className="text-white">Congelamento de Ofensiva</strong> com os seus Pontos de Prática ou praticando agora mesmo.
            </p>
          </div>
        </div>

        {/* Right Side: Status Badges & Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
          
          {/* Inventory / Points Indicator Pill */}
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center justify-around sm:justify-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5" title="Seus Pontos de Prática atuais">
              <Coins className="w-4 h-4 text-amber-300" />
              <span><strong className="text-white font-bold">{practicePoints}</strong> pts</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-1.5" title="Escudos de Congelamento guardados no inventário">
              <Snowflake className="w-4 h-4 text-cyan-300" />
              <span><strong className="text-white font-bold">{streakFreezes}</strong> escudos</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Instant Freeze Trigger */}
            <button
              onClick={handleFreezeClick}
              disabled={!canAffordFreeze || isActivating}
              className={`flex-1 sm:flex-none px-4 py-3 rounded-2xl font-bold text-xs md:text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                canAffordFreeze
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-white border border-cyan-300/40 shadow-cyan-900/20 active:scale-95'
                  : 'bg-slate-800/60 text-slate-300 border border-slate-700/50 cursor-not-allowed opacity-75'
              }`}
              id="btn-instant-streak-freeze"
            >
              <Snowflake className={`w-4 h-4 ${isActivating ? 'animate-spin' : ''}`} />
              <span>
                {streakFreezes > 0 
                  ? 'Usar Escudo Guardado' 
                  : canAffordFreeze 
                  ? 'Ativar Congelamento (50 pts)' 
                  : 'Pontos Insuficientes (Necessário 50)'}
              </span>
            </button>

            {/* Quick Practice Button */}
            <button
              onClick={onStartPractice}
              className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-white hover:bg-amber-50 text-slate-900 font-bold text-xs md:text-sm shadow-lg shadow-black/10 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              id="btn-streak-risk-practice"
            >
              <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
              <span>Praticar Agora</span>
            </button>

            {/* Browser Permission Request (if default) */}
            {permission === 'default' && isPushNotificationSupported() && (
              <button
                onClick={handleRequestPermission}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition cursor-pointer shrink-0"
                title="Ativar Notificações do Navegador para alertas de sequência"
              >
                <Bell className="w-4 h-4 text-amber-200 animate-bounce" />
              </button>
            )}

            {/* Dismiss Button */}
            {onDismiss && (
              <button
                onClick={() => {
                  setIsDismissed(true);
                  onDismiss();
                }}
                className="p-3 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-2xl transition cursor-pointer shrink-0"
                title="Fechar Aviso"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
