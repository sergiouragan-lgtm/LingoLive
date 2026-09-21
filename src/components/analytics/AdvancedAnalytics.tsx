import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';
import { Download, Calendar, TrendingUp, Users, BookOpen, Zap, Settings } from 'lucide-react';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { auth } from '@/firebase';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useMonitoring } from '@/hooks/useMonitoring';

interface AnalyticsData {
  id: string;
  metric: string;
  value: number;
  trend: number;
  period: string;
}

interface CohortPerformance {
  cohortId: string;
  cohortName: string;
  studentCount: number;
  averageProgress: number;
  averageAttendance: number;
  averageXp: number;
  skillDistribution: {
    listening: number;
    speaking: number;
    reading: number;
    writing: number;
  };
}

interface EngagementMetrics {
  date: string;
  activeUsers: number;
  completedLessons: number;
  averageSessionTime: number;
  xpDistributed: number;
}

interface TrendAnalysis {
  metric: string;
  week1: number;
  week2: number;
  week3: number;
  week4: number;
  trend: 'up' | 'down' | 'stable';
}

interface AdvancedAnalyticsProps {
  schoolId?: string;
  classId?: string;
  timeRange: '7d' | '30d' | '90d' | '1y';
}

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  schoolId,
  classId,
  timeRange = '30d',
}) => {
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();
  const [selectedMetric, setSelectedMetric] = useState<string>('progress');
  const [selectedCohort, setSelectedCohort] = useState<string>('');

  const { data: analyticsData } = useRealtimeSync<AnalyticsData[]>(
    schoolId ? `analytics/schools/${schoolId}?range=${timeRange}` : `analytics/global?range=${timeRange}`,
    (data) => data || []
  );

  const { data: cohortMetrics } = useRealtimeSync<CohortPerformance[]>(
    schoolId ? `analytics/cohorts/${schoolId}` : `analytics/cohorts/global`,
    (data) => data || []
  );

  const { data: engagementData } = useRealtimeSync<EngagementMetrics[]>(
    schoolId ? `analytics/engagement/${schoolId}?range=${timeRange}` : `analytics/engagement/global?range=${timeRange}`,
    (data) => data || []
  );

  const { data: trendData } = useRealtimeSync<TrendAnalysis[]>(
    schoolId ? `analytics/trends/${schoolId}` : `analytics/trends/global`,
    (data) => data || []
  );

  useEffect(() => {
    if (userId) {
      trackEvent('advanced_analytics_viewed', {
        schoolId: schoolId || 'global',
        timeRange,
        hasClassFilter: !!classId
      });
    }
  }, [userId, trackEvent, schoolId, classId, timeRange]);

  const selectedCohortData = useMemo(
    () => cohortMetrics?.find((c) => c.cohortId === selectedCohort) || cohortMetrics?.[0],
    [cohortMetrics, selectedCohort]
  );

  const skillDistributionData = useMemo(() => {
    if (!selectedCohortData) return [];
    return [
      { name: 'Listening', value: selectedCohortData.skillDistribution.listening },
      { name: 'Speaking', value: selectedCohortData.skillDistribution.speaking },
      { name: 'Reading', value: selectedCohortData.skillDistribution.reading },
      { name: 'Writing', value: selectedCohortData.skillDistribution.writing },
    ];
  }, [selectedCohortData]);

  const trendChartData = useMemo(() => {
    return trendData?.map((trend) => ({
      name: trend.metric.substring(0, 10),
      week1: trend.week1,
      week2: trend.week2,
      week3: trend.week3,
      week4: trend.week4,
    })) || [];
  }, [trendData]);

  const handleCohortChange = (cohortId: string) => {
    setSelectedCohort(cohortId);
    if (userId) {
      trackEvent('analytics_cohort_selected', {
        cohortId: cohortId || 'all',
        schoolId: schoolId || 'global'
      });
    }
  };

  const handleExportReport = async (format: 'pdf' | 'csv' | 'excel') => {
    if (userId) {
      trackEvent('analytics_export_initiated', {
        format,
        timeRange,
        schoolId: schoolId || 'global'
      });
    }

    try {
      const token = await (window as any).auth?.currentUser?.getIdToken?.();
      const url = schoolId
        ? `/api/analytics/schools/${schoolId}/export?format=${format}&range=${timeRange}`
        : `/api/analytics/export?format=${format}&range=${timeRange}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `analytics-report-${Date.now()}.${format === 'pdf' ? 'pdf' : format === 'csv' ? 'csv' : 'xlsx'}`;
      link.click();

      if (userId) {
        trackEvent('analytics_export_completed', {
          format,
          timeRange,
          schoolId: schoolId || 'global'
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      if (userId) {
        trackEvent('analytics_export_failed', {
          format,
          timeRange,
          schoolId: schoolId || 'global',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Análises Avançadas
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Insights detalhados e relatórios de desempenho
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExportReport('pdf')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={() => handleExportReport('csv')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={() => handleExportReport('excel')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            {
              icon: Users,
              label: 'Usuários Ativos',
              value: engagementData?.[engagementData.length - 1]?.activeUsers || 0,
            },
            {
              icon: BookOpen,
              label: 'Aulas Concluídas',
              value: engagementData?.reduce((sum, d) => sum + d.completedLessons, 0) || 0,
            },
            {
              icon: TrendingUp,
              label: 'XP Distribuído',
              value: `${(engagementData?.reduce((sum, d) => sum + d.xpDistributed, 0) || 0).toLocaleString()}`,
            },
            {
              icon: Zap,
              label: 'Tempo Médio',
              value: `${Math.round(engagementData?.reduce((sum, d) => sum + d.averageSessionTime, 0) / (engagementData?.length || 1)) || 0}min`,
            },
          ].map(({ icon: Icon, label, value }, idx) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {value}
                  </p>
                </div>
                <Icon className="w-8 h-8 text-indigo-600 dark:text-indigo-400 opacity-30" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Engagement Over Time */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Engajamento ao Longo do Tempo
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={engagementData || []}>
                <defs>
                  <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="activeUsers"
                  stroke="#6366F1"
                  fillOpacity={1}
                  fill="url(#colorEngagement)"
                  name="Usuários Ativos"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Cohort Selector & Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Turmas
            </h2>
            <select
              value={selectedCohort}
              onChange={(e) => handleCohortChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 mb-6"
            >
              <option value="">Todas as turmas</option>
              {cohortMetrics?.map((cohort) => (
                <option key={cohort.cohortId} value={cohort.cohortId}>
                  {cohort.cohortName}
                </option>
              ))}
            </select>

            {selectedCohortData && (
              <div className="space-y-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-1">
                    Alunos
                  </p>
                  <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                    {selectedCohortData.studentCount}
                  </p>
                </div>

                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-xs text-green-700 dark:text-green-300 mb-1">
                    Progresso Médio
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {selectedCohortData.averageProgress}%
                  </p>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">
                    Frequência Média
                  </p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {selectedCohortData.averageAttendance}%
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Skill Distribution & Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Skill Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Distribuição de Habilidades
            </h2>
            {skillDistributionData.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={skillDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {skillDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Trend Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Análise de Tendências
            </h2>
            {trendChartData.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="week1" fill="#6366F1" name="Semana 1" />
                  <Bar dataKey="week2" fill="#10B981" name="Semana 2" />
                  <Bar dataKey="week3" fill="#F59E0B" name="Semana 3" />
                  <Bar dataKey="week4" fill="#EF4444" name="Semana 4" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </div>

        {/* Comparative Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Desempenho Comparativo por Turma
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="averageProgress" name="Progresso Médio" />
              <YAxis dataKey="averageAttendance" name="Frequência Média" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter
                name="Turmas"
                data={cohortMetrics || []}
                fill="#6366F1"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
};
