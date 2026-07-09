import React, { useState } from 'react';
import { 
  Building, BookOpen, Users, UserPlus, GraduationCap, 
  Clock, BookCheck, ClipboardList, CalendarDays, Award, 
  DollarSign, FileText, Settings, Settings2, Sparkles, 
  TrendingUp, BarChart2, PieChart, MessageSquare, Phone, 
  Mail, Bell, AlertTriangle, CheckCircle2, Download, 
  RefreshCw, Search, Plus, Trash, Eye, Shield, Share2, HelpCircle
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, 
  PieChart as RePieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { getAtRiskStudents } from '../../../lib/schoolAnalytics';
import { GeographicIntelligenceMap } from './WorldMapVisualization';

// --- TYPES & INTERFACES ---
interface Teacher {
  id: string;
  name: string;
  photo: string;
  dept: string;
  subjects: string[];
  languages: string[];
  classes: string[];
  hours: number;
  rating: number;
  email: string;
}

interface Student {
  id: string;
  name: string;
  photo: string;
  classId: string;
  year: number;
  course: string;
  languages: string[];
  level: string;
  xp: number;
  attendance: number;
  grade: number;
}

interface SchoolClass {
  id: string;
  name: string;
  director: string;
  studentsCount: number;
  subjects: string[];
  performance: number;
  aiUsage: number;
}

// --- SEED DATA ---
const initialTeachers: Teacher[] = [
  { id: 't1', name: 'Dra. Maria Neto', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', dept: 'Línguas Estrangeiras', subjects: ['Inglês', 'Português'], languages: ['Inglês', 'Português'], classes: ['7A', '8B'], hours: 22, rating: 4.9, email: 'maria.neto@lingolive.ai' },
  { id: 't2', name: 'Prof. António Gonga', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', dept: 'Línguas Modernas', subjects: ['Francês', 'História'], languages: ['Francês'], classes: ['9A', '10C'], hours: 18, rating: 4.7, email: 'antonio.gonga@lingolive.ai' },
  { id: 't3', name: 'Sra. Sofia Cassinda', photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', dept: 'Ciências Humanas', subjects: ['Chinês', 'Português'], languages: ['Chinês', 'Mandarim'], classes: ['8A', '9B'], hours: 20, rating: 4.8, email: 'sofia.cassinda@lingolive.ai' },
];

const initialStudents: Student[] = [
  { id: 's1', name: 'Helder de Sousa', photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', classId: '7A', year: 7, course: 'Kids Booster', languages: ['Inglês'], level: 'A2', xp: 1250, attendance: 96, grade: 85 },
  { id: 's2', name: 'Aline Cassinda', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', classId: '8B', year: 8, course: 'Teens Pro', languages: ['Francês'], level: 'B1', xp: 950, attendance: 92, grade: 78 },
  { id: 's3', name: 'Emanuel Neto', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', classId: '7A', year: 7, course: 'Adults Express', languages: ['Chinês'], level: 'A1', xp: 1540, attendance: 98, grade: 92 },
  { id: 's4', name: 'Beatriz Gonga', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', classId: '9A', year: 9, course: 'Global Speaker', languages: ['Inglês', 'Francês'], level: 'B2', xp: 2100, attendance: 95, grade: 88 },
  { id: 's5', name: 'Avelino Neto', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', classId: '8B', year: 8, course: 'Teens Pro', languages: ['Inglês'], level: 'A2', xp: 420, attendance: 74, grade: 62 },
  { id: 's6', name: 'Suzana Diogo', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', classId: '8B', year: 8, course: 'Teens Pro', languages: ['Inglês'], level: 'B1', xp: 600, attendance: 92, grade: 58 },
  { id: 's7', name: 'Carlos de Sousa', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', classId: '7A', year: 7, course: 'Kids Booster', languages: ['Inglês'], level: 'A2', xp: 810, attendance: 82, grade: 71 },
];

const initialClasses: SchoolClass[] = [
  { id: 'c1', name: 'Turma 7A', director: 'Dra. Maria Neto', studentsCount: 28, subjects: ['Inglês', 'Português'], performance: 84, aiUsage: 450 },
  { id: 'c2', name: 'Turma 8B', director: 'Sra. Sofia Cassinda', studentsCount: 24, subjects: ['Inglês', 'Francês'], performance: 79, aiUsage: 380 },
  { id: 'c3', name: 'Turma 9A', director: 'Prof. António Gonga', studentsCount: 32, subjects: ['Francês', 'Chinês'], performance: 82, aiUsage: 512 },
];

// --- CHARTS DATA ---
const evolutionData = [
  { name: 'Período 1', frequencia: 91, mediaGeral: 78, sessoesIA: 1800 },
  { name: 'Período 2', frequencia: 93, mediaGeral: 80, sessoesIA: 2600 },
  { name: 'Período 3', frequencia: 94, mediaGeral: 81, sessoesIA: 3412 },
];

const cefrData = [
  { name: 'A1 (Iniciante)', value: 420 },
  { name: 'A2 (Básico)', value: 380 },
  { name: 'B1 (Intermédio)', value: 250 },
  { name: 'B2 (Independente)', value: 120 },
  { name: 'C1/C2 (Avançado)', value: 78 },
];

const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const SchoolManagement: React.FC = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  // Role-Based Access Control Switcher
  const [rbacRole, setRbacRole] = useState<string>('Diretor');

  // Geolocation simulation state
  const [selectedGeoRegion, setSelectedGeoRegion] = useState<string>('Moçambique');
  
  // Interactive entities states
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [classes, setClasses] = useState<SchoolClass[]>(initialClasses);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Syncing states & Toast notifications
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [toasts, setToasts] = useState<string[]>([]);
  
  // Custom states for Academico module
  const [activeYear, setActiveYear] = useState('2026');
  const [activePeriod, setActivePeriod] = useState('3º Trimestre');
  
  // AI Interactive Tools
  const [teacherPrompt, setTeacherPrompt] = useState('Cria um teste para turma 8.º ano sobre Present Perfect.');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedAIInsight, setSelectedAIInsight] = useState<string | null>(null);
  const [atRiskFilter, setAtRiskFilter] = useState<'all' | 'critical' | 'warning'>('all');
  const [selectedAtRiskStudent, setSelectedAtRiskStudent] = useState<any | null>(null);
  const [selectedClassTrend, setSelectedClassTrend] = useState<string>('all');
  
  // Financial metrics
  const [licenseKey, setLicenseKey] = useState('LL-ENT-992-2026');
  
  // Helper for toasts
  const addToast = (msg: string) => {
    setToasts(prev => [msg, ...prev].slice(0, 4));
    setTimeout(() => {
      setToasts(prev => prev.slice(0, -1));
    }, 4000);
  };

  // Sync animation simulation
  const triggerSync = (section: string) => {
    setIsSyncing(section);
    setTimeout(() => {
      setIsSyncing(null);
      addToast(`Sincronização de ${section} concluída com sucesso com os servidores LingoLIVE!`);
    }, 1500);
  };

  // Handles adding quick items
  const handleAddTeacher = () => {
    const name = prompt("Nome do Professor:");
    if (!name) return;
    const email = prompt("Email:");
    const language = prompt("Idioma Principal (ex: Inglês, Francês, Chinês):") || "Inglês";
    const newProf: Teacher = {
      id: `t_${Date.now()}`,
      name,
      photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      dept: 'Línguas',
      subjects: [language],
      languages: [language],
      classes: ['7A'],
      hours: 20,
      rating: 5.0,
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@lingolive.ai`
    };
    setTeachers(prev => [newProf, ...prev]);
    addToast(`Professor(a) ${name} cadastrado e credenciais sincronizadas!`);
  };

  const handleAddStudent = () => {
    const name = prompt("Nome do Aluno:");
    if (!name) return;
    const targetClass = prompt("Turma (ex: 7A, 8B):") || "7A";
    const newStudent: Student = {
      id: `s_${Date.now()}`,
      name,
      photo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      classId: targetClass,
      year: 7,
      course: 'Regular Path',
      languages: ['Inglês'],
      level: 'A1',
      xp: 100,
      attendance: 100,
      grade: 80
    };
    setStudents(prev => [newStudent, ...prev]);
    addToast(`Aluno ${name} importado para a turma ${targetClass}!`);
  };

  // Run Gemini/Local generator for tests
  const handleGenerateAITest = () => {
    setIsGenerating(true);
    setTimeout(() => {
      let formattedResponse = '';
      if (selectedGeoRegion.toLowerCase() === 'moçambique') {
        formattedResponse = `
📝 ASSISTENTE DE IA LINGOLIVE (CONECTADO: MOÇAMBIQUE 🇲🇿)
Tema de Adaptação Regional: Intercâmbio Cultural e Corporativo em Maputo e Beira
Nível CEFR: A2/B1 | Alinhado ao Currículo Nacional de Moçambique

PARTE A: Compreensão de Leitura e Vocabulário de Negócios
1. O Porto de Maputo serve como um corredor logístico estratégico. Complete a frase:
   "The port authorities ______ (already/modernize) the terminal equipment to increase efficiency."
   a) have already modernized (CORRETA)
   b) already modernized
   c) has already modernized

PARTE B: Expressão Oral Adaptada (Simulação com Tutor IA)
Tópico de Conversação Prática: "Recebendo um parceiro comercial internacional no Aeroporto de Mavalane"
- Expressão Local sugerida: "Estamos juntos" (Traduzida como: "We are in this together").
- Tarefa de Áudio: O aluno deve gravar um áudio de 45 segundos explicando as direções até a Baixa de Maputo usando o Present Perfect.

PARTE C: Rubrica de Avaliação Pedagógica Sugerida:
- Excelente (90-100%): Uso correto do Present Perfect Simple + vocabulário logístico e turístico básico.
- Bom (75-89%): Fluência aceitável com pequenos erros de pronúncia.
- Atenção (<70%): Confunde Past Simple com Present Perfect ao descrever eventos passados concluídos.

💡 DIRETIVA DE INTELIGÊNCIA IA:
"Alunos de Moçambique respondem muito bem a simulações práticas com fones de ouvido devido à grande poluição sonora urbana. Considere aplicar este teste em ambiente controlado."
`;
      } else if (selectedGeoRegion.toLowerCase() === 'angola') {
        formattedResponse = `
📝 ASSISTENTE DE IA LINGOLIVE (CONECTADO: ANGOLA 🇦🇴)
Tema de Adaptação Regional: Recursos Naturais e Cultura Semba (Luanda e Lobito)
Nível CEFR: A2/B1 | Alinhado às Diretrizes Curriculares de Angola

PARTE A: Gramática Aplicada
1. She ______ (never/visit) Angola before this trip.
   a) has never visited (CORRETA)
   b) never visited
   c) have never visited

PARTE B: Preenchimento de Lacunas (Contextualizado)
2. They have lived in Luanda ______ 2018. (since/for) -> Resposta: since
3. We have already ______ (write) our Portuguese essay about the Kalandula Falls. -> Resposta: written

PARTE C: Atividade Oral Sugerida:
- Apresentar em inglês um resumo de 2 minutos sobre a diversidade musical de Angola (Semba e Kizomba) utilizando verbos no Present Perfect.

💡 DIRETIVA DE INTELIGÊNCIA IA:
"Excelente desempenho em fonética e audição. Sugerido focar exercícios na escrita de verbos irregulares complexos."
`;
      } else if (selectedGeoRegion.toLowerCase() === 'brasil') {
        formattedResponse = `
📝 ASSISTENTE DE IA LINGOLIVE (CONECTADO: BRASIL 🇧🇷)
Tema de Adaptação Regional: Mercado Tecnológico e Hubs de Inovação de São Paulo
Nível CEFR: B2 | Foco em Inglês para Negócios Internacionais

PARTE A: Vocabulário Corporativo
1. "The tech startup ______ (pitch) their project to five international venture capitalists this week."
   a) has pitched (CORRETA)
   b) pitched
   c) have pitched

PARTE B: Prática de Conversação (Roleplay)
Cenário: Uma reunião rápida de alinhamento (Daily Standup) em uma multinacional com sede na Berrini.
- Prática: "Discussing blockers and achievements using Present Perfect."

PARTE C: Insight Pedagógico:
- Alunos brasileiros possuem excelente fluência e vocabulário passivo, mas frequentemente negligenciam o uso do auxiliar "has/have" na fala espontânea.
`;
      } else if (selectedGeoRegion.toLowerCase() === 'portugal') {
        formattedResponse = `
📝 ASSISTENTE DE IA LINGOLIVE (CONECTADO: PORTUGAL 🇵🇹)
Tema de Adaptação Regional: Turismo Europeu e Intercâmbio Acadêmico (Lisboa e Porto)
Nível CEFR: B1 | Foco em Exames Globais de Proficiência

PARTE A: Gramática e Acordo Ortográfico
1. "Many Erasmus students ______ (choose) Lisbon as their destination because of its cultural heritage."
   a) have chosen (CORRETA)
   b) chose
   c) has chosen

