import React, { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import { StreakData } from '../../types';

interface DailyGoalTrackerProps {
  streakData: StreakData;
}

export const DailyGoalTracker: React.FC<DailyGoalTrackerProps> = ({ streakData }) => {
  const [goal, setGoal] = useState<number>(30); // Default 30 mins

  useEffect(() => {
    const savedGoal = localStorage.getItem('dailyPracticeGoal');
    if (savedGoal) setGoal(parseInt(savedGoal, 10));
  }, []);

  const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newGoal = parseInt(e.target.value, 10);
    setGoal(newGoal);
    localStorage.setItem('dailyPracticeGoal', newGoal.toString());
  };

  // Calculate today's progress
  const todayStr = new Date().toISOString().split('T')[0];
  const sessionsToday = streakData.history.filter(h => h === todayStr).length;
  const minutesToday = sessionsToday * 20;
  
  const progress = Math.min((minutesToday / goal) * 100, 100);

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
      
      <div className="w-full bg-slate-100 rounded-full h-2.5">
        <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};
