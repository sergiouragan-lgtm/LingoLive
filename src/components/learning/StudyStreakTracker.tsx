import React, { useState, useEffect, useMemo } from 'react';
import { Flame } from 'lucide-react';

type StudyStreakTrackerProps = {
  history?: string[];
  isLoading?: boolean;
  isError?: boolean;
  timezone?: string | null;
};

export const StudyStreakTracker: React.FC<StudyStreakTrackerProps> = ({ 
  history = [], 
  isLoading = false, 
  isError = false 
}) => {
  const streak = useMemo(() => {
    if (!history || history.length === 0) return 0;
    
    // 1. Normalize and Deduplicate (YYYY-MM-DD)
    const uniqueDays = Array.from(new Set(history.map(d => {
      const date = new Date(d);
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    }))).filter(Boolean) as string[];

    if (uniqueDays.length === 0) return 0;

    // 2. Sort descending
    uniqueDays.sort().reverse();

    // 3. Calculate streak (ends today or yesterday)
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const lastActivity = uniqueDays[0];
    if (lastActivity !== today && lastActivity !== yesterdayStr) return 0;

    let currentStreak = 0;
    let checkDate = new Date(lastActivity);
    
    for (const day of uniqueDays) {
        const dayDate = new Date(day);
        const diffDays = Math.round((checkDate.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    return currentStreak;
  }, [history]);

  if (isLoading) {
    return <div className="animate-pulse bg-orange-50 h-12 rounded-xl" aria-hidden="true" />;
  }
  
  if (isError) {
    return <div className="text-rose-500 text-xs italic" role="alert">Erro na sequência</div>;
  }

  if (streak === 0) {
    return <div className="text-slate-400 text-xs italic">Sem sequência</div>;
  }

  return (
    <div className="flex items-center gap-2">
      <Flame size={20} className="fill-orange-500 text-orange-500" />
      <span className="text-base font-extrabold text-slate-800">
        {streak} {streak === 1 ? 'dia' : 'dias'}
      </span>
    </div>
  );
};
