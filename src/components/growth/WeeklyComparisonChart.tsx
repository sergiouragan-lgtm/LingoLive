import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { collection, onSnapshot, query, where, limit } from 'firebase/firestore';
import { db, auth } from '../../firebase';

interface WeeklyComparisonChartProps {
  userMinutes: number;
  classId?: string;
  organizationId?: string;
  userId?: string;
}

// Helper to calculate current canonical ISO week key (e.g., "2026-W30")
function getCanonicalWeekKey(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

export const WeeklyComparisonChart: React.FC<WeeklyComparisonChartProps> = ({ 
  userMinutes, 
  classId: propClassId,
  organizationId: propOrgId,
  userId: propUserId 
}) => {
  const [classAverage, setClassAverage] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const uid = propUserId || auth.currentUser?.uid;

  useEffect(() => {
    if (!uid || !propOrgId || !propClassId) {
      setLoading(false);
      setClassAverage(null);
      return;
    }

    const currentWeekKey = getCanonicalWeekKey();

    // Query learningStatistics strictly within tenant, class and current week
    const statsQuery = query(
      collection(db, 'learningStatistics'), 
      where('organizationId', '==', propOrgId),
      where('classId', '==', propClassId),
      where('weekKey', '==', currentWeekKey),
      limit(50)
    );

    const unsubscribe = onSnapshot(statsQuery, (snapshot) => {
      if (!snapshot.empty && snapshot.size >= 2) {
        let totalMins = 0;
        let count = 0;
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && typeof data.totalMinutes === 'number' && data.totalMinutes >= 0) {
            totalMins += data.totalMinutes;
            count += 1;
          }
        });
        const calculatedAvg = count > 0 ? Math.round(totalMins / count) : userMinutes;
        setClassAverage(calculatedAvg);
      } else {
        // Less than 2 students in class statistics: insufficient data
        setClassAverage(null);
      }
      setLoading(false);
    }, (error) => {
      console.warn('[WeeklyComparisonChart] Realtime stats snapshot notice:', error);
      setClassAverage(null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid, userMinutes, propClassId, propOrgId]);

  const hasData = classAverage !== null;
  const data = [
    { name: 'Você', minutos: userMinutes },
    { name: 'Média Turma', minutos: classAverage || 0 },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg text-slate-800">Você vs. Turma</h2>
        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
          Estatísticas da Semana 📊
        </span>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
          A carregar estatísticas reais da turma...
        </div>
      ) : !hasData ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 bg-slate-50/50 rounded-xl p-4 border border-dashed border-slate-200">
          <p className="text-xs font-semibold">Ainda não existem dados suficientes da turma.</p>
          <p className="text-[10px] text-slate-400 mt-1">Conforme mais colegas pratiquem, a média semanal será exibida aqui.</p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                formatter={(value: number) => [`${value} minutos`, 'Tempo de Prática']}
              />
              <Bar dataKey="minutos" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
