import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SchoolMetrics, Teacher, Class, Student, PlatformFeatures } from '../../types';
import { 
  Users, 
  BookOpen, 
  Flame, 
  ShieldCheck, 
  Plus, 
  Clipboard, 
  Settings, 
  Activity, 
  Database, 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  Trash2, 
  Edit, 
  Copy, 
  Check, 
  Search, 
  Clock,
  UserCheck,
  Languages,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  X,
  Download
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, setDoc, query, where } from 'firebase/firestore';
import { UsageLogs } from '../growth/UsageLogs';
import { ServiceHealthStatus } from '../../types';
import { SecurityDashboard } from './SecurityDashboard';
import { BackupDashboard } from './BackupDashboard';
import { DisasterRecovery } from '../admin/DisasterRecovery';
import { NotificationDiagnostic } from '../admin/NotificationDiagnostic';
import { FeatureFlagDashboard } from './FeatureFlagDashboard';
import { TestAutomationDashboard } from './TestAutomationDashboard';
import { GlobalDeploymentDashboard } from './GlobalDeploymentDashboard';
import { BusinessIntelligenceDashboard } from './BusinessIntelligenceDashboard';
import { DataWarehouseDashboard } from './DataWarehouseDashboard';
import { AICostOptimizationDashboard } from './AICostOptimizationDashboard';
import { Shield, Sliders, Cpu, Globe, BarChart2, Coins, ShieldAlert, Bell } from 'lucide-react';

interface AdminDashboardProps {
  metrics: SchoolMetrics;
  features: PlatformFeatures;
  onToggleFeature: (key: keyof PlatformFeatures, value: boolean) => void;
  healthStatus: ServiceHealthStatus | null;
  onRefreshHealth: () => Promise<void>;
  isCheckingHealth: boolean;
  initialTab?: 'professores' | 'turmas' | 'alunos' | 'permissoes' | 'seguranca' | 'backups' | 'features' | 'qa' | 'deploy' | 'bi' | 'dw' | 'ai-cost' | 'disaster-recovery';
}

