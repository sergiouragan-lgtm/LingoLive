import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Zap,
  BookOpen,
  Mic,
  Eye,
  PenTool,
  Target,
  Award,
  Calendar,
  Download,
} from 'lucide-react';
import { auth } from '../../../firebase';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useMonitoring } from '../../../hooks/useMonitoring';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

interface SkillAssessment {
  skill: 'listening' | 'speaking' | 'reading' | 'writing';
  score: number;
  maxScore: 100;
  assessedAt: number;
}

interface StudentProgress {
  id: string;
  name: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  overallProgress: number;
  xp: number;
  streak: number;
  lastActivity: number;
  skillAssessments: SkillAssessment[];
  activityData: Array<{ date: string; minutes: number }>;
  badges: string[];
  enrollmentDate: number;
}

interface CohortMetrics {
  averageProgress: number;
  averageAttendance: number;
  topPerformers: StudentProgress[];
  needsSupport: StudentProgress[];
}

interface StudentAnalyticsProps {
  schoolId: string;
  classId: string;
  studentId?: string;
}

const SKILL_COLORS = {
  listening: '#3B82F6',
  speaking: '#10B981',
  reading: '#F59E0B',
  writing: '#EF4444',
};

const BADGE_COLORS = [
  '#8B5CF6',
  '#EC4899',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#6366F1',
  '#14B8A6',
  '#F97316',
];

export const StudentAnalytics: React.FC<StudentAnalyticsProps> = ({
  schoolId,
  classId,
  studentId,
}) => {
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedSkill, setSelectedSkill] = useState<'listening' | 'speaking' | 'reading' | 'writing' | null>(
    null
  );

  const { data: students, isLoading: studentsLoading } = useRealtimeSync<StudentProgress[]>(
    `schools/${schoolId}/classes/${classId}/students`,
    (data) => data || []
  );

  const { data: cohortMetrics } = useRealtimeSync<CohortMetrics>(
    `schools/${schoolId}/classes/${classId}/metrics`,
    (data) =>
      data || {
        averageProgress: 0,
        averageAttendance: 0,
        topPerformers: [],
        needsSupport: [],
      }
  );

  const currentStudent = studentId
    ? students?.find((s) => s.id === studentId)
    : students?.[0];

  useEffect(() => {
    if (userId && currentStudent) {
      trackEvent('student_analytics_accessed', {
        schoolId,
        classId,
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        studentLevel: currentStudent.level,
        studentProgress: currentStudent.overallProgress,
      });
    }
  }, [userId, trackEvent, schoolId, classId, currentStudent]);

  const skillData = useMemo(() => {
    if (!currentStudent) return [];
    return currentStudent.skillAssessments
      .sort((a, b) => b.assessedAt - a.assessedAt)
      .slice(0, 10)
      .map((assessment) => ({
        name: ['Listening', 'Speaking', 'Reading', 'Writing'][
          ['listening', 'speaking', 'reading', 'writing'].indexOf(assessment.skill)
        ],
        score: assessment.score,
        maxScore: assessment.maxScore,
      }));
  }, [currentStudent]);

  const activityData = useMemo(() => {
    if (!currentStudent) return [];
    return currentStudent.activityData.slice(-30);
  }, [currentStudent]);

  const skillSummary = useMemo(() => {
    if (!currentStudent) return null;
    return {
      listening:
        currentStudent.skillAssessments.find((a) => a.skill === 'listening')?.score || 0,
      speaking:
        currentStudent.skillAssessments.find((a) => a.skill === 'speaking')?.score || 0,
      reading: currentStudent.skillAssessments.find((a) => a.skill === 'reading')?.score || 0,
      writing: currentStudent.skillAssessments.find((a) => a.skill === 'writing')?.score || 0,
    };
  }, [currentStudent]);

  if (!currentStudent && !studentsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Nenhum aluno encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {currentStudent && (
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentStudent.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nível {currentStudent.level} • {currentStudent.overallProgress}% progresso
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    if (userId) {
                      trackEvent('student_analytics_report_generated', {
                        studentId: currentStudent?.id,
                        studentName: currentStudent?.name,
                        reportType: 'print',
                      });
                    }
                    window.print();
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                >
                  <Download className="w-4 h-4" />
                  Relatório
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {studentsLoading ? (
          <div className="text-center py-12 text-gray-500">Carregando dados...</div>
        ) : currentStudent ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Progresso</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {currentStudent.overallProgress}%
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">XP Conquistado</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {currentStudent.xp.toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Award className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sequência</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {currentStudent.streak} dias
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Última Atividade</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {Math.floor((Date.now() - currentStudent.lastActivity) / 86400000)}h atrás
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Skills Assessment */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Skill Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Avaliação de Habilidades
                </h2>
                <div className="space-y-4">
                  {skillSummary && [
                    { skill: 'listening', label: 'Compreensão Auditiva', icon: Mic },
                    { skill: 'speaking', label: 'Fala', icon: Mic },
                    { skill: 'reading', label: 'Leitura', icon: Eye },
                    { skill: 'writing', label: 'Escrita', icon: PenTool },
                  ].map(({ skill, label, icon: Icon }) => (
                    <div
                      key={skill}
                      className="cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => {
                        const newSkill = selectedSkill === skill ? null : (skill as 'listening' | 'speaking' | 'reading' | 'writing');
                        setSelectedSkill(newSkill);
                        if (userId) {
                          trackEvent('student_analytics_skill_selected', {
                            studentId: currentStudent?.id,
                            skillName: skill,
                            skillScore: skillSummary?.[skill as keyof typeof skillSummary] || 0,
                            selected: newSkill === skill,
                          });
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon
                            className="w-4 h-4"
                            style={{
                              color: SKILL_COLORS[skill as keyof typeof SKILL_COLORS],
                            }}
                          />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {label}
                          </span>
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {skillSummary[skill as keyof typeof skillSummary]}/100
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${skillSummary[skill as keyof typeof skillSummary]}%`,
                            backgroundColor: SKILL_COLORS[skill as keyof typeof SKILL_COLORS],
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Conquistas
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  {currentStudent.badges.map((badge, idx) => (
                    <motion.div
                      key={badge}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{
                          backgroundColor: BADGE_COLORS[idx % BADGE_COLORS.length],
                        }}
                      >
                        {badge.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-xs text-center text-gray-600 dark:text-gray-400">{badge}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Charts */}
            {skillData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Histórico de Avaliações
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={skillData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="score" fill="#6366F1" />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {activityData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Atividade por Dia
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="minutes"
                      stroke="#6366F1"
                      strokeWidth={2}
                      name="Minutos"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Cohort Comparison */}
            {cohortMetrics && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Comparação com Turma
                </h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Progresso Médio da Turma
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {cohortMetrics.averageProgress}%
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        vs seu {currentStudent.overallProgress}%
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Frequência Média da Turma
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {cohortMetrics.averageAttendance}%
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};
