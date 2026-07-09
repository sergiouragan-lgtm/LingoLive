import React from 'react';
import { Clock } from 'lucide-react';
import { StreakData } from '../../types';

interface TotalMinutesCardProps {
  streakData: StreakData;
}

export const TotalMinutesCard: React.FC<TotalMinutesCardProps> = ({ streakData }) => {
  // Calculate total sessions in last 7 days
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  
  const recentSessions = streakData.history.filter(dateStr => {
    const d = new Date(dateStr);
    return d >= sevenDaysAgo && d <= today;
  });

  // Assuming 20 minutes per session
  const totalMinutes = recentSessions.length * 20;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
      <div className="bg-indigo-100 p-3 rounded-xl">
        <Clock className="text-indigo-600" size={24} />
      </div>
      <div>
        <div className="text-slate-500 text-sm">Tempo Praticado (Semana)</div>
        <div className="text-2xl font-bold text-indigo-900">{totalMinutes} min</div>
      </div>
    </div>
  );
};
