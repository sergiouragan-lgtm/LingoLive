import React, { useState, useEffect } from 'react';
import { auth } from '../../../firebase';
import { getAtRiskStudents } from '../../../lib/schoolAnalytics';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useMonitoring } from '../../../hooks/useMonitoring';

import {
  // Shared UI Components
  ToastContainer,
  RoleSelector,
  SchoolSidebar,
  // Tab Components
  SchoolDashboard,
  AcademicManagement,
  TeachersTab,
  StudentsTab,
  ParentsTab,
  AITeachersTab,
  AIDirectorsTab,
  DigitalLibraryTab,
  CommunicationTab,
  FinancialTab,
  IntegrationsTab,
  IntelligenceCenter,
  SettingsTab,
} from './school-management';

import type { AppTab, RbacRole, AtRiskFilter } from './school-management/types';
import { initialTeachers, initialStudents, initialClasses } from './school-management/constants';

export const SchoolManagementRefactored: React.FC = () => {
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  // Navigation & role-based access control
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [rbacRole, setRbacRole] = useState<RbacRole>('Diretor');

  // Regional context for geolocation-aware AI
  const [selectedGeoRegion, setSelectedGeoRegion] = useState<string>('Moçambique');

  // Data states
  const [teachers, setTeachers] = useState(initialTeachers);
  const [students, setStudents] = useState(initialStudents);
  const [classes, setClasses] = useState(initialClasses);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync & Notifications
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [toasts, setToasts] = useState<string[]>([]);

  // Academic context
  const [activeYear, setActiveYear] = useState('2026');
  const [activePeriod, setActivePeriod] = useState('3º Trimestre');

  // AI interactive tools
  const [teacherPrompt, setTeacherPrompt] = useState('Cria um teste para turma 8.º ano sobre Present Perfect.');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedAIInsight, setSelectedAIInsight] = useState<string | null>(null);

  // At-risk student tracking
  const [atRiskFilter, setAtRiskFilter] = useState<AtRiskFilter>('all');
  const [selectedAtRiskStudent, setSelectedAtRiskStudent] = useState<any | null>(null);
  const [selectedClassTrend, setSelectedClassTrend] = useState<string>('all');

  // License
  const [licenseKey, setLicenseKey] = useState('LL-ENT-992-2026');

  // Toast helper
  const addToast = (msg: string) => {
    setToasts(prev => [msg, ...prev].slice(0, 4));
    setTimeout(() => {
      setToasts(prev => prev.slice(0, -1));
    }, 4000);
  };

  // Track lifecycle
  useEffect(() => {
    if (userId) {
      trackEvent('school_management_accessed', {
        rbacRole,
        teachersCount: teachers.length,
        studentsCount: students.length,
        classesCount: classes.length,
      });
    }
  }, [userId, trackEvent, rbacRole, teachers.length, students.length, classes.length]);

  // Track tab changes
  useEffect(() => {
    if (userId) {
      trackEvent('school_management_tab_changed', { activeTab });
    }
  }, [activeTab, userId, trackEvent]);

  // Track RBAC role changes
  useEffect(() => {
    if (userId) {
      trackEvent('school_management_rbac_role_changed', {
        rbacRole,
        teachersCount: teachers.length,
        studentsCount: students.length,
        classesCount: classes.length,
      });
    }
  }, [rbacRole, userId, trackEvent, teachers.length, students.length, classes.length]);

  // Sync simulation
  const triggerSync = (section: string) => {
    setIsSyncing(section);
    setTimeout(() => {
      setIsSyncing(null);
      addToast(`Sincronização de ${section} concluída com sucesso com os servidores LingoLIVE!`);
    }, 1500);
  };

  // Render active tab
  const renderActiveTab = () => {
    const tabProps = {
      onSync: triggerSync,
      isSyncing,
      teachers,
      setTeachers,
      students,
      setStudents,
      classes,
      setClasses,
      searchQuery,
      setSearchQuery,
      selectedGeoRegion,
      setSelectedGeoRegion,
      teacherPrompt,
      setTeacherPrompt,
      aiResponse,
      setAiResponse,
      isGenerating,
      setIsGenerating,
      selectedAIInsight,
      setSelectedAIInsight,
      atRiskFilter,
      setAtRiskFilter,
      selectedAtRiskStudent,
      setSelectedAtRiskStudent,
      selectedClassTrend,
      setSelectedClassTrend,
      activeYear,
      setActiveYear,
      activePeriod,
      setActivePeriod,
      licenseKey,
      addToast,
    };

    switch (activeTab) {
      case 'dashboard':
        return <SchoolDashboard onSync={triggerSync} isSyncing={isSyncing} />;
      case 'academico':
        return <AcademicManagement {...tabProps} />;
      case 'professores':
        return <TeachersTab {...tabProps} />;
      case 'alunos':
        return <StudentsTab {...tabProps} />;
      case 'pais':
        return <ParentsTab {...tabProps} />;
      case 'ia-professores':
        return <AITeachersTab {...tabProps} />;
      case 'ia-diretores':
        return <AIDirectorsTab {...tabProps} />;
      case 'biblioteca':
        return <DigitalLibraryTab {...tabProps} />;
      case 'comunicacao':
        return <CommunicationTab {...tabProps} />;
      case 'financeiro':
        return <FinancialTab {...tabProps} />;
      case 'integracoes':
        return <IntegrationsTab {...tabProps} />;
      case 'intelligence':
        return <IntelligenceCenter {...tabProps} />;
      case 'configuracoes':
        return <SettingsTab {...tabProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800" id="school-mgmt-root">
      <ToastContainer toasts={toasts} />

      {/* Top Header & Role Switcher */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 21H3v-2h10v2zm0-4H3v-2h10v2zm0-4H3V9h10v4zm8-2v-4h-2V7h-2v2h-2v4h2v2h2v-2h2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">LingoLIVE IA for Schools</h1>
                <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  B2B Executive Panel
                </span>
              </div>
              <p className="text-xs text-slate-500">Gestão Educacional, Sincronização & Analytics de IA em Tempo Real</p>
            </div>
          </div>

          <RoleSelector
            selectedRole={rbacRole}
            onRoleChange={(role) => {
              setRbacRole(role);
              addToast(`Visualizando sistema como: ${role}`);
              // Adjust active tab if current role doesn't have access
              if (role === 'Professor' && ['financeiro', 'ia-diretores', 'integracoes'].includes(activeTab)) {
                setActiveTab('ia-professores');
              }
              if (role === 'Aluno' && !['dashboard', 'alunos', 'biblioteca', 'comunicacao'].includes(activeTab)) {
                setActiveTab('alunos');
              }
              if (role === 'Encarregado' && !['dashboard', 'pais', 'comunicacao'].includes(activeTab)) {
                setActiveTab('pais');
              }
            }}
          />
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
        <SchoolSidebar activeTab={activeTab} onTabChange={setActiveTab} rbacRole={rbacRole} />

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
};

export default SchoolManagementRefactored;
