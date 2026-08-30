import React from 'react';
import { Clock } from 'lucide-react';

export interface StudyTimeTrackerProps {
  userId: string;
  totalMinutes?: number;
}

export const StudyTimeTracker: React.FC<StudyTimeTrackerProps> = ({ totalMinutes = 0 }) => {
  if (totalMinutes <= 0) return (
    <div className="text-slate-400 text-xs italic">
      Tempo de estudo ainda não disponível.
      <span className="block text-[10px] text-slate-400">O acompanhamento será apresentado quando as sessões registarem duração real.</span>
    </div>
  );

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return (
    <div className="flex items-center gap-2 text-slate-700 font-bold bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
      <Clock className="w-4 h-4 text-indigo-500" />
      <span aria-label={`Tempo total de estudo: ${hours > 0 ? `${hours} horas ` : ''}${minutes} minutos`}>
        {hours > 0 ? `${hours}h ` : ''}{minutes} min
      </span>
    </div>
  );
};
