import React from 'react';
import { Sparkles, Trophy, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { UserGamificationState } from '../../types/gamification';
import { useLocalization } from '../../context/LocalizationContext';

interface GamificationWidgetProps {
  data?: UserGamificationState | null;
  isLoading?: boolean;
  isError?: boolean;
}

export const GamificationWidget: React.FC<GamificationWidgetProps> = ({ data, isLoading, isError }) => {
  const { translateMessage } = useLocalization();

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-center h-24 animate-pulse">
        <div data-testid="loading-spinner">
          <Loader2 className="animate-spin text-slate-300" size={24} />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-rose-100 flex items-center gap-3 text-rose-600">
        <AlertTriangle size={24} />
        <span className="text-sm font-semibold">{translateMessage('gamification.error', 'Erro ao carregar gamificação')}</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-center text-slate-500">
        <span className="text-sm font-medium">{translateMessage('gamification.empty', 'Dados de gamificação não disponíveis')}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 grid grid-cols-2 gap-4"
    >
      <div className="flex flex-col items-center gap-1">
        <Sparkles className="text-amber-500" size={24} />
        <span className="text-xs font-bold text-slate-400 uppercase">{translateMessage('gamification.xp', 'XP')}</span>
        <span className="text-lg font-extrabold text-slate-900">{data.xp ?? 0}</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Trophy className="text-indigo-500" size={24} />
        <span className="text-xs font-bold text-slate-400 uppercase">{translateMessage('gamification.level', 'Nível')}</span>
        <span className="text-lg font-extrabold text-slate-900">{data.level ?? 1}</span>
      </div>
    </motion.div>
  );
};