export function AdminDashboard({ 
  metrics, 
  features, 
  onToggleFeature,
  healthStatus,
  onRefreshHealth,
  isCheckingHealth,
  initialTab
}: AdminDashboardProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState<'professores' | 'turmas' | 'alunos' | 'permissoes' | 'seguranca' | 'backups' | 'features' | 'qa' | 'deploy' | 'bi' | 'dw' | 'ai-cost' | 'disaster-recovery'>('professores');
  
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  
  // Email Permissions States
  const [emailPermissions, setEmailPermissions] = useState<any[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [showAddPermissionForm, setShowAddPermissionForm] = useState(false);
  const [permissionForm, setPermissionForm] = useState({
    email: '',
    role: 'Educator', // 'Admin' | 'Educator' | 'Student'
    userType: 'teacher', // 'teacher' | 'student' | 'only_permission'
    name: '',
    age: '',
    targetLanguage: 'Inglês',
    teacherUid: '',
    telefone: '',
    sala: '',
    turno: 'Manhã'
  });
  
  // Real-time Health Polling Settings
  const [autoRefreshHealth, setAutoRefreshHealth] = useState(true);
  const [healthSecondsLeft, setHealthSecondsLeft] = useState(15);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clipboard feedbacks
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');

  // Form Toggles & State: Teachers
  const [showAddTeacherForm, setShowAddTeacherForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherForm, setTeacherForm] = useState<{
    nome: string;
    email: string;
    telefone: string;
    idioma: string;
    sala: string;
    turno: string;
    allowedClassIds: string[];
  }>({
    nome: '',
    email: '',
    telefone: '',
    idioma: 'Inglês',
    sala: '',
    turno: 'Manhã',
    allowedClassIds: []
  });

  // Form Toggles & State: Classes
  const [showAddClassForm, setShowAddClassForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [selectedTeacherUid, setSelectedTeacherUid] = useState('');
  const [managingClassEnrollment, setManagingClassEnrollment] = useState<Class | null>(null);

  // Form Toggles & State: Students
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState({
    name: '',
    age: '',
    targetLanguage: 'Inglês',
    teacherUid: ''
  });

  // Status/Logs messages
  const [submitting, setSubmitting] = useState(false);

  // Load all initial collections
  const loadCollections = useCallback(async () => {
    try {
      // Teachers
      const teacherSnap = await getDocs(collection(db, 'teachers'));
      const teachersList = teacherSnap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as Teacher));
      setTeachers(teachersList);

      // Classes
      const classSnap = await getDocs(collection(db, 'classes'));
      const classesList = classSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Class));
      setClasses(classesList);

      // Students
      const studentSnap = await getDocs(collection(db, 'students'));
      const studentsList = studentSnap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as Student));
      setStudents(studentsList);

      // Email permissions
      try {
        const permSnap = await getDocs(collection(db, 'email_permissions'));
        const permList = permSnap.docs.map(doc => ({ ...doc.data(), email: doc.id }));
        setEmailPermissions(permList);
      } catch (e) {
        console.warn("Could not load email permissions:", e);
      }
    } catch (error) {
      console.error("Error loading administration collections:", error);
    }
  }, []);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  // Real-time Health Polling management
  useEffect(() => {
    if (autoRefreshHealth) {
      pollingTimerRef.current = setInterval(() => {
        onRefreshHealth();
        setHealthSecondsLeft(15);
      }, 15000);

      countdownTimerRef.current = setInterval(() => {
        setHealthSecondsLeft(prev => (prev > 1 ? prev - 1 : 15));
      }, 1000);
    } else {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    }

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [autoRefreshHealth, onRefreshHealth]);

  // Copy code utility
  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Export to CSV utility for backup
  const handleExportData = async () => {
    try {
      if (students.length === 0) {
        alert("Nenhum aluno cadastrado para exportar.");
        return;
      }

      const headers = [
        "ID do Aluno",
        "Nome",
        "Idade",
        "Idioma Alvo",
        "ID do Tutor",
        "Nome do Tutor",
        "Turmas Matriculadas"
      ];

      const escapeCSVField = (val: any) => {
        if (val === undefined || val === null) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const rows = students.map(st => {
        const tutor = teachers.find(t => t.uid === st.teacherUid);
        const enrolledClasses = classes
          .filter(c => c.studentUids?.includes(st.uid))
          .map(c => c.name)
          .join('; ');

        return [
          st.uid,
          st.name,
          st.age,
          st.targetLanguage,
          st.teacherUid || 'N/A',
          tutor ? tutor.nome : 'Sem tutor',
          enrolledClasses || 'Nenhuma'
        ].map(escapeCSVField).join(',');
      });

      const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `LingoLive_Alunos_Backup_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Log Action in DB
      await addDoc(collection(db, 'admin_logs'), {
        adminEmail: 'admin@lingolive.ai',
        action: `Exportou dados de todos os alunos (${students.length} registros) em CSV`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      alert("Houve um erro ao gerar o arquivo de backup.");
    }
  };

  // TEACHER CRUD HANDLERS
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherForm.nome || !teacherForm.email) return;
    setSubmitting(true);
    try {
      const response = await fetch('/api/professores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...teacherForm, schoolId: 'default-school' }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to register teacher");
      }
      
      // Log Action
      await addDoc(collection(db, 'admin_logs'), {
        adminEmail: 'admin@lingolive.ai',
        action: `Registrou professor: ${teacherForm.nome}`,
        timestamp: new Date().toISOString()
      });

      setTeacherForm({ nome: '', email: '', telefone: '', idioma: 'Inglês', sala: '', turno: 'Manhã', allowedClassIds: [] });
      setShowAddTeacherForm(false);
      await loadCollections();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'teachers');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher || !teacherForm.nome || !teacherForm.email) return;
    setSubmitting(true);
    try {
      const teacherRef = doc(db, 'teachers', editingTeacher.uid);
      await updateDoc(teacherRef, {
        nome: teacherForm.nome,
        email: teacherForm.email,
        telefone: teacherForm.telefone,
        idioma: teacherForm.idioma,
        sala: teacherForm.sala,
        turno: teacherForm.turno,
        allowedClassIds: teacherForm.allowedClassIds || []
      });

      // Log Action
      await addDoc(collection(db, 'admin_logs'), {
        adminEmail: 'admin@lingolive.ai',
        action: `Editou professor: ${teacherForm.nome}`,
        timestamp: new Date().toISOString()
      });

      setEditingTeacher(null);
      setTeacherForm({ nome: '', email: '', telefone: '', idioma: 'Inglês', sala: '', turno: 'Manhã', allowedClassIds: [] });
      await loadCollections();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `teachers/${editingTeacher.uid}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (teacherUid: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o professor ${name}? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteDoc(doc(db, 'teachers', teacherUid));

      // Log Action
      await addDoc(collection(db, 'admin_logs'), {
        adminEmail: 'admin@lingolive.ai',
        action: `Removeu professor: ${name}`,
        timestamp: new Date().toISOString()
      });

      await loadCollections();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `teachers/${teacherUid}`);
    }
  };

  // STUDENT CRUD HANDLERS
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.name || !studentForm.age) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'students'), {
        name: studentForm.name,
        age: Number(studentForm.age),
        targetLanguage: studentForm.targetLanguage,
        teacherUid: studentForm.teacherUid || ""
      });

      // Log Action
      await addDoc(collection(db, 'admin_logs'), {
        adminEmail: 'admin@lingolive.ai',
        action: `Registrou aluno: ${studentForm.name}`,
        timestamp: new Date().toISOString()
      });

      setStudentForm({ name: '', age: '', targetLanguage: 'Inglês', teacherUid: '' });
      setShowAddStudentForm(false);
      await loadCollections();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'students');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !studentForm.name || !studentForm.age) return;
    setSubmitting(true);
    try {
      const studentRef = doc(db, 'students', editingStudent.uid);
      await updateDoc(studentRef, {
        name: studentForm.name,
        age: Number(studentForm.age),
        targetLanguage: studentForm.targetLanguage,
        teacherUid: studentForm.teacherUid || ""
      });

      // Log Action
      await addDoc(collection(db, 'admin_logs'), {
        adminEmail: 'admin@lingolive.ai',
        action: `Atualizou aluno: ${studentForm.name}`,
        timestamp: new Date().toISOString()
      });

      setEditingStudent(null);
      setStudentForm({ name: '', age: '', targetLanguage: 'Inglês', teacherUid: '' });
      await loadCollections();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `students/${editingStudent.uid}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (studentUid: string, name: string) => {
    if (!window.confirm(`Tem certeza de que deseja remover o estudante ${name}?`)) return;
    try {
      await deleteDoc(doc(db, 'students', studentUid));

      // Remove from any classes as well
      const affectedClasses = classes.filter(c => c.studentUids.includes(studentUid));
      for (const cls of affectedClasses) {
        const clsRef = doc(db, 'classes', cls.id);
        await updateDoc(clsRef, {
          studentUids: cls.studentUids.filter(id => id !== studentUid)
        });
      }

      // Log Action
      await addDoc(collection(db, 'admin_logs'), {
        adminEmail: 'admin@lingolive.ai',
        action: `Removeu aluno: ${name}`,
        timestamp: new Date().toISOString()
      });

      await loadCollections();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `students/${studentUid}`);
    }
  };

  // EMAIL PERMISSION HANDLERS
  const handleCreateEmailPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissionForm.email) return;
    setSubmitting(true);
    setLoadingPermissions(true);
    const emailNormalized = permissionForm.email.toLowerCase().trim();
    try {
      // 1. If userType is 'teacher', create a teacher record
      if (permissionForm.userType === 'teacher') {
        const invitationCode = `PROF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        await addDoc(collection(db, 'teachers'), {
          nome: permissionForm.name || 'Professor Autorizado',
          email: emailNormalized,
          telefone: permissionForm.telefone,
          idioma: permissionForm.targetLanguage,
          sala: permissionForm.sala,
          turno: permissionForm.turno,
          invitationCode,
          schoolId: 'default-school'
        });
      }

      // 2. If userType is 'student', create a student record
      if (permissionForm.userType === 'student') {
        await addDoc(collection(db, 'students'), {
          name: permissionForm.name || 'Estudante Autorizado',
          age: Number(permissionForm.age) || 12,
          targetLanguage: permissionForm.targetLanguage,
          teacherUid: permissionForm.teacherUid || ""
        });
      }

      // 3. Create or update email permission in the collection
      await setDoc(doc(db, 'email_permissions', emailNormalized), {
        role: permissionForm.role,
        name: permissionForm.name || 'Usuário Pré-autorizado',
        registeredAt: new Date().toISOString()
      });

      // 4. Update role in the users collection if the user already exists there
      try {
        const userQuery = query(collection(db, 'users'), where('email', '==', emailNormalized));
        const userSnap = await getDocs(userQuery);
        if (!userSnap.empty) {
          for (const userDoc of userSnap.docs) {
            await updateDoc(doc(db, 'users', userDoc.id), {
              role: permissionForm.role
            });
          }
        }
      } catch (err) {
        console.warn("Could not synchronize live role for user", emailNormalized, err);
      }

      // Log action
      await addDoc(collection(db, 'admin_logs'), {
        adminEmail: 'admin@lingolive.ai',
        action: `Criou permissão de acesso para ${emailNormalized} como ${permissionForm.role} (Tipo: ${permissionForm.userType})`,
        timestamp: new Date().toISOString()
      });

      // Reset form
      setPermissionForm({
        email: '',
        role: 'Educator',
        userType: 'teacher',
        name: '',
        age: '',
        targetLanguage: 'Inglês',
        teacherUid: '',
        telefone: '',
        sala: '',
        turno: 'Manhã'
      });
      setShowAddPermissionForm(false);
      await loadCollections();
      alert("Permissão e cadastro configurados com sucesso!");
    } catch (error) {
      console.error("Erro ao criar permissão de e-mail:", error);
      handleFirestoreError(error, OperationType.CREATE, `email_permissions/${emailNormalized}`);
    } finally {
      setSubmitting(false);
      setLoadingPermissions(false);
    }
  };

  const handleDeleteEmailPermission = async (email: string) => {
    if (!window.confirm(`Tem certeza de que deseja revogar a permissão de acesso do e-mail: ${email}?`)) return;
    setLoadingPermissions(true);
    try {
      await deleteDoc(doc(db, 'email_permissions', email.toLowerCase().trim()));

      // Log action
      await addDoc(collection(db, 'admin_logs'), {
        adminEmail: 'admin@lingolive.ai',
        action: `Revogou permissão de acesso do e-mail: ${email}`,
        timestamp: new Date().toISOString()
      });

      await loadCollections();
      alert("Permissão revogada com sucesso.");
    } catch (error) {
      console.error("Erro ao remover permissão:", error);
      handleFirestoreError(error, OperationType.DELETE, `email_permissions/${email}`);
    } finally {
      setLoadingPermissions(false);
    }
  };

  // CLASS CRUD HANDLERS
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName || !selectedTeacherUid) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'classes'), {
        name: newClassName,
        teacherUid: selectedTeacherUid,
        studentUids: []
      });

      // Log Action
      await addDoc(collection(db, 'admin_logs'), {
        adminEmail: 'admin@lingolive.ai',
        action: `Criou turma: ${newClassName}`,
        timestamp: new Date().toISOString()
      });

      setNewClassName('');
      setSelectedTeacherUid('');
      setShowAddClassForm(false);
      await loadCollections();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'classes');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !newClassName || !selectedTeacherUid) return;
    setSubmitting(true);
    try {
      const classRef = doc(db, 'classes', editingClass.id);
      await updateDoc(classRef, {
        name: newClassName,
        teacherUid: selectedTeacherUid
      });

      // Log Action
      await addDoc(collection(db, 'admin_logs'), {
        adminEmail: 'admin@lingolive.ai',
        action: `Atualizou turma: ${newClassName}`,
        timestamp: new Date().toISOString()
      });

      setEditingClass(null);
      setNewClassName('');
      setSelectedTeacherUid('');
      await loadCollections();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `classes/${editingClass.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async (classId: string, name: string) => {
    if (!window.confirm(`Tem certeza de que deseja remover a turma ${name}?`)) return;
    try {
      await deleteDoc(doc(db, 'classes', classId));

      // Log Action
      await addDoc(collection(db, 'admin_logs'), {
        adminEmail: 'admin@lingolive.ai',
        action: `Removeu turma: ${name}`,
        timestamp: new Date().toISOString()
      });

      await loadCollections();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `classes/${classId}`);
    }
  };

  // Toggle student enrollment inside class
  const handleToggleStudentInClass = async (classObj: Class, studentUid: string) => {
    const isEnrolled = classObj.studentUids.includes(studentUid);
    const updatedUids = isEnrolled 
      ? classObj.studentUids.filter(id => id !== studentUid)
      : [...classObj.studentUids, studentUid];

    try {
      const classRef = doc(db, 'classes', classObj.id);
      await updateDoc(classRef, { studentUids: updatedUids });
      
      // Update local state smoothly
      setClasses(prev => prev.map(c => c.id === classObj.id ? { ...c, studentUids: updatedUids } : c));
      if (managingClassEnrollment?.id === classObj.id) {
        setManagingClassEnrollment({ ...classObj, studentUids: updatedUids });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `classes/${classObj.id}`);
    }
  };

  // Feature flag slider toggling helper
  const handleToggle = async (key: keyof PlatformFeatures, value: boolean) => {
    onToggleFeature(key, value);
    await addDoc(collection(db, 'admin_logs'), {
      adminEmail: 'admin@lingolive.ai',
      action: `Alterou funcionalidade ${key} para ${value ? 'Ativado' : 'Desativado'}`,
      timestamp: new Date().toISOString()
    });
  };

  // Filtered lists computation
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLanguage = filterLanguage === '' || s.targetLanguage === filterLanguage;
    const matchesTeacher = filterTeacher === '' || s.teacherUid === filterTeacher;
    return matchesSearch && matchesLanguage && matchesTeacher;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" id="admin-dashboard-root">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-2xl">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Painel Administrativo da Escola</h1>
            <p className="text-sm text-slate-500 font-medium">Controle completo de professores, turmas, alunos e monitoramento de integrações.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-5 rounded-2xl shadow-xs transition-all cursor-pointer"
            title="Exportar dados de todos os alunos em CSV para backup"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Dados da Escola</span>
          </button>

          {/* Quick overall database stats */}
          <div className="bg-slate-900 text-white rounded-2xl px-5 py-3 shadow-md flex items-center gap-4 border border-slate-800">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div className="text-xs">
              <span className="block font-bold text-slate-300">Escola Ativa</span>
              <span className="text-[10px] text-slate-400 font-mono">ID: default-school</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <MetricCard title="Total de Alunos" value={students.length} icon={<Users className="w-5 h-5 text-indigo-600" />} />
        <MetricCard title="Professores Ativos" value={teachers.length} icon={<UserCheck className="w-5 h-5 text-sky-600" />} />
        <MetricCard title="Turmas Formadas" value={classes.length} icon={<BookOpen className="w-5 h-5 text-emerald-600" />} />
        <MetricCard title="Média de Streak" value={`${metrics.averageStreak || 0} dias`} icon={<Flame className="w-5 h-5 text-amber-600" />} />
      </div>

      {/* 2-Column Section: Real-time Integration Monitor & Feature Flags */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Real-time Health Integration Monitor Dashboard */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between relative overflow-hidden" id="realtime-integration-monitor">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/20 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600 animate-pulse" />
                <h2 className="text-lg font-bold text-slate-900">Monitor de Integrações em Tempo Real</h2>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Auto-refresh Switch */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-full py-1 px-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    {autoRefreshHealth ? `Autoteste: ${healthSecondsLeft}s` : 'Autoteste Off'}
                  </span>
                  <button 
                    onClick={() => setAutoRefreshHealth(!autoRefreshHealth)}
                    className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      autoRefreshHealth ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      autoRefreshHealth ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <button
                  onClick={onRefreshHealth}
                  disabled={isCheckingHealth}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 transition-all ${
                    isCheckingHealth ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title="Testar conexões agora"
                >
                  <RefreshCw className={`w-3 h-3 ${isCheckingHealth ? 'animate-spin' : ''}`} />
                  <span>{isCheckingHealth ? 'Testando...' : 'Testar'}</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Verificação contínua das conexões críticas de infraestrutura para garantir o funcionamento estável do LingoLive AI.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Firestore Connection Detail */}
              <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-blue-500" />
                      <span className="font-bold text-slate-800 text-xs">Banco Firestore</span>
                    </div>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      !healthStatus ? 'bg-slate-100 text-slate-500' :
                      healthStatus.services.firestore.status === 'healthy' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                      {!healthStatus ? 'Pendente' : healthStatus.services.firestore.status === 'healthy' ? 'Conectado' : 'Falha'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mb-3">Persistência durável de dados</span>
                </div>
                
                <div className="pt-2.5 border-t border-slate-100/60">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Latência:</span>
                    <span className="font-mono font-bold text-slate-700">
                      {healthStatus ? `${healthStatus.services.firestore.latencyMs}ms` : '--'}
                    </span>
                  </div>
                  {/* Visual response time indicator */}
                  {healthStatus && (
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          healthStatus.services.firestore.latencyMs < 300 ? 'bg-emerald-500' : 
                          healthStatus.services.firestore.latencyMs < 1000 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, (healthStatus.services.firestore.latencyMs / 1200) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>

                {healthStatus?.services.firestore.error && (
                  <div className="mt-2.5 p-2 bg-rose-50 rounded-lg border border-rose-100 flex gap-1.5 items-start text-[9px] text-rose-700 font-mono">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span className="break-all">{healthStatus.services.firestore.error}</span>
                  </div>
                )}
              </div>

              {/* Gemini API Connection Detail */}
              <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
                      <span className="font-bold text-slate-800 text-xs">Google Gemini API</span>
                    </div>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      !healthStatus ? 'bg-slate-100 text-slate-500' :
                      healthStatus.services.gemini.status === 'healthy' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                      {!healthStatus ? 'Pendente' : healthStatus.services.gemini.status === 'healthy' ? 'Conectado' : 'Falha'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mb-3">Modelos de IA Inteligente</span>
                </div>

                <div className="pt-2.5 border-t border-slate-100/60">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Latência:</span>
                    <span className="font-mono font-bold text-slate-700">
                      {healthStatus ? `${healthStatus.services.gemini.latencyMs}ms` : '--'}
                    </span>
                  </div>
                  {/* Visual response time indicator */}
                  {healthStatus && (
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          healthStatus.services.gemini.latencyMs < 600 ? 'bg-emerald-500' : 
                          healthStatus.services.gemini.latencyMs < 2000 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, (healthStatus.services.gemini.latencyMs / 3000) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>

                {healthStatus?.services.gemini.error && (
                  <div className="mt-2.5 p-2 bg-rose-50 rounded-lg border border-rose-100 flex gap-1.5 items-start text-[9px] text-rose-700 font-mono">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span className="break-all">{healthStatus.services.gemini.error}</span>
                  </div>
                )}
              </div>

            </div>
          </div>

          {healthStatus && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Sincronização global do sistema ativa</span>
              <span>Última verificação: {new Date(healthStatus.timestamp).toLocaleTimeString('pt-BR')}</span>
            </div>
          )}
        </div>

        {/* Right Sidebar: Feature Toggles & Diagnostics */}
        <div className="flex flex-col gap-6">
          {/* Feature toggles */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">Controle de Módulos</h3>
            </div>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">Habilite ou desabilite em tempo real os acessos para os alunos e professores.</p>
            
            <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
              {[
                { id: 'practiceRoom', label: 'Sala de Prática de Fala', val: features.practiceRoom },
                { id: 'languageQuiz', label: 'Quizzes de Idiomas', val: features.languageQuiz },
                { id: 'liveChat', label: 'Live Chat (Comunicação)', val: features.liveChat },
                { id: 'vocabDeck', label: 'Vocab Deck de Palavras', val: features.vocabDeck },
                { id: 'educatorDashboard', label: 'Painel do Professor', val: features.educatorDashboard }
              ].map((f) => (
                <div key={f.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100 shadow-3xs">
                  <span className="text-xs font-semibold text-slate-700">{f.label}</span>
                  <button
                    onClick={() => handleToggle(f.id as any, !f.val)}
                    className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      f.val ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      f.val ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Diagnostic Notification Panel */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between" id="notifications-diagnostic-card">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-5 h-5 text-indigo-600 animate-pulse" />
                <h3 className="font-bold text-slate-900 text-sm">Diagnóstico de Notificações</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Dispare alertas e notificações simuladas em tempo real para validar o encanamento do Event Bus e do ToastContext.
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('lingolive_new_notification', {
                      detail: {
                        title: 'Nova Conquista Desbloqueada!',
                        message: 'Parabéns! Completou a sua primeira conversa por voz de 5 minutos com o AI Tutor!',
                        type: 'achievement'
                      }
                    }));
                  }}
                  className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-bold py-2.5 px-3 rounded-xl transition-all flex flex-col items-center justify-center gap-1 shadow-3xs cursor-pointer text-center"
                >
                  <span className="font-mono text-xs">🏆</span>
                  <span>Conquista</span>
                </button>
                
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('lingolive_new_notification', {
                      detail: {
                        title: 'Sincronização com Sucesso!',
                        message: 'As turmas e alunos foram exportados com segurança para o banco de dados principal.',
                        type: 'success'
                      }
                    }));
                  }}
                  className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold py-2.5 px-3 rounded-xl transition-all flex flex-col items-center justify-center gap-1 shadow-3xs cursor-pointer text-center"
                >
                  <span className="font-mono text-xs">🟢</span>
                  <span>Sucesso</span>
                </button>
                
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('lingolive_new_notification', {
                      detail: {
                        title: 'Erro de Conexão Detectado',
                        message: 'Latência na API Gemini excedeu 3000ms. O sistema entrou em modo híbrido local.',
                        type: 'error'
                      }
                    }));
                  }}
                  className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-[11px] font-bold py-2.5 px-3 rounded-xl transition-all flex flex-col items-center justify-center gap-1 shadow-3xs cursor-pointer text-center"
                >
                  <span className="font-mono text-xs">🔴</span>
                  <span>Erro Crítico</span>
                </button>
                
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('lingolive_new_notification', {
                      detail: {
                        title: 'Notificação de Sistema',
                        message: 'A manutenção programada das salas de conversação ocorrerá às 02:00 UTC.',
                        type: 'info'
                      }
                    }));
                  }}
                  className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-[11px] font-bold py-2.5 px-3 rounded-xl transition-all flex flex-col items-center justify-center gap-1 shadow-3xs cursor-pointer text-center"
                >
                  <span className="font-mono text-xs">🔵</span>
                  <span>Informação</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Painel Geral de Controle (Administrador) - Moved from UserProfile */}
      <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-3xl mb-8 space-y-4 shadow-3xs" id="admin-quick-navigation">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600 animate-pulse" />
          <h5 className="font-extrabold text-sm text-slate-800">Painel Geral de Controle (Administrador)</h5>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          Acesse de forma direta os painéis escolares integrados para gerir o ecossistema do LingoLive AI:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-10 gap-4 pt-2">
          <button 
            onClick={() => setActiveTab('professores')}
            className={`py-3 px-4 rounded-2xl border transition-all text-xs font-extrabold flex items-center justify-center gap-2.5 cursor-pointer ${
              activeTab === 'professores' || activeTab === 'alunos'
                ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                : 'border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Professores & Alunos
          </button>
          <button 
            onClick={() => setActiveTab('turmas')}
            className={`py-3 px-4 rounded-2xl border transition-all text-xs font-extrabold flex items-center justify-center gap-2.5 cursor-pointer ${
              activeTab === 'turmas'
                ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                : 'border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Turmas & Aulas
          </button>
          <button 
            onClick={() => setActiveTab('seguranca')}
            className={`py-3 px-4 rounded-2xl border transition-all text-xs font-extrabold flex items-center justify-center gap-2.5 cursor-pointer ${
              activeTab === 'seguranca'
                ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                : 'border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            <Shield className="w-4 h-4" />
            Central de Segurança
          </button>
          <button 
            onClick={() => setActiveTab('features')}
            className={`py-3 px-4 rounded-2xl border transition-all text-xs font-extrabold flex items-center justify-center gap-2.5 cursor-pointer ${
              activeTab === 'features'
                ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                : 'border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Feature Flags Core
          </button>
          <button 
            onClick={() => setActiveTab('qa')}
            className={`py-3 px-4 rounded-2xl border transition-all text-xs font-extrabold flex items-center justify-center gap-2.5 cursor-pointer ${
              activeTab === 'qa'
                ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                : 'border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Automação de Testes
          </button>
          <button 
            onClick={() => setActiveTab('deploy')}
            className={`py-3 px-4 rounded-2xl border transition-all text-xs font-extrabold flex items-center justify-center gap-2.5 cursor-pointer ${
              activeTab === 'deploy'
                ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                : 'border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            <Globe className="w-4 h-4" />
            Global Deploy Engine
          </button>
          <button 
            onClick={() => setActiveTab('bi')}
            className={`py-3 px-4 rounded-2xl border transition-all text-xs font-extrabold flex items-center justify-center gap-2.5 cursor-pointer ${
              activeTab === 'bi'
                ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                : 'border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            BI & Analytics
          </button>
          <button 
            onClick={() => setActiveTab('dw')}
            className={`py-3 px-4 rounded-2xl border transition-all text-xs font-extrabold flex items-center justify-center gap-2.5 cursor-pointer ${
              activeTab === 'dw'
                ? 'border-cyan-600 bg-cyan-600 text-white shadow-sm'
                : 'border-cyan-200 bg-white text-cyan-700 hover:bg-cyan-50'
            }`}
          >
            <Database className="w-4 h-4" />
            Data Warehouse
          </button>
          <button 
            onClick={() => setActiveTab('ai-cost')}
            className={`py-3 px-4 rounded-2xl border transition-all text-xs font-extrabold flex items-center justify-center gap-2.5 cursor-pointer ${
              activeTab === 'ai-cost'
                ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                : 'border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            <Coins className="w-4 h-4" />
            Otimização IA
          </button>
          <button 
            onClick={() => setActiveTab('disaster-recovery')}
            className={`py-3 px-4 rounded-2xl border transition-all text-xs font-extrabold flex items-center justify-center gap-2.5 cursor-pointer ${
              activeTab === 'disaster-recovery'
                ? 'border-rose-600 bg-rose-600 text-white shadow-sm animate-pulse'
                : 'border-rose-200 bg-white text-rose-700 hover:bg-rose-50'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Contingência DRP
          </button>
        </div>
      </div>

      {/* Tabs Navigation for Administration Configurations */}
      <div className="flex border-b border-slate-200 mb-6 gap-2 flex-wrap">
        <button 
          onClick={() => { setActiveTab('professores'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'professores' 
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Adicionar & Gerir Professores ({teachers.length})</span>
        </button>

        <button 
          onClick={() => { setActiveTab('turmas'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'turmas' 
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Criar e Gerir Turmas ({classes.length})</span>
        </button>

        <button 
          onClick={() => { setActiveTab('alunos'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'alunos' 
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gerir Alunos ({students.length})</span>
        </button>

        <button 
          onClick={() => { setActiveTab('permissoes'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'permissoes' 
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Acessos & Permissões ({emailPermissions.length})</span>
        </button>

        <button 
          onClick={() => { setActiveTab('seguranca'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'seguranca' 
              ? 'border-rose-600 text-rose-600 bg-rose-50/20' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4 text-rose-500" />
          <span>Security Center</span>
        </button>

        <button 
          onClick={() => { setActiveTab('backups'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'backups' 
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4 text-indigo-500" />
          <span>Backups & DR</span>
        </button>

        <button 
          onClick={() => { setActiveTab('disaster-recovery'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'disaster-recovery' 
              ? 'border-rose-600 text-rose-600 bg-rose-50/20' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <span>Contingência (DRP)</span>
        </button>

        <button 
          onClick={() => { setActiveTab('features'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'features' 
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4 text-indigo-500" />
          <span>Feature Flags</span>
        </button>

        <button 
          onClick={() => { setActiveTab('qa'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'qa' 
              ? 'border-emerald-600 text-emerald-600 bg-emerald-50/20' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4 text-emerald-500" />
          <span>Test Automation</span>
        </button>

        <button 
          onClick={() => { setActiveTab('deploy'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'deploy' 
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Globe className="w-4 h-4 text-indigo-500" />
          <span>Global Deployment</span>
        </button>

        <button 
          onClick={() => { setActiveTab('bi'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'bi' 
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart2 className="w-4 h-4 text-indigo-500" />
          <span>BI & Analytics</span>
        </button>

        <button 
          onClick={() => { setActiveTab('dw'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'dw' 
              ? 'border-cyan-600 text-cyan-600 bg-cyan-50/20' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4 text-cyan-500" />
          <span>Data Warehouse</span>
        </button>

        <button 
          onClick={() => { setActiveTab('ai-cost'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'ai-cost' 
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Coins className="w-4 h-4 text-indigo-500" />
          <span>Otimização IA</span>
        </button>
      </div>

      {/* ----------------- TAB: PROFESSORES ----------------- */}
      {activeTab === 'professores' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Adicionar & Gerir Professores</h3>
                <p className="text-xs text-slate-500">Cadastre novos professores pelo e-mail e atribua permissões de acesso às turmas.</p>
              </div>
              <button 
                onClick={() => {
                  setEditingTeacher(null);
                  setTeacherForm({ nome: '', email: '', telefone: '', idioma: 'Inglês', sala: '', turno: 'Manhã', allowedClassIds: [] });
                  setShowAddTeacherForm(!showAddTeacherForm);
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddTeacherForm ? 'Cancelar' : 'Adicionar Professor'}</span>
              </button>
            </div>

            {/* Expandable Teacher Form (Add / Edit) */}
            {(showAddTeacherForm || editingTeacher) && (
              <form onSubmit={editingTeacher ? handleUpdateTeacher : handleCreateTeacher} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6 animate-fadeIn">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200/60">
                  <span className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    {editingTeacher ? `Editando Professor: ${editingTeacher.nome}` : 'Registrar Novo Professor'}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowAddTeacherForm(false);
                      setEditingTeacher(null);
                      setTeacherForm({ nome: '', email: '', telefone: '', idioma: 'Inglês', sala: '', turno: 'Manhã', allowedClassIds: [] });
                    }} 
                    className="p-1 hover:bg-slate-200 rounded-full"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide mb-1.5">Nome Completo</label>
                    <input 
                      required 
                      value={teacherForm.nome} 
                      onChange={e => setTeacherForm({...teacherForm, nome: e.target.value})} 
                      placeholder="Ex: Prof. Carlos Santos" 
                      className="w-full text-xs p-3 border border-slate-200 bg-white rounded-xl focus:outline-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide mb-1.5">E-mail Profissional</label>
                    <input 
                      required 
                      type="email" 
                      value={teacherForm.email} 
                      onChange={e => setTeacherForm({...teacherForm, email: e.target.value})} 
                      placeholder="Ex: carlos.santos@escola.com" 
                      className="w-full text-xs p-3 border border-slate-200 bg-white rounded-xl focus:outline-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide mb-1.5">Telefone de Contato</label>
                    <input 
                      value={teacherForm.telefone} 
                      onChange={e => setTeacherForm({...teacherForm, telefone: e.target.value})} 
                      placeholder="Ex: +244 923 000 000" 
                      className="w-full text-xs p-3 border border-slate-200 bg-white rounded-xl focus:outline-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide mb-1.5">Disciplina / Idioma Alvo</label>
                    <select 
                      value={teacherForm.idioma} 
                      onChange={e => setTeacherForm({...teacherForm, idioma: e.target.value})} 
                      className="w-full text-xs p-3 border border-slate-200 bg-white rounded-xl focus:outline-indigo-600"
                    >
                      <option value="Inglês">Inglês</option>
                      <option value="Francês">Francês</option>
                      <option value="Espanhol">Espanhol</option>
                      <option value="Alemão">Alemão</option>
                      <option value="Munduruku">Munduruku (Kamba IA)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide mb-1.5">Sala Física ou Código</label>
                    <input 
                      value={teacherForm.sala} 
                      onChange={e => setTeacherForm({...teacherForm, sala: e.target.value})} 
                      placeholder="Ex: Bloco B - Sala 12" 
                      className="w-full text-xs p-3 border border-slate-200 bg-white rounded-xl focus:outline-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide mb-1.5">Turno letivo</label>
                    <select 
                      value={teacherForm.turno} 
                      onChange={e => setTeacherForm({...teacherForm, turno: e.target.value})} 
                      className="w-full text-xs p-3 border border-slate-200 bg-white rounded-xl focus:outline-indigo-600"
                    >
                      <option value="Manhã">Manhã</option>
                      <option value="Tarde">Tarde</option>
                      <option value="Noite">Noite</option>
                      <option value="Integral">Integral</option>
                    </select>
                  </div>
                </div>

                {/* Specific Class Permissions Checklist */}
                <div className="mb-6 p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/80">
                  <span className="block text-[11px] font-extrabold text-indigo-950 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Permissões de Turmas Específicas
                  </span>
                  <p className="text-xs text-slate-500 mb-3 font-medium">
                    Selecione quais turmas este professor tem permissão para administrar e visualizar dados de desempenho:
                  </p>
                  
                  {classes.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Nenhuma turma criada ainda. Crie turmas na aba correspondente primeiro.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {classes.map(cls => {
                        const isChecked = teacherForm.allowedClassIds?.includes(cls.id);
                        return (
                          <label 
                            key={cls.id} 
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              isChecked 
                                ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 shadow-3xs' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                const alreadySelected = teacherForm.allowedClassIds?.includes(cls.id);
                                const updated = alreadySelected
                                  ? teacherForm.allowedClassIds.filter(id => id !== cls.id)
                                  : [...(teacherForm.allowedClassIds || []), cls.id];
                                setTeacherForm({ ...teacherForm, allowedClassIds: updated });
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                            />
                            <div className="text-left">
                              <span className="block font-bold text-xs">{cls.name}</span>
                              <span className="block text-[10px] text-slate-400 font-medium">
                                {(cls.studentUids || []).length} alunos matriculados
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2.5">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowAddTeacherForm(false);
                      setEditingTeacher(null);
                      setTeacherForm({ nome: '', email: '', telefone: '', idioma: 'Inglês', sala: '', turno: 'Manhã', allowedClassIds: [] });
                    }} 
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Descartar
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Salvando...' : editingTeacher ? 'Atualizar Dados' : 'Gravar Professor'}
                  </button>
                </div>
              </form>
            )}

            {/* List of Registered Teachers */}
            <div className="space-y-4">
              {teachers.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-2xl bg-slate-50">
                  <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-500">Nenhum professor cadastrado ainda.</p>
                  <p className="text-xs text-slate-400 mt-1">Clique em "Adicionar Professor" no canto superior direito para começar.</p>
                </div>
              ) : (
                teachers.map(t => {
                  const assignedStudentsCount = students.filter(s => s.teacherUid === t.uid).length;
                  const teacherClasses = classes.filter(c => c.teacherUid === t.uid);
                  
                  return (
                    <div key={t.uid} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-all">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-800 text-base">{t.nome}</span>
                          <span className="text-[10px] font-extrabold bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase">
                            {t.idioma}
                          </span>
                          <span className="text-[10px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                            {t.turno} ({t.sala || 'Sem Sala'})
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            E-mail: {t.email}
                          </span>
                          {t.telefone && (
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                              Contato: {t.telefone}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            Alunos vinculados: <strong className="text-indigo-600">{assignedStudentsCount}</strong>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Turmas lecionadas: <strong className="text-emerald-600">{teacherClasses.length}</strong>
                          </span>
                          <span className="flex items-start gap-1.5 sm:col-span-2 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-slate-500">Permissões de Turmas:</span>
                              {t.allowedClassIds && t.allowedClassIds.length > 0 ? (
                                t.allowedClassIds.map(classId => {
                                  const classObj = classes.find(c => c.id === classId);
                                  return (
                                    <span key={classId} className="bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md px-2 py-0.5 text-[10px] font-bold">
                                      {classObj ? classObj.name : 'Turma Removida'}
                                    </span>
                                  );
                                })
                              ) : (
                                <strong className="text-amber-600">Nenhuma turma atribuída</strong>
                              )}
                            </div>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                        {/* Invitation code pill */}
                        <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-1.5 flex items-center gap-2 shadow-3xs">
                          <div className="text-left">
                            <span className="text-[9px] block text-slate-400 font-extrabold uppercase tracking-wider">Código de Acesso</span>
                            <span className="font-mono text-xs font-bold text-slate-700">{t.invitationCode}</span>
                          </div>
                          <button 
                            onClick={() => copyToClipboard(t.invitationCode, t.uid)}
                            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all cursor-pointer"
                            title="Copiar código de convite"
                          >
                            {copiedCodeId === t.uid ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {/* Edit Action */}
                        <button
                          onClick={() => {
                            setEditingTeacher(t);
                            setTeacherForm({
                              nome: t.nome,
                              email: t.email,
                              telefone: t.telefone,
                              idioma: t.idioma,
                              sala: t.sala,
                              turno: t.turno,
                              allowedClassIds: t.allowedClassIds || []
                            });
                            setShowAddTeacherForm(false);
                            window.scrollTo({ top: 400, behavior: 'smooth' });
                          }}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl border border-transparent hover:border-amber-100 transition-all cursor-pointer"
                          title="Editar professor"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Delete Action */}
                        <button
                          onClick={() => handleDeleteTeacher(t.uid, t.nome)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                          title="Excluir professor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

      {/* ----------------- TAB: TURMAS ----------------- */}
      {activeTab === 'turmas' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Configuração de Turmas Escolares</h3>
                <p className="text-xs text-slate-500">Forme turmas, defina os professores orientadores e gerencie a lista de alunos matriculados.</p>
              </div>
              <button 
                onClick={() => {
                  setEditingClass(null);
                  setNewClassName('');
                  setSelectedTeacherUid('');
                  setShowAddClassForm(!showAddClassForm);
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddClassForm ? 'Cancelar' : 'Nova Turma'}</span>
              </button>
            </div>

            {/* Expandable Class Form */}
            {(showAddClassForm || editingClass) && (
              <form onSubmit={editingClass ? handleUpdateClass : handleCreateClass} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6 animate-fadeIn">
                <span className="block font-bold text-sm text-slate-800 mb-4 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  {editingClass ? `Editando Turma: ${editingClass.name}` : 'Criar Nova Turma'}
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide mb-1.5">Nome da Turma</label>
                    <input 
                      required
                      value={newClassName} 
                      onChange={e => setNewClassName(e.target.value)} 
                      placeholder="Ex: 8º Ano A - Avançado" 
                      className="w-full text-xs p-3 border border-slate-200 bg-white rounded-xl focus:outline-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide mb-1.5">Professor Responsável (Tutor)</label>
                    <select 
                      required
                      value={selectedTeacherUid} 
                      onChange={e => setSelectedTeacherUid(e.target.value)} 
                      className="w-full text-xs p-3 border border-slate-200 bg-white rounded-xl focus:outline-indigo-600"
                    >
                      <option value="">Selecione um Professor</option>
                      {teachers.map(t => <option key={t.uid} value={t.uid}>{t.nome} ({t.idioma})</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowAddClassForm(false);
                      setEditingClass(null);
                      setNewClassName('');
                      setSelectedTeacherUid('');
                    }} 
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Descartar
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Salvando...' : editingClass ? 'Salvar Edição' : 'Criar Turma'}
                  </button>
                </div>
              </form>
            )}

            {/* List of School Classes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.length === 0 ? (
                <div className="col-span-full text-center py-12 border border-dashed rounded-2xl bg-slate-50">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-500">Nenhuma turma criada ainda.</p>
                  <p className="text-xs text-slate-400 mt-1">Crie turmas clicando no botão no topo direito.</p>
                </div>
              ) : (
                classes.map(c => {
                  const classTeacher = teachers.find(t => t.uid === c.teacherUid);
                  const enrolledStudents = students.filter(s => c.studentUids?.includes(s.uid));
                  const isManaging = managingClassEnrollment?.id === c.id;

                  return (
                    <div key={c.id} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between hover:bg-slate-50 transition-all">
                      <div>
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <span className="font-extrabold text-slate-800 text-base">{c.name}</span>
                          <span className="text-[10px] font-extrabold bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">
                            {enrolledStudents.length} Alunos
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 font-medium mb-4 space-y-1">
                          <p>
                            Professor Responsável: <strong className="text-slate-700">{classTeacher ? classTeacher.nome : 'Nenhum'}</strong>
                          </p>
                          {classTeacher && (
                            <p className="text-[10px] text-slate-400 font-mono">
                              Disciplina: {classTeacher.idioma} ({classTeacher.turno})
                            </p>
                          )}
                        </div>

                        {/* List of enrolled student names */}
                        {enrolledStudents.length > 0 && (
                          <div className="mb-4 bg-white/70 rounded-xl p-3 border border-slate-100">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block mb-1.5">Alunos Matriculados:</span>
                            <div className="flex flex-wrap gap-1">
                              {enrolledStudents.map(st => (
                                <span key={st.uid} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                  {st.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Interactive Student Enrollment Panel Drawer */}
                      {isManaging && (
                        <div className="my-4 p-4 bg-white rounded-xl border border-indigo-100 animate-slideDown">
                          <div className="flex items-center justify-between mb-3 border-b pb-2">
                            <span className="text-xs font-bold text-slate-800">Matricular Alunos na Turma</span>
                            <button 
                              onClick={() => setManagingClassEnrollment(null)}
                              className="text-[10px] font-bold text-indigo-600 hover:underline"
                            >
                              Concluído
                            </button>
                          </div>
                          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                            {students.length === 0 ? (
                              <p className="text-[10px] text-slate-400">Nenhum aluno cadastrado no sistema para matricular.</p>
                            ) : (
                              students.map(st => {
                                const isEnrolled = c.studentUids?.includes(st.uid);
                                return (
                                  <div 
                                    key={st.uid} 
                                    onClick={() => handleToggleStudentInClass(c, st.uid)}
                                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                                      isEnrolled ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50/30 border-slate-100 hover:bg-slate-50'
                                    }`}
                                  >
                                    <span className="text-xs font-semibold text-slate-700">{st.name} ({st.targetLanguage})</span>
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isEnrolled ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                                      {isEnrolled && <Check className="w-3 h-3" />}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-slate-100/60 pt-3 mt-2">
                        <button
                          onClick={() => setManagingClassEnrollment(isManaging ? null : c)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-all cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Gerir Alunos</span>
                        </button>

                        <div className="flex items-center gap-2">
                          {/* Edit Action */}
                          <button
                            onClick={() => {
                              setEditingClass(c);
                              setNewClassName(c.name);
                              setSelectedTeacherUid(c.teacherUid);
                              setShowAddClassForm(false);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg border border-transparent hover:border-amber-100 transition-all cursor-pointer"
                            title="Editar nome/tutor"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Action */}
                          <button
                            onClick={() => handleDeleteClass(c.id, c.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                            title="Excluir turma"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

      {/* ----------------- TAB: ALUNOS ----------------- */}
      {activeTab === 'alunos' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Gerenciamento Geral de Alunos</h3>
                <p className="text-xs text-slate-500">Cadastre novos alunos, defina seus idiomas-alvo e associe-os com professores orientadores.</p>
              </div>
              
              <button 
                onClick={() => {
                  setEditingStudent(null);
                  setStudentForm({ name: '', age: '', targetLanguage: 'Inglês', teacherUid: '' });
                  setShowAddStudentForm(!showAddStudentForm);
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddStudentForm ? 'Cancelar' : 'Adicionar Aluno'}</span>
              </button>
            </div>

            {/* Expandable Student Registration Form */}
            {(showAddStudentForm || editingStudent) && (
              <form onSubmit={editingStudent ? handleUpdateStudent : handleCreateStudent} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6 animate-fadeIn">
                <span className="block font-bold text-sm text-slate-800 mb-4 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  {editingStudent ? `Editando Aluno: ${editingStudent.name}` : 'Cadastrar Novo Aluno'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide mb-1.5">Nome Completo</label>
                    <input 
                      required
                      value={studentForm.name} 
                      onChange={e => setStudentForm({...studentForm, name: e.target.value})} 
                      placeholder="Ex: Clara Mendes Oliveira" 
                      className="w-full text-xs p-3 border border-slate-200 bg-white rounded-xl focus:outline-indigo-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide mb-1.5">Idade</label>
                    <input 
                      required
                      type="number"
                      value={studentForm.age} 
                      onChange={e => setStudentForm({...studentForm, age: e.target.value})} 
                      placeholder="Ex: 14" 
                      className="w-full text-xs p-3 border border-slate-200 bg-white rounded-xl focus:outline-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide mb-1.5">Idioma Alvo de Estudo</label>
                    <select 
                      value={studentForm.targetLanguage} 
                      onChange={e => setStudentForm({...studentForm, targetLanguage: e.target.value})} 
                      className="w-full text-xs p-3 border border-slate-200 bg-white rounded-xl focus:outline-indigo-600"
                    >
                      <option value="Inglês">Inglês</option>
                      <option value="Francês">Francês</option>
                      <option value="Espanhol">Espanhol</option>
                      <option value="Alemão">Alemão</option>
                      <option value="Munduruku">Munduruku (Kamba IA)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide mb-1.5">Tutor Responsável</label>
                    <select 
                      value={studentForm.teacherUid} 
                      onChange={e => setStudentForm({...studentForm, teacherUid: e.target.value})} 
                      className="w-full text-xs p-3 border border-slate-200 bg-white rounded-xl focus:outline-indigo-600"
                    >
                      <option value="">Nenhum / Selecione um Professor</option>
                      {teachers.map(t => <option key={t.uid} value={t.uid}>{t.nome} ({t.idioma})</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowAddStudentForm(false);
                      setEditingStudent(null);
                      setStudentForm({ name: '', age: '', targetLanguage: 'Inglês', teacherUid: '' });
                    }} 
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Descartar
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Salvando...' : editingStudent ? 'Salvar Edição' : 'Cadastrar Aluno'}
                  </button>
                </div>
              </form>
            )}

            {/* Student Search and Filters toolbar */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Pesquise por nome do aluno..." 
                  className="w-full text-xs pl-10 pr-4 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-indigo-600"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select 
                  value={filterLanguage}
                  onChange={e => setFilterLanguage(e.target.value)}
                  className="text-xs p-2.5 border border-slate-200 bg-white rounded-xl focus:outline-indigo-600 cursor-pointer"
                >
                  <option value="">Todos Idiomas</option>
                  <option value="Inglês">Inglês</option>
                  <option value="Francês">Francês</option>
                  <option value="Espanhol">Espanhol</option>
                  <option value="Alemão">Alemão</option>
                  <option value="Munduruku">Munduruku</option>
                </select>

                <select 
                  value={filterTeacher}
                  onChange={e => setFilterTeacher(e.target.value)}
                  className="text-xs p-2.5 border border-slate-200 bg-white rounded-xl focus:outline-indigo-600 cursor-pointer"
                >
                  <option value="">Todos Tutores</option>
                  {teachers.map(t => <option key={t.uid} value={t.uid}>{t.nome}</option>)}
                </select>

                {(searchQuery || filterLanguage || filterTeacher) && (
                  <button 
                    onClick={() => { setSearchQuery(''); setFilterLanguage(''); setFilterTeacher(''); }}
                    className="text-xs text-indigo-600 font-bold hover:underline py-2 px-3"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>
            </div>

            {/* List of Students Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.length === 0 ? (
                <div className="col-span-full text-center py-12 border border-dashed rounded-2xl bg-slate-50">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-500">Nenhum aluno encontrado.</p>
                  <p className="text-xs text-slate-400 mt-1">Insira um novo aluno acima ou refine seus parâmetros de busca.</p>
                </div>
              ) : (
                filteredStudents.map(st => {
                  const tutor = teachers.find(t => t.uid === st.teacherUid);
                  
                  return (
                    <div key={st.uid} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between hover:bg-slate-50 transition-all">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-extrabold text-slate-800 text-sm">{st.name}</span>
                          <span className="text-[9px] font-extrabold bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase">
                            {st.targetLanguage}
                          </span>
                        </div>
                        
                        <div className="text-[11px] text-slate-500 space-y-1">
                          <p className="font-medium">Idade: <span className="text-slate-700 font-bold">{st.age} anos</span></p>
                          <p className="font-medium">
                            Tutor: <span className="text-indigo-600 font-bold">{tutor ? tutor.nome : 'Sem tutor associado'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-1.5 border-t border-slate-100/60 pt-2.5 mt-3">
                        {/* Edit Student */}
                        <button
                          onClick={() => {
                            setEditingStudent(st);
                            setStudentForm({
                              name: st.name,
                              age: String(st.age),
                              targetLanguage: st.targetLanguage,
                              teacherUid: st.teacherUid || ""
                            });
                            setShowAddStudentForm(false);
                            window.scrollTo({ top: 400, behavior: 'smooth' });
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg border border-transparent hover:border-amber-100 transition-all cursor-pointer"
                          title="Editar aluno"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Student */}
                        <button
                          onClick={() => handleDeleteStudent(st.uid, st.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                          title="Excluir aluno"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

      {activeTab === 'permissoes' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Permissões de Acesso & Novo Cadastro</h3>
                <p className="text-xs text-slate-500">
                  Gerencie permissões baseadas em e-mail. Quando o usuário fizer login com o Google, o sistema aplicará a permissão pré-definida de forma automática.
                </p>
              </div>
              
              <button 
                onClick={() => {
                  setShowAddPermissionForm(!showAddPermissionForm);
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddPermissionForm ? 'Cancelar' : 'Nova Permissão/Cadastro'}</span>
              </button>
            </div>

            {/* EXPANDABLE UNIFIED FORM */}
            {showAddPermissionForm && (
              <form onSubmit={handleCreateEmailPermission} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6 animate-fadeIn space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                  <span className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Adicionar Permissão Baseada em E-mail com Cadastro Opcional
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setShowAddPermissionForm(false)} 
                    className="p-1 hover:bg-slate-200 rounded-full"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>

                {/* Grid 1: Basic Access Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide mb-1.5">Nome do Usuário</label>
                    <input 
                      required
                      type="text"
                      value={permissionForm.name} 
                      onChange={e => setPermissionForm({...permissionForm, name: e.target.value})} 
                      placeholder="Ex: Clara Mendes Oliveira" 
                      className="w-full text-xs p-3 border border-slate-200 bg-white rounded-xl focus:outline-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide mb-1.5">E-mail para Permissão</label>
                    <input 
                      required
                      type="email"
                      value={permissionForm.email} 
                      onChange={e => setPermissionForm({...permissionForm, email: e.target.value})} 
                      placeholder="Ex: clara.mendes@escola.com" 
                      className="w-full text-xs p-3 border border-slate-200 bg-white rounded-xl focus:outline-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide mb-1.5">Permissão de Acesso (Papel)</label>
                    <select 
                      value={permissionForm.role} 
                      onChange={e => setPermissionForm({...permissionForm, role: e.target.value as any})} 
                      className="w-full text-xs p-3 border border-slate-200 bg-white rounded-xl focus:outline-indigo-600 font-bold text-indigo-700"
                    >
                      <option value="Student font-bold">Estudante (Student)</option>
                      <option value="Educator">Educador (Educator)</option>
                      <option value="Admin">Administrador (Admin)</option>
                    </select>
                  </div>
                </div>

                {/* User Type & Automatic Firestore Registration Options */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/60">
                  <span className="block text-xs font-bold text-slate-700 mb-2">Sincronizar e Cadastrar no Firestore como:</span>
                  <div className="flex gap-4 flex-wrap">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                      <input 
                        type="radio" 
                        name="userType" 
                        value="only_permission"
                        checked={permissionForm.userType === 'only_permission'}
                        onChange={() => setPermissionForm({...permissionForm, userType: 'only_permission'})}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      Apenas Permissão de E-mail (Sem cadastro complementar)
                    </label>

                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                      <input 
                        type="radio" 
                        name="userType" 
                        value="teacher"
                        checked={permissionForm.userType === 'teacher'}
                        onChange={() => setPermissionForm({...permissionForm, userType: 'teacher', role: 'Educator'})}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      Professor (Adiciona à tabela de professores)
                    </label>

                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                      <input 
                        type="radio" 
                        name="userType" 
                        value="student"
                        checked={permissionForm.userType === 'student'}
                        onChange={() => setPermissionForm({...permissionForm, userType: 'student', role: 'Student'})}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      Estudante (Adiciona à tabela de alunos)
                    </label>
                  </div>
                </div>

                {/* Dependent Fields - Teacher Form */}
                {permissionForm.userType === 'teacher' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-indigo-50/30 rounded-xl border border-indigo-100 animate-fadeIn font-sans">
                    <div className="col-span-full">
                      <h4 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wide">Informações Adicionais do Professor</h4>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Telefone de Contato</label>
                      <input 
                        value={permissionForm.telefone} 
                        onChange={e => setPermissionForm({...permissionForm, telefone: e.target.value})} 
                        placeholder="Ex: +244 923 000 000" 
                        className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-xl focus:outline-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Disciplina / Idioma</label>
                      <select 
                        value={permissionForm.targetLanguage} 
                        onChange={e => setPermissionForm({...permissionForm, targetLanguage: e.target.value})} 
                        className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-xl focus:outline-indigo-600"
                      >
                        <option value="Inglês">Inglês</option>
                        <option value="Francês">Francês</option>
                        <option value="Espanhol">Espanhol</option>
                        <option value="Alemão">Alemão</option>
                        <option value="Munduruku">Munduruku (Kamba IA)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sala de Aula</label>
                      <input 
                        value={permissionForm.sala} 
                        onChange={e => setPermissionForm({...permissionForm, sala: e.target.value})} 
                        placeholder="Ex: Sala B-10" 
                        className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-xl focus:outline-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Turno</label>
                      <select 
                        value={permissionForm.turno} 
                        onChange={e => setPermissionForm({...permissionForm, turno: e.target.value})} 
                        className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-xl focus:outline-indigo-600"
                      >
                        <option value="Manhã">Manhã</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Noite">Noite</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Dependent Fields - Student Form */}
                {permissionForm.userType === 'student' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-indigo-50/30 rounded-xl border border-indigo-100 animate-fadeIn font-sans">
                    <div className="col-span-full">
                      <h4 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wide">Informações Adicionais do Estudante</h4>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Idade</label>
                      <input 
                        type="number"
                        value={permissionForm.age} 
                        onChange={e => setPermissionForm({...permissionForm, age: e.target.value})} 
                        placeholder="Ex: 14" 
                        className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-xl focus:outline-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Idioma de Estudo</label>
                      <select 
                        value={permissionForm.targetLanguage} 
                        onChange={e => setPermissionForm({...permissionForm, targetLanguage: e.target.value})} 
                        className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-xl focus:outline-indigo-600"
                      >
                        <option value="Inglês">Inglês</option>
                        <option value="Francês">Francês</option>
                        <option value="Espanhol">Espanhol</option>
                        <option value="Alemão">Alemão</option>
                        <option value="Munduruku">Munduruku (Kamba IA)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tutor Orientador</label>
                      <select 
                        value={permissionForm.teacherUid} 
                        onChange={e => setPermissionForm({...permissionForm, teacherUid: e.target.value})} 
                        className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-xl focus:outline-indigo-600"
                      >
                        <option value="">Nenhum tutor associado</option>
                        {teachers.map(t => <option key={t.uid} value={t.uid}>{t.nome} ({t.idioma})</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2.5">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowAddPermissionForm(false);
                      setPermissionForm({
                        email: '',
                        role: 'Educator',
                        userType: 'teacher',
                        name: '',
                        age: '',
                        targetLanguage: 'Inglês',
                        teacherUid: '',
                        telefone: '',
                        sala: '',
                        turno: 'Manhã'
                      });
                    }} 
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Descartar
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Salvando...' : 'Cadastrar e Autorizar'}
                  </button>
                </div>
              </form>
            )}

            {/* LIST OF PERMISSIONS */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wide">
                    <th className="py-3 px-4">Nome</th>
                    <th className="py-3 px-4">E-mail</th>
                    <th className="py-3 px-4">Permissão / Papel</th>
                    <th className="py-3 px-4">Data de Cadastro</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {emailPermissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400 font-medium">
                        Nenhuma permissão personalizada configurada. Todos os novos logins sem regra herdarão a permissão padrão "Estudante".
                      </td>
                    </tr>
                  ) : (
                    emailPermissions.map((p) => (
                      <tr key={p.email} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-800">{p.name || 'Usuário Pré-autorizado'}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{p.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase ${
                            p.role === 'Admin' 
                              ? 'bg-rose-50 border-rose-100 text-rose-700' 
                              : p.role === 'Educator'
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                              : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                          }`}>
                            {p.role === 'Admin' ? 'Administrador' : p.role === 'Educator' ? 'Educador' : 'Estudante'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {p.registeredAt ? new Date(p.registeredAt).toLocaleDateString('pt-BR') : '---'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteEmailPermission(p.email)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                            title="Revogar permissão"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'seguranca' && (
        <SecurityDashboard />
      )}

      {activeTab === 'backups' && (
        <BackupDashboard />
      )}

      {activeTab === 'disaster-recovery' && (
        <DisasterRecovery />
      )}

      {activeTab === 'features' && (
        <FeatureFlagDashboard />
      )}

      {activeTab === 'qa' && (
        <div className="space-y-8" id="qa-diagnostics-container">
          <TestAutomationDashboard />
          <NotificationDiagnostic />
        </div>
      )}

      {activeTab === 'deploy' && (
        <GlobalDeploymentDashboard />
      )}

      {activeTab === 'bi' && (
        <BusinessIntelligenceDashboard />
      )}

      {activeTab === 'dw' && (
        <DataWarehouseDashboard />
      )}

      {activeTab === 'ai-cost' && (
        <AICostOptimizationDashboard />
      )}

      {/* Audit Action Log Panel */}
      <UsageLogs />
    </div>
  );
}

// Compact helper metric card
const MetricCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs flex items-center gap-3.5">
    <div className="p-2.5 bg-slate-50 rounded-xl">{icon}</div>
    <div>
      <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wide">{title}</p>
      <p className="text-xl font-extrabold text-slate-900">{value}</p>
    </div>
  </div>
);
