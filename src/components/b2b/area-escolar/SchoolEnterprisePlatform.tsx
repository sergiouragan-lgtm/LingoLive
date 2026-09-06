import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Users, BookOpen, GraduationCap, BarChart3, 
  Calendar, CreditCard, Shield, Settings, Sparkles,
  TrendingUp, AlertTriangle, CheckCircle, Globe, Search,
  Activity, Map, LayoutDashboard, BrainCircuit, FileText,
  Clock, Server, Lock, Download, ChevronRight, Zap
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip as RechartsTooltip, BarChart, Bar, Legend, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

type SEPSection = 'dashboard' | 'command-center' | 'students' | 'teachers' | 'classes' | 'financial' | 'analytics' | 'security';

export const SchoolEnterprisePlatform: React.FC<{ activeView?: string; setView?: (v: string) => void }> = ({ activeView = "dashboard", setView }) => {
  const [activeSection, setActiveSection] = useState<SEPSection>('dashboard');

  useEffect(() => {
    if (activeView === 'dashboard' || activeView === 'school-management' || activeView === 'area-escolar-b2b') setActiveSection('dashboard');
    else if (activeView === 'alunos') setActiveSection('students');
    else if (activeView === 'professores') setActiveSection('teachers');
    else if (activeView === 'turmas' || activeView === 'salas' || activeView === 'horarios' || activeView === 'disciplinas' || activeView === 'certificados' || activeView === 'biblioteca') setActiveSection('classes');
    else if (activeView === 'frequencia' || activeView === 'analytics') setActiveSection('analytics');
    else if (activeView === 'financeiro') setActiveSection('financial');
    else if (activeView === 'ia-escolar') setActiveSection('command-center');
    else if (activeView === 'configuracoes-escola') setActiveSection('security');
  }, [activeView]);

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* SEP Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800">School Enterprise Platform</h1>
                <p className="text-slate-500 font-medium">LingoLIVE IA - SEP v1.0 (Enterprise)</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-xl border border-blue-100">
              <Globe className="w-4 h-4 text-blue-500" />
              <span className="font-bold text-blue-700">3 Campus Ativos</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <Users className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-emerald-700">4,250 Alunos</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex overflow-x-auto pb-4 mb-4 gap-2 scrollbar-hide">
          {[
            { id: 'dashboard', label: 'Dashboard Executivo', icon: LayoutDashboard },
            { id: 'command-center', label: 'AI Command Center', icon: BrainCircuit },
            { id: 'students', label: 'Gestão de Alunos', icon: Users },
            { id: 'teachers', label: 'Corpo Docente', icon: GraduationCap },
            { id: 'classes', label: 'Turmas & Cursos', icon: BookOpen },
            { id: 'financial', label: 'Financeiro B2B', icon: CreditCard },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'security', label: 'Segurança & Auditoria', icon: Shield },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as SEPSection)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                activeSection === item.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeSection === 'dashboard' && <SEPDashboard />}
            {activeSection === 'command-center' && <SEPCommandCenter />}
            {activeSection === 'students' && <SEPStudents />}
            {activeSection === 'teachers' && <SEPTeachers />}
            {activeSection === 'classes' && <SEPClasses />}
            {activeSection === 'financial' && <SEPFinancial />}
            {activeSection === 'analytics' && <SEPAnalytics />}
            {activeSection === 'security' && <SEPSecurity />}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
};

// --- SUBCOMPONENTS ---

const SEPDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { title: 'Total de Alunos', value: '4,250', trend: '+12% este mês', icon: Users, color: 'blue' },
        { title: 'Corpo Docente', value: '142', trend: '+5 novas contratações', icon: GraduationCap, color: 'emerald' },
        { title: 'Nível Médio (CEFR)', value: 'B1+', trend: 'Aumento desde A2', icon: Activity, color: 'indigo' },
        { title: 'Licenças Ativas', value: '4,500', trend: '250 disponíveis', icon: Shield, color: 'amber' }
      ].map((kpi, i) => (
        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-${kpi.color}-500`}>
            <kpi.icon className="w-24 h-24" />
          </div>
          <h3 className="text-sm font-bold text-slate-500 mb-2">{kpi.title}</h3>
          <span className="text-4xl font-black text-slate-800 mb-2 block">{kpi.value}</span>
          <span className={`text-xs font-bold text-${kpi.color}-600 bg-${kpi.color}-50 px-2 py-1 rounded-md`}>{kpi.trend}</span>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800">Crescimento de Matrículas</h3>
          <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-600 outline-none">
            <option>Ano Letivo 2026/2027</option>
            <option>Ano Letivo 2025/2026</option>
          </select>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[
              { month: 'Set', alunos: 3100 }, { month: 'Out', alunos: 3400 },
              { month: 'Nov', alunos: 3600 }, { month: 'Dez', alunos: 3650 },
              { month: 'Jan', alunos: 3800 }, { month: 'Fev', alunos: 4000 },
              { month: 'Mar', alunos: 4250 }
            ]}>
              <defs>
                <linearGradient id="colorAlunos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <RechartsTooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
              <Area type="monotone" dataKey="alunos" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAlunos)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Alertas Institucionais
        </h3>
        <div className="flex-1 space-y-4">
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Risco de Evasão Aumentado</h4>
              <p className="text-xs text-slate-600 mt-1">IA detetou 45 alunos no Campus Norte com queda abrupta de frequência.</p>
            </div>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
            <Clock className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Licenças Próximas do Fim</h4>
              <p className="text-xs text-slate-600 mt-1">Renovação do pacote B2B de 5.000 licenças agendada para daqui a 15 dias.</p>
            </div>
          </div>
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Meta CEFR Atingida</h4>
              <p className="text-xs text-slate-600 mt-1">A Turma "Avançado C1" atingiu a proficiência esperada com 2 meses de antecedência.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const SEPCommandCenter = () => (
  <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 py-16 relative overflow-hidden">
    <div className="absolute top-0 right-0 p-8 opacity-10">
      <BrainCircuit className="w-64 h-64 text-blue-400" />
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/30">
          <Sparkles className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">School AI Command Center</h2>
          <p className="text-blue-400 font-medium text-sm">Controlo Institucional & Previsões Estratégicas</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-400"/> Projeções de Matrícula (Próx. Trimestre)</h3>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            Com base nos dados históricos e taxa de conversão atual das campanhas de admissão, a IA prevê um <strong>aumento de 18%</strong> nas novas matrículas para o Q4.
          </p>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-[75%] rounded-full"></div>
          </div>
          <span className="text-xs text-blue-300 mt-2 block">Confiança da IA: 92%</span>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
           <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-emerald-400"/> Otimização Operacional Sugerida</h3>
           <ul className="space-y-3">
             <li className="flex items-start gap-3">
               <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle className="w-3 h-3 text-emerald-400" /></div>
               <p className="text-xs text-slate-300 leading-relaxed">
                 <strong className="text-white">Alocação de Salas:</strong> Sugestão de re-alocar 15 turmas do Campus Sul para formato híbrido, poupando ~20% em custos de energia e espaço.
               </p>
             </li>
             <li className="flex items-start gap-3">
               <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle className="w-3 h-3 text-emerald-400" /></div>
               <p className="text-xs text-slate-300 leading-relaxed">
                 <strong className="text-white">Intervenção Pedagógica:</strong> Atraso curricular detetado em 3 turmas do 10º ano (Matemática). A IA sugere 2 módulos de revisão antes das provas finais.
               </p>
             </li>
           </ul>
        </div>
      </div>
    </div>
  </div>
);

const SEPStudents = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20">
    <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <Users className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">Gestão Centralizada de Alunos</h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Matrículas, histórico académico, portal para encarregados de educação, importação em massa (CSV/API) e tracking completo do ciclo de vida estudantil.
    </p>
  </div>
);

const SEPTeachers = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20">
    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <GraduationCap className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">Gestão do Corpo Docente</h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Contratação, distribuição de carga horária, perfis de especialidade, gestão de disponibilidade e acompanhamento de avaliações de desempenho.
    </p>
  </div>
);

const SEPClasses = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20">
    <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <BookOpen className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">Turmas & Gestão Curricular</h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Crie currículos próprios ou utilize a framework global. Aloque turmas online, híbridas ou presenciais, com suporte total multi-campus.
    </p>
  </div>
);

const SEPFinancial = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20">
    <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <CreditCard className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">Módulo Financeiro & Licenciamento</h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Controlo total B2B. Faturação centralizada, gestão de subscrições (por aluno, professor ou site license), integrações com ERPs e relatórios de ROI.
    </p>
  </div>
);

const SEPAnalytics = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20">
    <div className="w-20 h-20 bg-fuchsia-50 text-fuchsia-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <BarChart3 className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">Analytics Institucionais (Macro)</h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Dashboards consolidados comparando o desempenho entre campus, turmas e professores, gerando relatórios formatados para as direções e órgãos executivos.
    </p>
  </div>
);

const SEPSecurity = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20">
    <div className="w-20 h-20 bg-slate-800 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <Shield className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">Zero Trust Security & Auditoria</h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Isolamento absoluto Multi-Tenant, Role-Based Access Control (RBAC) granular, logs imutáveis, SSO e conformidade RGPD/GDPR out-of-the-box.
    </p>
  </div>
);
