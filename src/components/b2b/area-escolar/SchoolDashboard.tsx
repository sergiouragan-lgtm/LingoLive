import React, { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter
} from 'recharts';
import {
  Users, BookOpen, TrendingUp, Award, AlertCircle, Activity,
  Clock, Target, Zap, GraduationCap, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { useSchoolData } from '@/hooks/useSchoolData';
import { useClassrooms } from '@/hooks/useClassrooms';
import { useClassroomStudentsProgress } from '@/hooks/useStudentProgress';

interface SchoolDashboardProps {
  schoolId: string;
  onNavigate?: (view: string) => void;
}

interface KPICard {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface PerformanceDistribution {
  level: string;
  count: number;
  percentage: number;
}

const COLORS = ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#06B6D4'];

export const SchoolDashboard: React.FC<SchoolDashboardProps> = ({
  schoolId,
  onNavigate
}) => {
  const { school, isLoading: schoolLoading } = useSchoolData(schoolId, { realtime: true });
  const { classrooms, isLoading: classroomsLoading } = useClassrooms(schoolId);

  // Aggregate student progress across all classrooms
  const studentProgressData = useMemo(() => {
    const allProgress: any[] = [];
    classrooms.forEach(classroom => {
      // In a real implementation, this would fetch progress for each classroom
      // For now, we'll calculate from classroom data
      allProgress.push({
        classroomId: classroom.id,
        totalStudents: classroom.enrolledCount,
        level: classroom.level
      });
    });
    return allProgress;
  }, [classrooms]);

  // Calculate KPIs
  const kpis: KPICard[] = useMemo(() => {
    const totalStudents = classrooms.reduce((sum, c) => sum + c.enrolledCount, 0);
    const totalTeachers = new Set(classrooms.map(c => c.teacherUid)).size;
    const totalClasses = classrooms.length;
    const avgCapacity = classrooms.length > 0
      ? Math.round(classrooms.reduce((sum, c) => sum + (c.enrolledCount / c.capacity * 100), 0) / classrooms.length)
      : 0;

    return [
      {
        title: 'Total Students',
        value: totalStudents,
        change: 12,
        icon: <Users className="w-6 h-6" />,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
      },
      {
        title: 'Active Teachers',
        value: totalTeachers,
        change: 5,
        icon: <GraduationCap className="w-6 h-6" />,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
      },
      {
        title: 'Classes',
        value: totalClasses,
        change: 8,
        icon: <BookOpen className="w-6 h-6" />,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
      },
      {
        title: 'Avg. Capacity',
        value: `${avgCapacity}%`,
        change: 3,
        icon: <Target className="w-6 h-6" />,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
      },
    ];
  }, [classrooms]);

  // Performance distribution by CEFR level
  const performanceDistribution: PerformanceDistribution[] = useMemo(() => {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const distribution = levels.map(level => {
      const count = classrooms.filter(c => c.level === level).length;
      return {
        level,
        count,
        percentage: classrooms.length > 0 ? Math.round((count / classrooms.length) * 100) : 0
      };
    });
    return distribution.filter(d => d.count > 0);
  }, [classrooms]);

  // Language distribution
  const languageDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    classrooms.forEach(c => {
      distribution[c.language] = (distribution[c.language] || 0) + 1;
    });
    return Object.entries(distribution).map(([language, count]) => ({
      name: language,
      value: count
    }));
  }, [classrooms]);

  // Enrollment trend (mock data)
  const enrollmentTrend = useMemo(() => {
    return [
      { month: 'Jan', students: 120, capacity: 200 },
      { month: 'Feb', students: 145, capacity: 200 },
      { month: 'Mar', students: 168, capacity: 220 },
      { month: 'Apr', students: 192, capacity: 240 },
      { month: 'May', students: 215, capacity: 280 },
      { month: 'Jun', students: classrooms.reduce((sum, c) => sum + c.enrolledCount, 0), capacity: classrooms.reduce((sum, c) => sum + c.capacity, 0) }
    ];
  }, [classrooms]);

  // Schedule distribution
  const scheduleData = useMemo(() => {
    const distribution: Record<string, number> = {};
    classrooms.forEach(c => {
      c.schedule.days.forEach(day => {
        distribution[day] = (distribution[day] || 0) + 1;
      });
    });
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    return days.map(day => ({
      day: day.slice(0, 3),
      classes: distribution[day] || 0
    }));
  }, [classrooms]);

  if (schoolLoading || classroomsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          {school?.name || 'School Dashboard'}
        </h1>
        <p className="text-slate-600">
          {school?.plan === 'school_pro' ? '🟣 Pro Plan' : '🟢 Basic Plan'} •
          {school?.country && ` ${school.country}`}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 ${kpi.bgColor} rounded-lg ${kpi.color}`}>
                {kpi.icon}
              </div>
              <div className="text-sm font-semibold text-green-600">
                +{kpi.change}%
              </div>
            </div>
            <p className="text-slate-600 text-sm mb-1">{kpi.title}</p>
            <p className="text-3xl font-bold text-slate-900">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Enrollment Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Enrollment Trend</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={enrollmentTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="students"
                stroke="#4F46E5"
                strokeWidth={3}
                dot={{ fill: '#4F46E5', r: 5 }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="capacity"
                stroke="#cbd5e1"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Language Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-slate-900">Languages Offered</h2>
          </div>
          {languageDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={languageDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} (${value})`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {languageDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </motion.div>

        {/* CEFR Level Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-pink-600" />
            <h2 className="text-lg font-bold text-slate-900">CEFR Level Distribution</h2>
          </div>
          {performanceDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="level" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }}
                />
                <Bar
                  dataKey="count"
                  fill="#EC4899"
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </motion.div>

        {/* Schedule Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900">Classes per Day</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scheduleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }}
              />
              <Bar
                dataKey="classes"
                fill="#F59E0B"
                radius={[8, 8, 0, 0]}
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Statistics Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
      >
        <h2 className="text-lg font-bold text-slate-900 mb-6">Quick Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg">
            <p className="text-sm text-indigo-600 font-semibold">Avg. Class Size</p>
            <p className="text-2xl font-bold text-indigo-900 mt-1">
              {classrooms.length > 0
                ? Math.round(classrooms.reduce((sum, c) => sum + c.enrolledCount, 0) / classrooms.length)
                : 0}
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <p className="text-sm text-purple-600 font-semibold">Total Capacity</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">
              {classrooms.reduce((sum, c) => sum + c.capacity, 0)}
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg">
            <p className="text-sm text-pink-600 font-semibold">Occupancy Rate</p>
            <p className="text-2xl font-bold text-pink-900 mt-1">
              {classrooms.length > 0
                ? Math.round(
                    (classrooms.reduce((sum, c) => sum + c.enrolledCount, 0) /
                      classrooms.reduce((sum, c) => sum + c.capacity, 0)) *
                      100
                  )
                : 0}%
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg">
            <p className="text-sm text-amber-600 font-semibold">Avg. Utilization</p>
            <p className="text-2xl font-bold text-amber-900 mt-1">
              {classrooms.length > 0
                ? Math.round(
                    classrooms.reduce((sum, c) => sum + (c.enrolledCount / c.capacity * 100), 0) /
                      classrooms.length
                  )
                : 0}%
            </p>
          </div>
        </div>
      </motion.div>

      {/* Plan Limits */}
      {school && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-200"
        >
          <div className="flex items-start gap-4">
            <Award className="w-6 h-6 text-indigo-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 mb-3">Plan Limits</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Students Limit</p>
                  <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (classrooms.reduce((sum, c) => sum + c.enrolledCount, 0) /
                            school.studentsLimit) * 100,
                          100
                        )}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {classrooms.reduce((sum, c) => sum + c.enrolledCount, 0)} / {school.studentsLimit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Teachers Limit</p>
                  <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (new Set(classrooms.map(c => c.teacherUid)).size /
                            school.teachersLimit) * 100,
                          100
                        )}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Set(classrooms.map(c => c.teacherUid)).size} / {school.teachersLimit}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
