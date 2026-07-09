import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface WeeklyComparisonChartProps {
  userMinutes: number;
}

export const WeeklyComparisonChart: React.FC<WeeklyComparisonChartProps> = ({ userMinutes }) => {
  const classAverage = 180; // Mock class average
  const data = [
    { name: 'Você', minutos: userMinutes },
    { name: 'Média Turma', minutos: classAverage },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="font-bold text-lg mb-4">Você vs. Turma</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="minutos" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