PARTE B: Simulação Oral
Cenário: Guiando turistas pela zona histórica de Alfama ou Ribeira do Porto.
- Prática: Descrever o que "has changed" na cidade nos últimos dez anos.

PARTE C: Diretiva Curricular:
- Alinhamento estrito com os descritores do Quadro Europeu Comum de Referência (QECR).
`;
      } else {
        formattedResponse = `
📝 ASSISTENTE DE IA LINGOLIVE (CONECTADO: ${selectedGeoRegion.toUpperCase()})
Nível Estimado: CEFR A2/B1 | Disciplina: Inglês Geral

PARTE A: Exercício Prático
1. We ______ (study) English with the virtual tutor for three months.
   a) have studied (CORRETA)
   b) studied
   c) has studied

PARTE B: Diretiva Global de Ensino
Adaptação geral de conversação ativa para alunos internacionais.
`;
      }
      setAiResponse(formattedResponse);
      setIsGenerating(false);
      addToast(`Exercício localizado para a região ${selectedGeoRegion} criado com sucesso!`);
    }, 1200);
  };

  // Menu Definition based on RBAC Permissions
  // Super Admin/Diretor sees everything. Student/Teacher restricted.
  const hasAccess = (tabName: string) => {
    if (['Super Admin', 'Administrador Global', 'Administrador Escola', 'Diretor', 'Coordenador'].includes(rbacRole)) {
      return true;
    }
    if (rbacRole === 'Professor') {
      return ['dashboard', 'professores', 'alunos', 'ia-professores', 'biblioteca', 'comunicacao'].includes(tabName);
    }
    if (rbacRole === 'Aluno') {
      return ['dashboard', 'alunos', 'biblioteca', 'comunicacao'].includes(tabName);
    }
    if (rbacRole === 'Encarregado') {
      return ['dashboard', 'pais', 'comunicacao'].includes(tabName);
    }
    return false;
  };

  // Filter list for general modules
  const filteredTeachers = teachers.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.email.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.course.toLowerCase().includes(searchQuery.toLowerCase()));

  // Call analytics helper to compute at-risk pedagogical alerts
  const computedAlerts = getAtRiskStudents(students);
  const activeAlerts = computedAlerts.filter(st => {
    const matchesClass = selectedClassTrend === 'all' || st.classId === selectedClassTrend;
    const matchesLevel = atRiskFilter === 'all' || st.riskLevel === atRiskFilter;
    return matchesClass && matchesLevel;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800" id="school-mgmt-root">
      
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast, i) => (
          <div key={i} className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 animate-slide-in text-sm max-w-sm">
            <CheckCircle2 className="text-emerald-400 w-5 h-5 flex-shrink-0" />
            <span>{toast}</span>
          </div>
        ))}
      </div>

      {/* Top Header & Permission Switcher (RBAC Controller) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
              <Building size={24} />
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

          {/* RBAC Persona Selector */}
          <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-200 flex flex-wrap items-center gap-1">
            <div className="flex items-center gap-1.5 px-2 text-slate-500 text-xs font-semibold">
              <Shield size={14} className="text-indigo-500" />
              <span>Simular Perfil:</span>
            </div>
            {['Super Admin', 'Diretor', 'Professor', 'Aluno', 'Encarregado'].map((role) => (
              <button
                key={role}
                onClick={() => {
                  setRbacRole(role);
                  addToast(`Visualizando sistema como: ${role}`);
                  // Default tab change to stay inside access boundary
                  if (role === 'Professor' && activeTab === 'financeiro') setActiveTab('ia-professores');
                  if (role === 'Aluno') setActiveTab('alunos');
                  if (role === 'Encarregado') setActiveTab('pais');
                }}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  rbacRole === role 
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Navigation Layout */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
        
        {/* Left Sidebar Menu */}
        <aside className="w-full lg:w-72 bg-white border-r border-slate-200 p-4 flex flex-col gap-1 flex-shrink-0">
          <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Módulos Escolares (B2B)
          </div>

          {[
            { id: 'dashboard', label: 'Dashboard Escolar', icon: Building },
            { id: 'academico', label: 'Gestão Académica', icon: BookOpen },
            { id: 'professores', label: 'Professores', icon: Users },
            { id: 'alunos', label: 'Alunos', icon: GraduationCap },
            { id: 'pais', label: 'Encarregados (Pais)', icon: Users },
            { id: 'ia-professores', label: 'IA para Professores', icon: Sparkles },
            { id: 'ia-diretores', label: 'IA para Diretores', icon: AlertTriangle },
            { id: 'biblioteca', label: 'Biblioteca Digital', icon: BookCheck },
            { id: 'comunicacao', label: 'Comunicação', icon: MessageSquare },
            { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
            { id: 'integracoes', label: 'Integrações', icon: Settings2 },
            { id: 'intelligence', label: '📊 Intelligence Center', icon: BarChart2 },
            { id: 'configuracoes', label: 'Configurações', icon: Settings },
          ].map((item) => {
            const allowed = hasAccess(item.id);
            if (!allowed) return null;
            
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600 shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={isActive ? "text-indigo-600" : "text-slate-400"} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'ia-diretores' && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    3 Alertas
                  </span>
                )}
                {item.id === 'intelligence' && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    BI
                  </span>
                )}
              </button>
            );
          })}

          <div className="mt-auto pt-6 border-t border-slate-200">
            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-3 translate-y-3">
                <Building size={120} />
              </div>
              <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                Premium Enterprise
              </span>
              <h4 className="font-semibold text-sm mt-2 text-white">LingoLIVE IA Hub</h4>
              <p className="text-xs text-slate-400 mt-1">Escola Licenciada ativa até Outubro de 2026.</p>
              <div className="mt-3 text-xs flex items-center justify-between text-indigo-300 font-medium">
                <span>ID: default-school</span>
                <span className="underline cursor-pointer">Ver Licença</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">

          {/* 0. TAB: EXECUTIVE DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Resumo Executivo da Escola</h2>
                  <p className="text-sm text-slate-500">Indicadores consolidados, eventos urgentes e integridade da licença corporativa.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => triggerSync('dashboard')}
                    disabled={isSyncing !== null}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 transition-all text-sm font-semibold disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                    <span>{isSyncing === 'dashboard' ? "Sincronizando..." : "Sincronizar Tudo"}</span>
                  </button>
                </div>
              </div>

              {/* DASHBOARD ESCOLAR GRID */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[
                  { label: "Alunos Ativos", val: "1.248", icon: GraduationCap, color: "text-indigo-600 bg-indigo-50" },
                  { label: "Professores", val: "58", icon: Users, color: "text-emerald-600 bg-emerald-50" },
                  { label: "Turmas", val: "42", icon: BookOpen, color: "text-amber-600 bg-amber-50" },
                  { label: "Cursos Ativos", val: "96", icon: ClipboardList, color: "text-rose-600 bg-rose-50" },
                  { label: "Idiomas Ativos", val: "4", icon: Award, color: "text-purple-600 bg-purple-50" },
                  { label: "Média Geral", val: "81%", icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
                  { label: "Frequência Hoje", val: "94%", icon: Clock, color: "text-teal-600 bg-teal-50" },
                  { label: "IA Utilizada Hoje", val: "3.412 sessões", icon: Sparkles, color: "text-pink-600 bg-pink-50" },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                      <div className={`p-1.5 rounded-lg ${stat.color}`}>
                        <stat.icon size={16} />
                      </div>
                    </div>
                    <p className="text-lg font-bold text-slate-900 mt-2">{stat.val}</p>
                  </div>
                ))}
                
                {/* Full Width License Card */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 flex flex-col justify-between col-span-2 md:col-span-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado da Licença</span>
                    <div className="p-1.5 rounded-lg bg-slate-800 text-amber-400">
                      <Settings2 size={16} />
                    </div>
                  </div>
                  <div>
                    <p className="text-md font-bold text-amber-400 mt-2">Premium Enterprise</p>
                    <p className="text-[10px] text-slate-400">Sincronização Ativa</p>
                  </div>
                </div>
              </div>

              {/* Bottom Multi-columns: Calendar, Alerts, and Communications */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column 1: Calendário Escolar & Eventos */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="text-indigo-600" size={18} />
                      <h3 className="font-bold text-slate-900 text-sm">Calendário & Próximos Eventos</h3>
                    </div>
                    <span className="text-xs text-indigo-600 font-medium cursor-pointer">Ver completo</span>
                  </div>
                  <div className="space-y-3.5">
                    {[
                      { date: "09 JUL", title: "Feira de Idiomas LingoLIVE", desc: "Apresentação dos projetos práticos dos alunos." },
                      { date: "15 JUL", title: "Conselho de Professores", desc: "Revisão das notas parciais e engajamento com IA." },
                      { date: "22 JUL", title: "Libertação dos Certificados", desc: "Emissão automatizada baseada no progresso CEFR." },
                    ].map((ev, idx) => (
                      <div key={idx} className="flex gap-3 items-start">
                        <div className="bg-indigo-50 text-indigo-700 p-2 rounded-lg font-bold text-center text-xs w-14 flex-shrink-0">
                          {ev.date}
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-slate-800">{ev.title}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">{ev.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: Alertas de Inteligência IA */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="text-amber-500" size={18} />
                      <h3 className="font-bold text-slate-900 text-sm">Alertas do Diretor</h3>
                    </div>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md">Urgente</span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-rose-800 mb-1">
                        <AlertTriangle size={14} />
                        <span>Queda de Desempenho</span>
                      </div>
                      <p className="text-rose-700">A turma 8B registou uma queda acentuada de 15% em Listening nas últimas 2 semanas.</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-amber-800 mb-1">
                        <Clock size={14} />
                        <span>Alunos em Risco</span>
                      </div>
                      <p className="text-amber-700">Há 12 alunos identificados pela IA como alto risco de reprovação ou abandono por baixa frequência.</p>
                    </div>
                  </div>
                </div>

                {/* Column 3: Últimos Relatórios & Mensagens */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <FileText className="text-emerald-600" size={18} />
                      <h3 className="font-bold text-slate-900 text-sm">Últimos Relatórios de Atividade</h3>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { file: "Consolidado_Trimestre2.pdf", size: "1.4 MB", type: "PDF" },
                      { file: "Insights_Cognitivos_Gerais.xlsx", size: "850 KB", type: "Planilha" },
                      { file: "Estatisticas_Uso_IA_Junho.pdf", size: "2.1 MB", type: "PDF" },
                    ].map((rep, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-all border border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
                            <FileText size={14} />
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-slate-800 truncate max-w-[150px]">{rep.file}</h4>
                            <p className="text-[10px] text-slate-400">{rep.size}</p>
                          </div>
                        </div>
                        <button className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                          <Download size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 1. TAB: GESTÃO ACADÉMICA */}
          {activeTab === 'academico' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Gestão Académica Central</h2>
                  <p className="text-sm text-slate-500">Sincronização integrada do Ano Letivo, Períodos, Horários e Salas.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => triggerSync('academia')} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold">
                    <RefreshCw size={14} />
                    <span>Sincronizar Calendário</span>
                  </button>
                </div>
              </div>

              {/* Academic Settings Quick Switchers */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-400 uppercase">Ano Letivo Ativo</label>
                  <select 
                    value={activeYear} 
                    onChange={(e) => { setActiveYear(e.target.value); addToast(`Ano letivo alterado para ${e.target.value}`); }}
                    className="w-full mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium"
                  >
                    <option value="2026">2026 (Ativo)</option>
                    <option value="2027">2027 (Planeamento)</option>
                  </select>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-400 uppercase">Período / Trimestre</label>
                  <select 
                    value={activePeriod} 
                    onChange={(e) => { setActivePeriod(e.target.value); addToast(`Período de avaliação alterado para ${e.target.value}`); }}
                    className="w-full mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium"
                  >
                    <option value="1º Trimestre">1º Trimestre</option>
                    <option value="2º Trimestre">2º Trimestre</option>
                    <option value="3º Trimestre">3º Trimestre (Atual)</option>
                  </select>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-400 uppercase">Salas Sincronizadas</label>
                  <p className="text-lg font-bold text-slate-800 mt-2">18 Salas Ativas</p>
                  <p className="text-[10px] text-slate-400">Blocos A, B e C</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-400 uppercase">Feriados Próximos</label>
                  <p className="text-sm font-bold text-rose-600 mt-2">11 de Novembro</p>
                  <p className="text-[10px] text-slate-400">Dia da Independência</p>
                </div>
              </div>

              {/* Interactive Schedule/Grid */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 text-sm">Estrutura de Horários & Disciplinas Disponíveis</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <th className="p-3">Turno / Horário</th>
                        <th className="p-3">Segunda</th>
                        <th className="p-3">Terça</th>
                        <th className="p-3">Quarta</th>
                        <th className="p-3">Quinta</th>
                        <th className="p-3">Sexta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr>
                        <td className="p-3 bg-slate-50 font-bold">Manhã (08:00 - 10:00)</td>
                        <td className="p-3 text-indigo-600">Inglês - 7A (Sala 4)</td>
                        <td className="p-3 text-slate-500">História - 8A</td>
                        <td className="p-3 text-indigo-600">Inglês - 7A (Sala 4)</td>
                        <td className="p-3 text-teal-600">Matemática - 9B</td>
                        <td className="p-3 text-emerald-600">Português - 7A</td>
                      </tr>
                      <tr>
                        <td className="p-3 bg-slate-50 font-bold">Manhã (10:30 - 12:30)</td>
                        <td className="p-3 text-teal-600">Ciências - 8B</td>
                        <td className="p-3 text-purple-600">Francês - 9A (Sala 2)</td>
                        <td className="p-3 text-teal-600">Ciências - 8B</td>
                        <td className="p-3 text-purple-600">Francês - 9A (Sala 2)</td>
                        <td className="p-3 text-indigo-600">Inglês Avançado</td>
                      </tr>
                      <tr>
                        <td className="p-3 bg-slate-50 font-bold">Tarde (13:30 - 15:30)</td>
                        <td className="p-3 text-amber-600">Chinês - 8A (Sala 3)</td>
                        <td className="p-3 text-slate-500">Informática - 10C</td>
                        <td className="p-3 text-amber-600">Chinês - 8A (Sala 3)</td>
                        <td className="p-3 text-slate-500">Informática - 10C</td>
                        <td className="p-3 text-indigo-600">Inglês Infantil</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. TAB: PROFESSORES */}
          {activeTab === 'professores' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Perfis de Professores</h2>
                  <p className="text-sm text-slate-500">Gestão de carga horária, departamentos e sincronização com calendários.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleAddTeacher}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 transition-all text-xs font-semibold"
                  >
                    <Plus size={14} />
                    <span>Cadastrar Professor</span>
                  </button>
                  <button 
                    onClick={() => triggerSync('professores')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all text-xs font-semibold"
                  >
                    <RefreshCw size={14} />
                    <span>Sincronizar Todos</span>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Filtrar professores por nome ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                />
              </div>

              {/* Profiles List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeachers.map((teacher) => (
                  <div key={teacher.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <img 
                          src={teacher.photo} 
                          alt={teacher.name} 
                          className="w-12 h-12 rounded-full object-cover border border-slate-100" 
                        />
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{teacher.name}</h3>
                          <p className="text-[11px] text-slate-400">{teacher.email}</p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-400">Departamento:</span>
                          <span className="font-semibold text-slate-700">{teacher.dept}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-400">Disciplinas:</span>
                          <span className="font-semibold text-slate-700">{teacher.subjects.join(', ')}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-400">Idiomas Ativos:</span>
                          <span className="font-semibold text-slate-700">{teacher.languages.join(', ')}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-400">Turmas:</span>
                          <span className="font-semibold text-indigo-600">{teacher.classes.join(', ')}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-400">Carga Horária Semanal:</span>
                          <span className="font-semibold text-slate-700">{teacher.hours}h / semana</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs">
                        <Award className="text-amber-500" size={14} />
                        <span className="font-bold text-slate-700">{teacher.rating} / 5.0</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => { triggerSync(`agenda_prof_${teacher.id}`); }}
                          className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold hover:bg-indigo-100 transition-all flex items-center gap-1"
                        >
                          <RefreshCw size={10} />
                          <span>Sincronizar Agenda</span>
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja apagar o registro de ${teacher.name}?`)) {
                              setTeachers(prev => prev.filter(t => t.id !== teacher.id));
                              addToast(`Professor(a) ${teacher.name} removido do sistema.`);
                            }
                          }}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. TAB: ALUNOS */}
          {activeTab === 'alunos' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Portal Académico de Alunos</h2>
                  <p className="text-sm text-slate-500">Lista geral de alunos ativos, turmas, progressos de XP e certificados sincronizados.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleAddStudent}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 transition-all text-xs font-semibold"
                  >
                    <UserPlus size={14} />
                    <span>Adicionar Aluno</span>
                  </button>
                  <button 
                    onClick={() => triggerSync('alunos')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all text-xs font-semibold"
                  >
                    <RefreshCw size={14} />
                    <span>Sincronizar Progresso Geral</span>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Filtrar alunos por nome, curso ou idioma..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                />
              </div>

              {/* Students Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredStudents.map((stud) => (
                  <div key={stud.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={stud.photo} 
                          alt={stud.name} 
                          className="w-10 h-10 rounded-full object-cover border border-slate-100" 
                        />
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs truncate max-w-[150px]">{stud.name}</h4>
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                            Turma {stud.classId}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Nível CEFR:</span>
                          <span className="font-bold text-slate-700">{stud.level}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total XP:</span>
                          <span className="font-bold text-indigo-600">{stud.xp} XP</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Frequência:</span>
                          <span className="font-bold text-teal-600">{stud.attendance}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Média Geral:</span>
                          <span className="font-bold text-slate-800">{stud.grade}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button 
                        onClick={() => triggerSync(`aluno_progresso_${stud.id}`)}
                        className="text-[9px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        <RefreshCw size={10} />
                        <span>Sincronizar Atividades</span>
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja desvincular o aluno ${stud.name}?`)) {
                            setStudents(prev => prev.filter(s => s.id !== stud.id));
                            addToast(`Aluno ${stud.name} removido.`);
                          }
                        }}
                        className="text-rose-500 hover:bg-rose-50 p-1 rounded-lg"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. TAB: PAIS ENCARREGADOS */}
          {activeTab === 'pais' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Portal dos Pais & Encarregados</h2>
                  <p className="text-sm text-slate-500">Monitoramento familiar, envio automático de boletins e acompanhamento de IA.</p>
                </div>
                <button 
                  onClick={() => triggerSync('pais_notif')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                >
                  <RefreshCw size={14} />
                  <span>Sincronizar Notificações Encarregados</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-4 text-sm">Controle de Sincronização de Progresso com os Pais</h3>
                  <div className="space-y-4 text-xs">
                    {[
                      { parent: "Carlos de Sousa (Pai de Helder)", email: "pai.helder@gmail.com", lastActive: "Ontem às 18:32", alertStatus: "Enviado" },
                      { parent: "Sofia Cassinda (Mãe de Aline)", email: "mae.aline@gmail.com", lastActive: "Há 2 dias", alertStatus: "Enviado" },
                      { parent: "Avelino Neto (Pai de Emanuel)", email: "avelino.neto@gmail.com", lastActive: "Ativo Agora", alertStatus: "Urgente" },
                    ].map((row, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <p className="font-bold text-slate-800">{row.parent}</p>
                          <p className="text-[10px] text-slate-400">{row.email}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${row.alertStatus === "Urgente" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
                            Relatório IA: {row.alertStatus}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1">Sessão: {row.lastActive}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 mb-2 text-sm">Disparar Alerta Pedagógico para Pais</h3>
                    <p className="text-xs text-slate-500 mb-4">Selecione uma dificuldade detectada pela IA e envie uma sugestão de reforço doméstico diretamente para o WhatsApp ou Email dos pais.</p>
                    <textarea 
                      placeholder="Ex: Identificamos que o Helder de Sousa está com 10% a menos de aproveitamento em Present Perfect. Recomendamos incentivar o jogo 'Conversa no Aeroporto' no portal do aluno."
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-slate-50 h-28"
                    />
                  </div>
                  <button 
                    onClick={() => { addToast("Alerta pedagógico enviado com sucesso para os encarregados de educação!"); }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs mt-4 transition-all"
                  >
                    Disparar Alerta LingoLIVE
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. TAB: IA PARA PROFESSORES */}
          {activeTab === 'ia-professores' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900">Assistente Pedagógico de IA (Para Professores)</h2>
                <p className="text-sm text-slate-500">Criação instantânea de exames, exercícios adaptativos, rubricas de avaliação e apoio didático.</p>
              </div>

              {/* Regional Geolocation Adaptor Banner */}
              <div className="bg-gradient-to-r from-indigo-950 to-slate-900 text-white p-4 rounded-2xl border border-indigo-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl animate-bounce">
                    {selectedGeoRegion === 'Moçambique' ? '🇲🇿' :
                     selectedGeoRegion === 'Angola' ? '🇦🇴' :
                     selectedGeoRegion === 'Brasil' ? '🇧🇷' :
                     selectedGeoRegion === 'Portugal' ? '🇵🇹' : '🌍'}
                  </span>
                  <div>
                    <span className="text-[10px] bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Tutor Regional Ativo
                    </span>
                    <h3 className="text-sm font-extrabold text-white mt-1">
                      Sintonizado com: <span className="text-amber-300 font-black">{selectedGeoRegion}</span>
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      {selectedGeoRegion === 'Moçambique' ? 'Adaptando terminologia de Maputo/Beira, sotaque local, fauna da Gorongosa e contexto logístico moçambicano.' :
                       selectedGeoRegion === 'Angola' ? 'Adaptando terminologia de Luanda, cultura Semba/Kizomba, e referências nacionais de Angola.' :
                       selectedGeoRegion === 'Brasil' ? 'Adaptando contexto profissional de São Paulo, startups de tecnologia e preferências de conversação corporativa.' :
                       selectedGeoRegion === 'Portugal' ? 'Alinhamento com o Quadro Europeu de Referência (QECR), Web Summit e referências de Lisboa/Porto.' :
                       'Adaptando conteúdos educacionais de acordo com a demografia da região.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {[
                    { name: 'Moçambique', flag: '🇲🇿' },
                    { name: 'Angola', flag: '🇦🇴' },
                    { name: 'Brasil', flag: '🇧🇷' },
                    { name: 'Portugal', flag: '🇵🇹' }
                  ].map((reg) => (
                    <button
                      key={reg.name}
                      onClick={() => {
                        setSelectedGeoRegion(reg.name);
                        addToast(`Assistente IA reconfigurado para o contexto de ${reg.name}!`);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border ${
                        selectedGeoRegion === reg.name 
                          ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-sm scale-105' 
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <span>{reg.flag}</span>
                      <span>{reg.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Request Builder */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={18} className="text-indigo-600 animate-pulse" />
                      <h3 className="font-bold text-slate-800 text-sm">O que deseja criar hoje em {selectedGeoRegion}?</h3>
                    </div>
                    <textarea 
                      value={teacherPrompt}
                      onChange={(e) => setTeacherPrompt(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs h-32 focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(selectedGeoRegion === 'Moçambique' ? [
                        "✔ Exame: Present Perfect (Maputo)",
                        "✔ Vocabulário Técnico: Porto de Beira",
                        "✔ Diálogo CEFR A2: Fauna da Gorongosa",
                        "✔ Redação: Ecossistema de Bazaruto",
                        "✔ Rubrica de Avaliação (Moçambique)"
                      ] : selectedGeoRegion === 'Angola' ? [
                        "✔ Exame: Present Perfect (Luanda)",
                        "✔ Vocabulário de Negócios (Lubango)",
                        "✔ Diálogo CEFR A2: Música Semba",
                        "✔ Redação: Quedas de Kalandula",
                        "✔ Rubrica de Avaliação (Angola)"
                      ] : selectedGeoRegion === 'Brasil' ? [
                        "✔ Diálogo: Inovação em São Paulo",
                        "✔ Vocabulário Corporativo Berrini",
                        "✔ Prática de Listening em Inglês",
                        "✔ Redação: Carnaval e Diversidade",
                        "✔ Rubrica de Avaliação (Brasil)"
                      ] : selectedGeoRegion === 'Portugal' ? [
                        "✔ Vocabulário: Turismo em Alfama",
                        "✔ Diálogo: Web Summit em Lisboa",
                        "✔ Exame CEFR B2 com Acordo Ortográfico",
                        "✔ Redação: Fado e Património",
                        "✔ Rubrica de Avaliação (Portugal)"
                      ] : [
                        "✔ Criar Exame de Gramática",
                        "✔ Corrigir Redação (CEFR A2)",
                        "✔ Gerar Exercícios de Conversação",
                        "✔ Criar Rubrica de Avaliação",
                        "✔ Explicar Dificuldades Comuns"
                      ]).map((item, idx) => (
                        <button 
                          key={idx}
                          onClick={() => setTeacherPrompt(item.substring(2))}
                          className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10px] font-semibold rounded-lg transition-all"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleGenerateAITest}
                    disabled={isGenerating}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs mt-6 flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <Sparkles size={14} />
                    <span>{isGenerating ? "Processando Algoritmo de IA..." : "Gerar com LingoLIVE IA"}</span>
                  </button>
                </div>

                {/* AI Result View */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-400 uppercase">Resultado do Assistente IA</span>
                      {aiResponse && (
                        <button 
                          onClick={() => { navigator.clipboard.writeText(aiResponse); addToast("Copiado para a área de transferência!"); }}
                          className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          Copiar Texto
                        </button>
                      )}
                    </div>

                    {isGenerating ? (
                      <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                        <RefreshCw className="animate-spin text-indigo-600" size={32} />
                        <span className="text-xs font-medium">Lendo contexto da escola e gerando teste adaptativo...</span>
                      </div>
                    ) : aiResponse ? (
                      <pre className="text-[11px] font-mono whitespace-pre-wrap bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 h-64 overflow-y-auto leading-relaxed">
                        {aiResponse}
                      </pre>
                    ) : (
                      <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-center px-4">
                        <Sparkles size={36} className="text-slate-300 mb-2" />
                        <p className="text-xs">Insira um comando didático no painel ao lado para que a inteligência geradora prepare materiais customizados em segundos.</p>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400 text-center mt-3">Alimentado por Gemini 1.5 Flash Enterprise - Totalmente alinhado às diretrizes do QECR (CEFR).</p>
                </div>
              </div>
            </div>
          )}

          {/* 6. TAB: IA PARA DIRETORES */}
          {activeTab === 'ia-diretores' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900">IA Insights (Módulo Direção)</h2>
                <p className="text-sm text-slate-500">Mapeamento preditivo de anomalias, análise de comportamento de estudo e inteligência escolar.</p>
              </div>

              {/* Regional Geolocation Adaptor Banner inside Director Tab */}
              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs mb-4 animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {selectedGeoRegion === 'Moçambique' ? '🇲🇿' :
                     selectedGeoRegion === 'Angola' ? '🇦🇴' :
                     selectedGeoRegion === 'Brasil' ? '🇧🇷' :
                     selectedGeoRegion === 'Portugal' ? '🇵🇹' : '🌍'}
                  </span>
                  <span className="font-bold text-slate-700">Mapeamento de IA filtrado para a região activa: <span className="text-indigo-600">{selectedGeoRegion}</span></span>
                </div>
                <div className="flex gap-1">
                  {['Moçambique', 'Angola', 'Brasil', 'Portugal'].map((reg) => (
                    <button
                      key={reg}
                      onClick={() => {
                        setSelectedGeoRegion(reg);
                        addToast(`Insights da Direção adaptados para ${reg}!`);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedGeoRegion === reg ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
                    >
                      {reg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Alerts Box */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(selectedGeoRegion === 'Moçambique' ? [
                  { title: "Moçambique: Alerta de Listening", alert: "Queda de 11% na proficiência média de áudio na região de Maputo. Recomendada adoção de episódios mais curtos de podcasts educativos com vocabulário local.", type: "critico", time: "Hoje" },
                  { title: "Comportamento de Estudo em Maputo", alert: "Pico de acesso à IA registado aos sábados de manhã. Elevada afinidade por tarefas práticas de conversação oral.", type: "insight", time: "Ontem" },
                  { title: "Risco Pedagógico Regional", alert: "8 alunos em risco pedagógico identificados em Moçambique. Sugerido reforço focado em tempos verbais e preposições.", type: "alerta", time: "Há 2 dias" },
                ] : selectedGeoRegion === 'Angola' ? [
                  { title: "Turma 8B: Alerta de Listening", alert: "Queda de 15% na proficiência média de escuta. Aulas recomendadas de audição ativa e semba rítmico.", type: "critico", time: "Hoje" },
                  { title: "Comportamento de Estudo em Luanda", alert: "Alunos utilizam a IA preferencialmente às terças-feiras entre as 18:00 e as 21:00. Ponto de carga ótimo.", type: "insight", time: "Ontem" },
                  { title: "Alunos em Risco Pedagógico", alert: "12 alunos identificados com declínio de participação em quizzes semanais em Angola. Risco de evasão alto.", type: "alerta", time: "Há 2 dias" },
                ] : selectedGeoRegion === 'Brasil' ? [
                  { title: "Brasil: Alerta de Frequência", alert: "Média de assiduidade aos fins de semana recuou 8% devido aos feriados regionais brasileiros. Sugerido reajustar metas de XP semanais.", type: "critico", time: "Hoje" },
                  { title: "Comportamento de Estudo SP/RJ", alert: "Preferência expressiva por simulações rápidas no telemóvel durante o horário de almoço corporativo brasileiro (12h-14h).", type: "insight", time: "Ontem" },
                  { title: "Metas de Conversação Berrini", alert: "Engajamento excelente de 92% na realização dos roleplays corporativos adaptados ao mercado corporativo de tecnologia.", type: "alerta", time: "Há 2 dias" },
                ] : selectedGeoRegion === 'Portugal' ? [
                  { title: "Portugal: Desempenho Erasmus", alert: "Crescimento de 18% no interesse por certificações de proficiência e inglês acadêmico. Elevado rendimento médio geral.", type: "insight", time: "Hoje" },
                  { title: "Comportamento de Estudo de Lisboa", alert: "Uso concentrado da plataforma após as 20h portuguesas. Alta taxa de conclusão de vocabulário de turismo e Web Summit.", type: "insight", time: "Ontem" },
                  { title: "Risco de Abandono Universitário", alert: "2 alunos sinalizados com baixa assiduidade devido a conflitos de horários em exames nacionais.", type: "alerta", time: "Há 2 dias" },
                ] : [
                  { title: "Alerta Geral de Listening", alert: "Análise global indica declínio temporário na prática de audição ativa em todos os polos integrados.", type: "critico", time: "Hoje" },
                  { title: "Comportamento de Estudo Geral", alert: "Estudo autónomo consolidado de forma equilibrada ao longo da semana útil, com foco no fim de semana.", type: "insight", time: "Ontem" },
                  { title: "Risco Pedagógico Acumulado", alert: "Sinalização de casos urgentes automatizada e enviada para os respectivos coordenadores pedagógicos.", type: "alerta", time: "Há 2 dias" },
                ]).map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => { setSelectedAIInsight(item.alert); addToast(`Carregando detalhe do insight preditivo.`); }}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between ${
                      item.type === "critico" 
                        ? "bg-rose-50 border-rose-100 hover:border-rose-300 text-rose-900" 
                        : item.type === "alerta" 
                        ? "bg-amber-50 border-amber-100 hover:border-amber-300 text-amber-900"
                        : "bg-indigo-50 border-indigo-100 hover:border-indigo-300 text-indigo-900"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold tracking-wider uppercase">{item.time}</span>
                        <AlertTriangle size={16} className={item.type === "critico" ? "text-rose-500" : item.type === "alerta" ? "text-amber-500" : "text-indigo-500"} />
                      </div>
                      <h4 className="font-bold text-xs mb-1.5">{item.title}</h4>
                      <p className="text-[11px] opacity-80 leading-relaxed">{item.alert}</p>
                    </div>
                    <span className="text-[10px] font-bold underline mt-4 block text-right">Ver Plano de Ação sugerido</span>
                  </div>
                ))}
              </div>

              {/* Action Plan Drawer */}
              {selectedAIInsight && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 animate-fade-in">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-slate-800 text-sm">Plano de Ação Proposto pela LingoLIVE IA</h3>
                    <button onClick={() => setSelectedAIInsight(null)} className="text-xs text-slate-400 hover:text-slate-600">Fechar</button>
                  </div>
                  <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <strong>Contexto analisado:</strong> {selectedAIInsight}
                  </p>
                  <div className="space-y-2 text-xs">
                    <p className="font-semibold text-slate-700">Recomendações Práticas Automatizadas:</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li><strong>Disparar Notificação:</strong> Sugerir exercícios de audição no aplicativo móvel dos alunos selecionados.</li>
                      <li><strong>Reforço Pedagógico:</strong> Injetar glossário automatizado para os professores usarem na próxima sessão síncrona.</li>
                      <li><strong>Contato Automático:</strong> Enviar boletim personalizado aos encarregados de educação via canal integrado.</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => { addToast("Plano de Ação executado e disparado para os alunos e professores em risco!"); setSelectedAIInsight(null); }}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl"
                  >
                    Executar Plano de Ação LingoLIVE
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 7. TAB: BIBLIOTECA DIGITAL */}
          {activeTab === 'biblioteca' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Biblioteca Digital Multimédia</h2>
                  <p className="text-sm text-slate-500">Repositório completo de PDFs, vídeos, exames e recursos preparados por inteligência artificial.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { title: "Manuais & PDFs", count: "148 arquivos", icon: FileText, color: "bg-blue-50 text-blue-600" },
                  { title: "Aulas Gravadas (Vídeo)", count: "92 vídeos", icon: Eye, color: "bg-purple-50 text-purple-600" },
                  { title: "Áudios & Podcasts", count: "214 ficheiros", icon: Clock, color: "bg-teal-50 text-teal-600" },
                  { title: "Flashcards Recomendados", count: "1.250 cards", icon: Award, color: "bg-amber-50 text-amber-600" },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div className={`p-2 rounded-lg w-fit ${item.color}`}>
                      <item.icon size={18} />
                    </div>
                    <h4 className="font-bold text-slate-800 text-xs mt-3">{item.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1">{item.count}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 text-sm">Biblioteca de Testes & Exames Rápidos</h3>
                <div className="space-y-3">
                  {[
                    { id: "e1", examName: "Exame de Conversação Avançada (Inglês B2)", createdBy: "Sra. Maria Neto", format: "Exame Geral" },
                    { id: "e2", examName: "Avaliação Intermédia de Vocabulário Prático (Francês A2)", createdBy: "LingoLIVE IA", format: "IA Adaptativa" },
                    { id: "e3", examName: "Gramática Escrita: Tempos Verbais Complexos (Português C1)", createdBy: "Prof. António Gonga", format: "PDF de Aula" },
                  ].map((exam, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-100 text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{exam.examName}</p>
                        <p className="text-[10px] text-slate-400">Criador: {exam.createdBy} | Tipo: {exam.format}</p>
                      </div>
                      <button 
                        onClick={() => { addToast(`Preparando arquivo ${exam.examName} para download...`); }}
                        className="px-3 py-1 bg-white border border-slate-200 text-slate-700 hover:border-indigo-600 rounded-lg text-[10px] font-bold"
                      >
                        Baixar Recurso
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 8. TAB: COMUNICAÇÃO INTEGRADA */}
          {activeTab === 'comunicacao' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900">Central de Comunicação & Chat Escolar</h2>
                <p className="text-sm text-slate-500">Canais síncronos entre direção, professores, alunos e pais de alunos.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Channels List */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Canais de Mensagem</h3>
                  <div className="space-y-2 text-xs">
                    {[
                      { id: "c1", name: "Direção ↔ Professores", unread: 3, lastMsg: "Reunião de notas às 15h" },
                      { id: "c2", name: "Professores ↔ Encarregados", unread: 0, lastMsg: "Aline completou o teste" },
                      { id: "c3", name: "Comunidade Geral da Escola", unread: 12, lastMsg: "Matrículas abertas para 2027" },
                    ].map((ch, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-900 cursor-pointer rounded-xl transition-all border border-slate-100 flex justify-between items-center">
                        <div>
                          <p className="font-bold">{ch.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{ch.lastMsg}</p>
                        </div>
                        {ch.unread > 0 && (
                          <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            {ch.unread}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Broadcast Panel */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs col-span-2 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm mb-2">Disparar Comunicado em Lote (Push, Email, WhatsApp)</h3>
                    <p className="text-xs text-slate-500 mb-4">Selecione o grupo e envie uma mensagem oficial imediata para toda a comunidade.</p>
                    
                    <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                      <button className="py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold rounded-lg">
                        Apenas Professores
                      </button>
                      <button className="py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg">
                        Pais & Alunos
                      </button>
                      <button className="py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg">
                        Escola Completa
                      </button>
                    </div>

                    <textarea 
                      placeholder="Insira o aviso geral da direção..."
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-slate-50 h-28 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <button 
                    onClick={() => { addToast("Comunicado em lote transmitido com sucesso!"); }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl mt-4 transition-all"
                  >
                    Transmitir Comunicado Geral
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* 9. TAB: FINANCEIRO */}
          {activeTab === 'financeiro' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900">Gestão Financeira & Licenças</h2>
                <p className="text-sm text-slate-500">Faturamento anual corporativo, controle de mensalidades integradas e upgrade de licença de uso.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Billing Summary */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faturamento de Matrículas (Mês Corrente)</span>
                    <h3 className="text-2xl font-bold text-slate-800 mt-2">12.840.000 AOA</h3>
                    <p className="text-xs text-emerald-600 font-semibold mt-1">↑ 12% em relação ao trimestre passado</p>
                  </div>
                  <button 
                    onClick={() => { addToast("Relatório financeiro mensal baixado!"); }}
                    className="w-full mt-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <Download size={14} />
                    <span>Baixar Relatório Mensal</span>
                  </button>
                </div>

                {/* Subscriptions Progress */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado de Adimplência de Mensalidades</span>
                    <h3 className="text-xl font-bold text-slate-800 mt-2">96.5% Pago</h3>
                    <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '96.5%' }} />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-4">Apenas 3.5% em atraso. Cobrança automática ativa via WhatsApp.</p>
                </div>

                {/* License Information */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chave da Licença LingoLIVE</span>
                      <span className="bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md">Ativa</span>
                    </div>
                    <p className="text-md font-bold text-amber-400 mt-2">{licenseKey}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Nível: Premium Enterprise Unlimited</p>
                  </div>
                  <button 
                    onClick={() => { addToast("Chave da licença revalidada com o servidor!"); }}
                    className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Renovar / Validar Chave de Acesso
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* 10. TAB: INTEGRAÇÕES EXTERNAS */}
          {activeTab === 'integracoes' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900">Configurações de Integrações Externas</h2>
                <p className="text-sm text-slate-500">Sincronização com sistemas LMS legados (Moodle, Canvas), Google Classroom e ferramentas de chat.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: "Google Classroom", desc: "Sincronização de notas de quizzes e listas de alunos de forma transparente.", active: true },
                  { name: "WhatsApp Enterprise API", desc: "Disparos de alertas de notas em tempo real e avisos aos pais.", active: false },
                  { name: "Microsoft Teams / Zoom", desc: "Aulas ao vivo síncronas integradas e gravadas automaticamente.", active: true },
                ].map((int, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-slate-800 text-sm">{int.name}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${int.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                          {int.active ? "Ativado" : "Desativado"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{int.desc}</p>
                    </div>
                    <button 
                      onClick={() => { addToast(`Integração com ${int.name} foi atualizada!`); }}
                      className={`w-full mt-6 py-2 rounded-xl text-xs font-bold transition-all ${int.active ? "bg-slate-100 text-slate-800 hover:bg-slate-200" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
                    >
                      {int.active ? "Configurar Parâmetros" : "Ativar Conexão"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 11. TAB: 📊 INTELLIGENCE CENTER (BUSINESS INTELLIGENCE) */}
          {activeTab === 'intelligence' && (
            <div className="space-y-6">
              {/* Header with actions and filters */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <span>📊 Intelligence Center</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">Real-Time BI</span>
                  </h2>
                  <p className="text-sm text-slate-500">Business intelligence engine: monitor performance trends, CEFR benchmarks, AI integration, and proactive student welfare.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600">
                    <span>Filtro de Turma:</span>
                    <select 
                      value={selectedClassTrend}
                      onChange={(e) => {
                        setSelectedClassTrend(e.target.value);
                        addToast(`Visualização filtrada para: ${e.target.value === 'all' ? 'Todas as Turmas' : e.target.value}`);
                      }}
                      className="bg-transparent border-none outline-none text-indigo-600 cursor-pointer font-bold"
                    >
                      <option value="all">Todas as Turmas</option>
                      <option value="7A">Turma 7A (Inglês)</option>
                      <option value="8B">Turma 8B (Multilíngue)</option>
                      <option value="9A">Turma 9A (Avançado)</option>
                    </select>
                  </div>

                  <button 
                    onClick={() => triggerSync('analytics')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    <RefreshCw size={13} className={isSyncing === 'analytics' ? 'animate-spin' : ''} />
                    <span>Recarregar Métricas</span>
                  </button>
                </div>
              </div>

              {/* Real-time KPI Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { 
                    label: "Média de Aproveitamento", 
                    val: selectedClassTrend === '8B' ? "79.0%" : selectedClassTrend === '7A' ? "84.0%" : "81.2%", 
                    change: "+2.8%", 
                    isPositive: true, 
                    desc: "vs trimestre anterior",
                    color: "text-indigo-600 bg-indigo-50 border-indigo-100",
                    icon: TrendingUp 
                  },
                  { 
                    label: "Engajamento com IA", 
                    val: selectedClassTrend === '8B' ? "88%" : selectedClassTrend === '7A' ? "95%" : "92.4%", 
                    change: "+14.1%", 
                    isPositive: true, 
                    desc: "sessões virtuais ativas",
                    color: "text-amber-600 bg-amber-50 border-amber-100",
                    icon: Sparkles 
                  },
                  { 
                    label: "Proficiência CEFR", 
                    val: "B1.2 Médio", 
                    change: "0.4 Nível", 
                    isPositive: true, 
                    desc: "ritmo de progressão anual",
                    color: "text-emerald-600 bg-emerald-50 border-emerald-100",
                    icon: Award 
                  },
                  { 
                    label: "Alunos Sob Alerta", 
                    val: `${computedAlerts.filter(st => selectedClassTrend === 'all' || st.classId === selectedClassTrend).length} alunos`, 
                    change: "-18%", 
                    isPositive: true, 
                    desc: "atendimento preventivo ativo",
                    color: "text-rose-600 bg-rose-50 border-rose-100",
                    icon: AlertTriangle 
                  }
                ].map((kpi, idx) => (
                  <div key={idx} className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
                      <div className={`p-2 rounded-xl ${kpi.color}`}>
                        <kpi.icon size={16} />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-extrabold text-slate-900">{kpi.val}</span>
                        <span className={`text-[10px] font-bold ${kpi.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {kpi.change}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{kpi.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Geographic Student Distribution & Language Intelligence Map */}
              <GeographicIntelligenceMap 
                selectedCountryName={selectedGeoRegion}
                onCountrySelect={(name) => {
                  setSelectedGeoRegion(name);
                  addToast(`Região selecionada: ${name}. O Assistente de IA agora está sintonizado com este contexto!`);
                }}
              />

              {/* Data Visualization Charts Row */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Chart 1: Class Performance & Attendance Trends */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Desempenho & Frequência Geral</h3>
                      <p className="text-[10px] text-slate-400">Relação entre assiduidade escolar e médias gerais</p>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">Histórico Trimestral</span>
                  </div>
                  
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={evolutionData}>
                        <defs>
                          <linearGradient id="colorPerfGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorFreqGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} domain={[50, 100]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#F1F5F9', fontSize: '11px' }}
                          itemStyle={{ color: '#F1F5F9' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
                        <Area type="monotone" dataKey="mediaGeral" name="Média Acadêmica (%)" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorPerfGrad)" />
                        <Area type="monotone" dataKey="frequencia" name="Frequência Presencial (%)" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorFreqGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: CEFR Levels Distribution */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Distribuição de Níveis QECR (CEFR)</h3>
                      <p className="text-[10px] text-slate-400">Classificação linguística oficial de todos os alunos</p>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold">Alinhamento CEFR</span>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cefrData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#F1F5F9', fontSize: '11px' }}
                          cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }}
                        />
                        <Bar dataKey="value" name="Alunos Registados" fill="#6366F1" radius={[4, 4, 0, 0]}>
                          {cefrData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: AI Tutor Usage Stats */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Adoção de Tutorias LingoLIVE IA</h3>
                      <p className="text-[10px] text-slate-400">Volume diário de conversação virtual e quizzes de IA</p>
                    </div>
                    <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-semibold">Estudo Autónomo</span>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={evolutionData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#F1F5F9', fontSize: '11px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
                        <Line type="monotone" dataKey="sessoesIA" name="Sessões Diárias de IA" stroke="#F59E0B" strokeWidth={3} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Actionable At-Risk Student Alerts & Custom Intelligence Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column 1 & 2: Real-time At-Risk Student Alerts Table */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <AlertTriangle className="text-rose-500" size={16} />
                          <span>Alertas Ativos: Alunos em Risco Pedagógico</span>
                        </h3>
                        <p className="text-xs text-slate-400">Algoritmo preditivo de IA focado em evasão ou insuficiência académica.</p>
                      </div>

                      {/* Urgency Filter buttons */}
                      <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-0.5 text-[10px] font-bold text-slate-600">
                        <button 
                          onClick={() => setAtRiskFilter('all')}
                          className={`px-2 py-1 rounded-md transition-all ${atRiskFilter === 'all' ? 'bg-white text-slate-950 shadow-xs' : 'hover:bg-slate-100'}`}
                        >
                          Todos ({computedAlerts.filter(st => selectedClassTrend === 'all' || st.classId === selectedClassTrend).length})
                        </button>
                        <button 
                          onClick={() => setAtRiskFilter('critical')}
                          className={`px-2 py-1 rounded-md text-rose-700 transition-all ${atRiskFilter === 'critical' ? 'bg-rose-50 text-rose-950 shadow-xs' : 'hover:bg-slate-100'}`}
                        >
                          Crítico ({computedAlerts.filter(st => (selectedClassTrend === 'all' || st.classId === selectedClassTrend) && st.riskLevel === 'critical').length})
                        </button>
                        <button 
                          onClick={() => setAtRiskFilter('warning')}
                          className={`px-2 py-1 rounded-md text-amber-700 transition-all ${atRiskFilter === 'warning' ? 'bg-amber-50 text-amber-950 shadow-xs' : 'hover:bg-slate-100'}`}
                        >
                          Atenção ({computedAlerts.filter(st => (selectedClassTrend === 'all' || st.classId === selectedClassTrend) && st.riskLevel === 'warning').length})
                        </button>
                      </div>
                    </div>

                    {/* Alerts Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 text-[10px] uppercase">
                            <th className="p-3">Aluno</th>
                            <th className="p-3">Turma</th>
                            <th className="p-3">Média</th>
                            <th className="p-3">Frequência</th>
                            <th className="p-3">Atividade IA</th>
                            <th className="p-3">Nível Alerta</th>
                            <th className="p-3 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px] font-medium text-slate-700">
                          {activeAlerts.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="p-3 flex items-center gap-2">
                                <img src={row.avatar} alt={row.name} className="w-6 h-6 rounded-full object-cover" />
                                <span className="font-bold text-slate-800">{row.name}</span>
                              </td>
                              <td className="p-3 text-slate-500">{row.classId}</td>
                              <td className="p-3">
                                <span className={`font-bold ${row.grade < 65 ? 'text-rose-600' : 'text-amber-600'}`}>{row.grade}%</span>
                              </td>
                              <td className="p-3">
                                <span className={`font-bold ${row.attendance < 85 ? 'text-rose-600' : 'text-slate-700'}`}>{row.attendance}%</span>
                              </td>
                              <td className="p-3 text-slate-500 font-mono text-[10px]">{row.aiSessionsCount} sessões</td>
                              <td className="p-3">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${row.riskLevel === 'critical' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                                  {row.riskLevel === 'critical' ? 'Crítico' : 'Atenção'}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <button 
                                  onClick={() => {
                                    setSelectedAtRiskStudent(row);
                                    addToast(`Carregando análise preditiva de ${row.name}...`);
                                  }}
                                  className="text-[10px] font-bold text-indigo-600 hover:underline hover:text-indigo-800"
                                >
                                  Analisar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 mt-4 border-t border-slate-100 pt-2.5">
                    O limiar de perigo da LingoLIVE IA baseia-se em: (Frequência &lt; 85%) OU (Nota de Quizzes Semanais &lt; 65%) OU (Ausência de conversação em IA por mais de 7 dias úteis).
                  </p>
                </div>

                {/* Column 3: Diagnostic Details & Action Plan Panel */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  {selectedAtRiskStudent ? (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Diagnóstico Preditivo</span>
                        <button 
                          onClick={() => setSelectedAtRiskStudent(null)}
                          className="text-[10px] text-indigo-400 hover:underline"
                        >
                          Limpar Seleção
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <img 
                          src={selectedAtRiskStudent.avatar} 
                          alt={selectedAtRiskStudent.name} 
                          className="w-10 h-10 rounded-full object-cover border-2 border-slate-700" 
                        />
                        <div>
                          <h4 className="font-extrabold text-sm">{selectedAtRiskStudent.name}</h4>
                          <p className="text-[10px] text-slate-400">Turma {selectedAtRiskStudent.turma} • Média {selectedAtRiskStudent.grade}%</p>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 text-xs text-slate-300">
                        <p className="font-semibold text-white mb-1.5 flex items-center gap-1">
                          <Sparkles size={12} className="text-amber-400" />
                          <span>Comportamento Detectado:</span>
                        </p>
                        <p className="leading-relaxed text-[11px]">{selectedAtRiskStudent.reason}</p>
                      </div>

                      <div className="space-y-2 text-xs">
                        <p className="font-bold text-slate-300">Ações de Resgate Imediatas:</p>
                        
                        <button 
                          onClick={() => {
                            addToast(`Lançando plano de conversação focado para ${selectedAtRiskStudent.name}!`);
                            setSelectedAtRiskStudent(null);
                          }}
                          className="w-full py-1.5 bg-slate-800 hover:bg-slate-750 text-indigo-300 hover:text-white rounded-lg font-bold border border-slate-700 text-left px-3 text-[11px] transition-all"
                        >
                          🚀 Customizar AI Tutor de Recuperação
                        </button>

                        <button 
                          onClick={() => {
                            addToast(`Notificação enviada aos encarregados de ${selectedAtRiskStudent.name} via WhatsApp.`);
                            setSelectedAtRiskStudent(null);
                          }}
                          className="w-full py-1.5 bg-slate-800 hover:bg-slate-750 text-emerald-300 hover:text-white rounded-lg font-bold border border-slate-700 text-left px-3 text-[11px] transition-all"
                        >
                          💬 Alertar Pais/Encarregados no WhatsApp
                        </button>

                        <button 
                          onClick={() => {
                            addToast(`Aviso didático enviado ao professor de ${selectedAtRiskStudent.name}.`);
                            setSelectedAtRiskStudent(null);
                          }}
                          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-left px-3 text-[11px] transition-all"
                        >
                          👨‍🏫 Agendar Mentoria Presencial
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 py-12">
                      <div className="p-3.5 bg-slate-850 rounded-2xl border border-slate-800 mb-4 text-indigo-400">
                        <Sparkles size={28} className="animate-pulse" />
                      </div>
                      <h4 className="font-extrabold text-sm text-white">Análise Preditiva de Evasão</h4>
                      <p className="text-[11px] text-slate-400 mt-2 leading-relaxed max-w-[220px]">
                        Selecione qualquer aluno da tabela ao lado para abrir o dossiê pedagógico e executar ações automáticas baseadas em IA generativa.
                      </p>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-500 text-center mt-4">
                    Alimentado por Gemini 1.5 Flash Analytics Engine.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* 12. TAB: CONFIGURAÇÕES */}
          {activeTab === 'configuracoes' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900">Configurações Gerais do Hub</h2>
                <p className="text-sm text-slate-500">Parâmetros globais, idioma padrão da plataforma e segurança do perfil.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-xs space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="font-bold text-slate-600">Nome Oficial da Escola</label>
                    <input type="text" defaultValue="Colégio LingoLIVE Luanda" className="w-full mt-2 p-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600">Email Administrativo</label>
                    <input type="text" defaultValue="geral@col-lingolive.ao" className="w-full mt-2 p-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => addToast("Configurações atualizadas e salvas com sucesso!")}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
