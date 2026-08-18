import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { StreakData } from '../../types';

interface UserGrowthChartProps {
  streakData: StreakData;
}

export const UserGrowthChart: React.FC<UserGrowthChartProps> = ({ streakData }) => {
  // Generate data for the last 30 days
  const data = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    // Count sessions for this date
    const sessions = streakData.history.filter(h => h === dateStr).length;
    data.push({
      date: dateStr.split('-')[2], // Just show day
      activity: sessions * 20, // Assume 20 mins per session
    });
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h3 className="font-bold text-base text-slate-800 mb-4">Crescimento de Prática (30 dias)</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip />
            <Line type="monotone" dataKey="activity" stroke="#4f46e5" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
