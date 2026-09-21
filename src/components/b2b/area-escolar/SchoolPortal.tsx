import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  BookOpen,
  BarChart3,
  Settings,
  Plus,
  Search,
  Filter,
  Download,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { auth } from '../../../firebase';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useMonitoring } from '../../../hooks/useMonitoring';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

interface Teacher {
  id: string;
  name: string;
  email: string;
  expertise: string[];
  activeClasses: number;
  totalStudents: number;
  status: 'active' | 'inactive';
  joinedAt: number;
}

interface ClassCohort {
  id: string;
  name: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  teacherId: string;
  studentCount: number;
  schedule: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  enrollmentOpen: boolean;
  averageProgress: number;
  createdAt: number;
}

interface StudentEnrollment {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  enrolledAt: number;
  status: 'active' | 'paused' | 'completed';
  progress: number;
  attendance: number;
}

interface SchoolPortalProps {
  schoolId: string;
  schoolName: string;
  role: 'admin' | 'principal' | 'coordinator';
}

type TabType = 'teachers' | 'classes' | 'students' | 'analytics' | 'settings';

export const SchoolPortal: React.FC<SchoolPortalProps> = ({ schoolId, schoolName, role }) => {
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  const [activeTab, setActiveTab] = useState<TabType>('teachers');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>('');

  useEffect(() => {
    if (userId) {
      trackEvent('school_portal_accessed', {
        schoolId,
        schoolName,
        userRole: role,
      });
    }
  }, [userId, trackEvent, schoolId, schoolName, role]);

  const { data: teachers, isLoading: teachersLoading } = useRealtimeSync<Teacher[]>(
    `schools/${schoolId}/teachers`,
    (data) => data || []
  );

  const { data: classes, isLoading: classesLoading } = useRealtimeSync<ClassCohort[]>(
    `schools/${schoolId}/classes`,
    (data) => data || []
  );

  const { data: enrollments, isLoading: enrollmentsLoading } = useRealtimeSync<StudentEnrollment[]>(
    `schools/${schoolId}/enrollments`,
    (data) => data || []
  );

  const filteredTeachers = useMemo(() => {
    return (teachers || []).filter(
      (teacher) =>
        teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teachers, searchQuery]);

  const filteredClasses = useMemo(() => {
    return (classes || []).filter((cls) => {
      const matchesSearch = cls.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLevel = !selectedLevel || cls.level === selectedLevel;
      return matchesSearch && matchesLevel;
    });
  }, [classes, searchQuery, selectedLevel]);

  const totalStudents = useMemo(() => {
    return enrollments?.filter((e) => e.status === 'active').length || 0;
  }, [enrollments]);

  const averageAttendance = useMemo(() => {
    const activeEnrollments = enrollments?.filter((e) => e.status === 'active') || [];
    if (activeEnrollments.length === 0) return 0;
    const sum = activeEnrollments.reduce((acc, e) => acc + e.attendance, 0);
    return Math.round(sum / activeEnrollments.length);
  }, [enrollments]);

  const averageProgress = useMemo(() => {
    const activeEnrollments = enrollments?.filter((e) => e.status === 'active') || [];
    if (activeEnrollments.length === 0) return 0;
    const sum = activeEnrollments.reduce((acc, e) => acc + e.progress, 0);
    return Math.round(sum / activeEnrollments.length);
  }, [enrollments]);

  const handleExportReport = async (format: 'pdf' | 'csv') => {
    try {
      const token = await (window as any).auth?.currentUser?.getIdToken?.();
      const response = await fetch(
        `/api/schools/${schoolId}/export?format=${format}&type=enrollment`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `school-report-${Date.now()}.${format === 'pdf' ? 'pdf' : 'csv'}`;
      link.click();

      if (userId) {
        trackEvent('school_portal_report_exported', {
          format,
          exportType: 'enrollment',
          fileSize: blob.size,
          userRole: role,
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      if (userId) {
        trackEvent('school_portal_export_failed', {
          format,
          userRole: role,
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{schoolName}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Portal de Gestão Escolar</p>
            </div>
            {role === 'admin' && (
              <button
                onClick={() => {
                  if (userId) {
                    trackEvent('school_portal_add_resource_clicked', {
                      resourceType: 'general',
                    });
                  }
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar Recurso
              </button>
            )}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Professores</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {teachers?.length || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-30" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Turmas</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {classes?.length || 0}
                  </p>
                </div>
                <BookOpen className="w-8 h-8 text-green-600 dark:text-green-400 opacity-30" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Alunos</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {totalStudents}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-600 dark:text-purple-400 opacity-30" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Progresso</p>
                  <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                    {averageProgress}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-amber-600 dark:text-amber-400 opacity-30" />
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto border-t border-gray-200 dark:border-gray-700 pt-4">
            {(['teachers', 'classes', 'students', 'analytics', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (userId) {
                    trackEvent('school_portal_tab_clicked', {
                      tabName: tab,
                      userRole: role,
                    });
                  }
                }}
                className={`whitespace-nowrap pb-2 px-3 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab === 'teachers' && <span>Professores</span>}
                {tab === 'classes' && <span>Turmas</span>}
                {tab === 'students' && <span>Alunos</span>}
                {tab === 'analytics' && <span>Análises</span>}
                {tab === 'settings' && <span>Configurações</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'teachers' && (
          <motion.div
            key="teachers"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar professores..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (userId && e.target.value) {
                      trackEvent('school_portal_search_performed', {
                        searchTab: 'teachers',
                        searchQuery: e.target.value,
                        resultsCount: filteredTeachers.length,
                      });
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              {role === 'admin' && (
                <button
                  onClick={() => {
                    if (userId) {
                      trackEvent('school_portal_add_teacher_clicked', {});
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Novo Professor
                </button>
              )}
            </div>

            <div className="grid gap-4">
              {teachersLoading ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : filteredTeachers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhum professor encontrado</div>
              ) : (
                filteredTeachers.map((teacher) => (
                  <motion.div
                    key={teacher.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{teacher.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{teacher.email}</p>
                        <div className="flex gap-2 mt-2">
                          {teacher.expertise.map((exp) => (
                            <span
                              key={exp}
                              className="inline-block px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full"
                            >
                              {exp}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div
                          className={`px-2 py-1 text-xs rounded-full ${
                            teacher.status === 'active'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {teacher.status === 'active' ? 'Ativo' : 'Inativo'}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {teacher.activeClasses}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Turmas ativas</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {teacher.totalStudents}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Alunos totais</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'classes' && (
          <motion.div
            key="classes"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar turmas..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (userId && e.target.value) {
                      trackEvent('school_portal_search_performed', {
                        searchTab: 'classes',
                        searchQuery: e.target.value,
                        resultsCount: filteredClasses.length,
                      });
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                onClick={() => {
                  setFilterOpen(!filterOpen);
                  if (userId) {
                    trackEvent('school_portal_filter_toggled', {
                      tab: 'classes',
                      filterOpen: !filterOpen,
                    });
                  }
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
              >
                <Filter className="w-4 h-4" />
                Filtrar
              </button>
            </div>

            {filterOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6"
              >
                <div className="flex gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Nível
                    </label>
                    <select
                      value={selectedLevel}
                      onChange={(e) => {
                        setSelectedLevel(e.target.value);
                        if (userId) {
                          trackEvent('school_portal_level_filter_changed', {
                            selectedLevel: e.target.value,
                            matchingClasses: e.target.value ? filteredClasses.filter(c => c.level === e.target.value).length : filteredClasses.length,
                          });
                        }
                      }}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Todos os níveis</option>
                      <option value="A1">A1</option>
                      <option value="A2">A2</option>
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                      <option value="C1">C1</option>
                      <option value="C2">C2</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="grid gap-4">
              {classesLoading ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : filteredClasses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma turma encontrada</div>
              ) : (
                filteredClasses.map((cls) => (
                  <motion.div
                    key={cls.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{cls.name}</h3>
                        <div className="flex gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded">
                            {cls.level}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                            {cls.studentCount} alunos
                          </span>
                          {cls.enrollmentOpen && (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                              Inscrições abertas
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex gap-4 text-sm">
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4" />
                            {cls.schedule.days.join(', ')} • {cls.schedule.startTime}-{cls.schedule.endTime}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {cls.averageProgress}%
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Progresso médio</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => handleExportReport('pdf')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
              >
                <Download className="w-4 h-4" />
                Exportar PDF
              </button>
              <button
                onClick={() => handleExportReport('csv')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Frequência Média</h3>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{averageAttendance}%</p>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Progresso Médio</h3>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{averageProgress}%</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configurações</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Gerenciar configurações da escola e permissões de usuários
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
