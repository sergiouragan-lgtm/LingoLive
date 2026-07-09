import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { StreakData } from '../../types';

interface WeeklyPerformanceChartProps {
  streakData: StreakData;
}

export const WeeklyPerformanceChart: React.FC<WeeklyPerformanceChartProps> = ({ streakData }) => {
  // Get last 7 days for the chart
  const data = [];
  const today = new Date();
  
  const getSessionsInRange = (startDays: number, endDays: number) => {
    let count = 0;
    for (let i = startDays; i >= endDays; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        count += streakData.history.filter(h => h === dateStr).length;
    }
    return count;
  };

  const thisWeek = getSessionsInRange(6, 0);
  const lastWeek = getSessionsInRange(13, 7);
  const diff = thisWeek - lastWeek;

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    // Check if practiced on this day
    const count = streakData.history.filter(h => h === dateStr).length;
    
    data.push({
      name: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
      sessions: count
    });
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg">Desempenho Semanal</h2>
        <div className={`flex items-center gap-1 text-sm font-semibold ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
            {diff > 0 ? <ArrowUp size={16} /> : diff < 0 ? <ArrowDown size={16} /> : <Minus size={16} />}
            {Math.abs(diff)} sessões {diff > 0 ? 'mais' : diff < 0 ? 'menos' : 'igual'} que semana passada
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="sessions" stroke="#4f46e5" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
