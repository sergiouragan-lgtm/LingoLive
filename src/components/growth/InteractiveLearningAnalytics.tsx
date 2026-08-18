import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, Area, 
  BarChart, Bar, 
  LineChart, Line, 
  XAxis, YAxis, 
  CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend 
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Award, 
  Clock, 
  CheckCircle2, 
  HelpCircle,
  Sliders,
  Sparkles
} from 'lucide-react';
import { StreakData } from '../../types';

interface InteractiveLearningAnalyticsProps {
  streakData: StreakData;
}

export const InteractiveLearningAnalytics: React.FC<InteractiveLearningAnalyticsProps> = ({ streakData }) => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [chartStyle, setChartStyle] = useState<'area' | 'bar' | 'line'>('area');

  // Load the user's daily goal from localStorage, defaulting to 30 mins
  const dailyGoal = useMemo(() => {
    try {
      return parseInt(localStorage.getItem('dailyPracticeGoal') || '30', 10);
    } catch (e) {
      return 30;
    }
  }, []);

  // Compute Daily data (last 7 days)
  const dailyData = useMemo(() => {
    const today = new Date();
    const result = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      // Calculate minutes practiced on this specific date
      const sessionsCount = streakData.history.filter(h => h === dateStr).length;
      const minutesPracticed = sessionsCount * 20;

      result.push({
        name: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
        fullDate: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        minutos: minutesPracticed,
        meta: dailyGoal,
        completado: minutesPracticed >= dailyGoal
      });
    }
    return result;
  }, [streakData.history, dailyGoal]);

  // Compute Weekly data (last 4 weeks)
  const weeklyData = useMemo(() => {
    const today = new Date();
    const result = [];

    const getMinutesInRange = (startDays: number, endDays: number) => {
      let count = 0;
      for (let i = startDays; i >= endDays; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        count += streakData.history.filter(h => h === dateStr).length;
      }
      return count * 20;
    };

    // Week 1 (Current Week)
    result.push({
      name: 'Semana Atual',
      minutos: getMinutesInRange(6, 0),
      metaSemanal: dailyGoal * 7,
    });

    // Week 2 (Last Week)
    result.push({
      name: '1 Semana Atrás',
      minutos: getMinutesInRange(13, 7),
      metaSemanal: dailyGoal * 7,
    });

    // Week 3 (2 Weeks Ago)
    result.push({
      name: '2 Semanas Atrás',
      minutos: getMinutesInRange(20, 14),
      metaSemanal: dailyGoal * 7,
    });

    // Week 4 (3 Weeks Ago)
    result.push({
      name: '3 Semanas Atrás',
      minutos: getMinutesInRange(27, 21),
      metaSemanal: dailyGoal * 7,
    });

    return result.reverse(); // Chronological order
  }, [streakData.history, dailyGoal]);

  // Derived overall statistics for headers
  const stats = useMemo(() => {
    const totalMinutesThisWeek = dailyData.reduce((acc, curr) => acc + curr.minutos, 0);
    const averageMinutes = Math.round(totalMinutesThisWeek / 7);
    const daysGoalMet = dailyData.filter(d => d.completado).length;
    const goalMetRate = Math.round((daysGoalMet / 7) * 100);

    return {
      totalThisWeek: totalMinutesThisWeek,
      dailyAverage: averageMinutes,
      daysGoalMet,
      goalMetRate
    };
  }, [dailyData]);

  // Custom tooltips to make the charts feel native and high-quality
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const practiced = payload[0].value;
      const target = payload[1]?.value || dailyGoal;

      return (
        <div className="bg-slate-900 border border-slate-800 text-slate-100 p-3 rounded-xl shadow-xl space-y-1 max-w-[200px]">
          <p className="text-xs font-bold text-slate-400 font-mono tracking-wider">
            {dataPoint.fullDate ? `${label} (${dataPoint.fullDate})` : label}
          </p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" /> Praticado:
            </span>
            <span className="text-sm font-black text-indigo-300 font-mono">{practiced} min</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" /> Meta:
            </span>
            <span className="text-sm font-semibold text-amber-400/90 font-mono">{target} min</span>
          </div>
          <div className="pt-1.5 border-t border-slate-800/80 mt-1 flex items-center justify-center">
            {practiced >= target ? (
              <span className="text-[10px] text-emerald-400 font-black flex items-center gap-1 uppercase tracking-wide">
                Meta Batida! 🎉
              </span>
            ) : (
              <span className="text-[10px] text-indigo-400 font-bold flex items-center gap-1 uppercase tracking-wide animate-pulse">
                Quase lá! 💪
              </span>
            )}
          </div>
        </div>
      );
    };
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-6" id="interactive-learning-analytics">
      {/* Title & Interactive Mode Switchers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-xl text-slate-900 flex items-center gap-2 tracking-tight">
            <BarChart3 className="w-5.5 h-5.5 text-indigo-600 animate-pulse" />
            Análise Gráfica de Aprendizado
          </h2>
          <p className="text-slate-500 text-xs font-medium">
            Monitore seu progresso diário e semanal de forma dinâmica.
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl self-start sm:self-auto border border-slate-200/50">
          <button
            onClick={() => setViewMode('daily')}
            className={`py-1.5 px-4 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
              viewMode === 'daily'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Visão Diária
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`py-1.5 px-4 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
              viewMode === 'weekly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Visão Semanal
          </button>
        </div>
      </div>

      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-tr from-indigo-50/40 to-white p-4 rounded-2xl border border-indigo-100/20 flex items-center gap-3.5">
          <div className="bg-indigo-100/80 p-2.5 rounded-xl text-indigo-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-black tracking-wider">Total esta semana</div>
            <div className="text-xl font-extrabold text-indigo-950 tracking-tight font-mono">
              {stats.totalThisWeek} min
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-tr from-sky-50/40 to-white p-4 rounded-2xl border border-sky-100/20 flex items-center gap-3.5">
          <div className="bg-sky-100/80 p-2.5 rounded-xl text-sky-600 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-black tracking-wider">Média diária</div>
            <div className="text-xl font-extrabold text-sky-950 tracking-tight font-mono">
              {stats.dailyAverage} min/dia
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-tr from-emerald-50/40 to-white p-4 rounded-2xl border border-emerald-100/20 flex items-center gap-3.5">
          <div className="bg-emerald-100/80 p-2.5 rounded-xl text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-black tracking-wider">Metas Concluídas</div>
            <div className="text-xl font-extrabold text-emerald-950 tracking-tight font-mono flex items-baseline gap-1.5">
              {stats.daysGoalMet} dias <span className="text-xs text-emerald-600 font-bold">({stats.goalMetRate}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Container with Interactive Controls */}
      <div className="relative border border-slate-100 rounded-3xl p-4 bg-slate-50/30">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" style={{ animationDuration: '6s' }} />
            {viewMode === 'daily' ? 'Últimos 7 dias de atividades' : 'Progresso das últimas 4 semanas'}
          </span>

          {/* Chart Style Selector (Area vs Bar vs Line) */}
          <div className="flex items-center gap-1 bg-white border border-slate-100 p-0.5 rounded-xl shadow-2xs">
            <button
              onClick={() => setChartStyle('area')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                chartStyle === 'area' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Gráfico de Área Sombreada"
            >
              Área
            </button>
            <button
              onClick={() => setChartStyle('bar')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                chartStyle === 'bar' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Gráfico de Barras"
            >
              Barras
            </button>
            <button
              onClick={() => setChartStyle('line')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                chartStyle === 'line' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Gráfico de Linha simples"
            >
              Linhas
            </button>
          </div>
        </div>

        {/* Dynamic Chart Rendering using Recharts */}
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'daily' ? (
              chartStyle === 'area' ? (
                <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMinutos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01}/>
                    </linearGradient>
                    <linearGradient id="colorMeta" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11, fontWeight: 'bold', color: '#475569' }} />
                  <Area type="monotone" dataKey="minutos" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMinutos)" name="Minutos Praticados" />
                  <Area type="monotone" dataKey="meta" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorMeta)" name="Meta Diária" />
                </AreaChart>
              ) : chartStyle === 'bar' ? (
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }} />
                  <Bar dataKey="minutos" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Minutos Praticados" />
                  <Bar dataKey="meta" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Meta Diária" opacity={0.6} />
                </BarChart>
              ) : (
                <LineChart data={dailyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }} />
                  <Line type="monotone" dataKey="minutos" stroke="#4f46e5" strokeWidth={3} activeDot={{ r: 6 }} name="Minutos Praticados" />
                  <Line type="monotone" dataKey="meta" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 5" name="Meta Diária" />
                </LineChart>
              )
            ) : (
              // Weekly View
              chartStyle === 'area' ? (
                <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWeeklyMinutos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.01}/>
                    </linearGradient>
                    <linearGradient id="colorWeeklyMeta" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#64748b" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#64748b" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="minutos" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorWeeklyMinutos)" name="Minutos Praticados" />
                  <Area type="monotone" dataKey="metaSemanal" stroke="#64748b" strokeWidth={1.5} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorWeeklyMeta)" name="Meta Semanal" />
                </AreaChart>
              ) : chartStyle === 'bar' ? (
                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }} />
                  <Bar dataKey="minutos" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Minutos Praticados" />
                  <Bar dataKey="metaSemanal" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Meta Semanal" opacity={0.6} />
                </BarChart>
              ) : (
                <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }} />
                  <Line type="monotone" dataKey="minutos" stroke="#8b5cf6" strokeWidth={3} activeDot={{ r: 6 }} name="Minutos Praticados" />
                  <Line type="monotone" dataKey="metaSemanal" stroke="#64748b" strokeWidth={1.5} strokeDasharray="5 5" name="Meta Semanal" />
                </LineChart>
              )
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
