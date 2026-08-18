import React, { useState, useEffect } from 'react';
import { Target, Loader2, AlertCircle } from 'lucide-react';
import { StreakData } from '../../types';
import { auth } from '../../firebase';

interface DailyGoalTrackerProps {
  streakData?: StreakData;
  isLoading?: boolean;
  isError?: boolean;
}

export const DailyGoalTracker: React.FC<DailyGoalTrackerProps> = ({ streakData, isLoading, isError }) => {
  const [goal, setGoal] = useState<number>(30); // Default 30 mins
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;
    const savedGoal = localStorage.getItem(`dailyPracticeGoal_${userId}`);
    if (savedGoal) {
      const parsed = parseInt(savedGoal, 10);
      if (!isNaN(parsed) && parsed > 0) setGoal(parsed);
    }
  }, [userId]);

  const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId) return;
    const newGoal = parseInt(e.target.value, 10);
    if (!isNaN(newGoal) && newGoal > 0) {
      setGoal(newGoal);
      localStorage.setItem(`dailyPracticeGoal_${userId}`, newGoal.toString());
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded mb-4" />
        <div className="h-2 w-full bg-slate-200 rounded-full" />
      </div>
    );
  }

  if (isError || !streakData) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 flex items-center gap-3 text-red-600">
        <AlertCircle size={20} />
        <span className="text-sm font-medium">Erro ao carregar dados.</span>
      </div>
    );
  }

  // Calculate today's progress
  const todayStr = new Date().toISOString().split('T')[0];
  const sessionsToday = streakData.history.filter(h => h === todayStr).length;
  const minutesToday = sessionsToday * 20;
  
  const progressPercent = goal > 0 ? Math.min((minutesToday / goal) * 100, 100) : 0;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg flex items-center gap-2">
            <Target className="text-indigo-600" size={20} />
            Meta Diária
        </h2>
        <input 
            type="number" 
            value={goal} 
            onChange={handleGoalChange}
            className="w-16 p-1 border border-slate-200 rounded text-center text-sm font-semibold"
        />
      </div>
      
      <div className="flex items-center justify-between mb-2 text-sm text-slate-500">
        <span>{minutesToday} min</span>
        <span>{goal} min</span>
      </div>
      
      <div className="w-full bg-slate-100 rounded-full h-2.5" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
        <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
      </div>
    </div>
  );
};
