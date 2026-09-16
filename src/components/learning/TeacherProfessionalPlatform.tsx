import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Users, BookOpen, PenTool, Sparkles, 
  BarChart3, Calendar, FileText, CheckCircle, BrainCircuit,
  MessageSquare, ShieldCheck, Play, Plus, Search, Settings,
  AlertTriangle, TrendingUp, Clock, Globe, Award, Heart, Cpu,
  GraduationCap, ArrowRight
} from 'lucide-react';

type TPPSection = 'dashboard' | 'classes' | 'planning' | 'builder' | 'ai-copilot' | 'analytics' | 'live';

export const TeacherProfessionalPlatform: React.FC<{ activeView?: string; setView?: (v: string) => void }> = ({ activeView = "dashboard", setView }) => {
  const [activeSection, setActiveSection] = useState<TPPSection>('dashboard');

  useEffect(() => {
    // Map existing activeViews to TPPSections if needed
    if (activeView === 'dashboard' || activeView === 'cms') setActiveSection('dashboard');
    else if (activeView === 'turmas' || activeView === 'minhas-turmas' || activeView === 'meus-alunos') setActiveSection('classes');
    else if (activeView === 'avaliacoes' || activeView === 'trabalhos') setActiveSection('builder');
    else if (activeView === 'ia-professor') setActiveSection('ai-copilot');
    else if (activeView === 'calendario' || activeView === 'biblioteca') setActiveSection('planning');
    else if (activeView === 'comunicacao' || activeView === 'mensagens') setActiveSection('live');
    else if (activeView === 'analytics' || activeView === 'presencas') setActiveSection('analytics'); // or another mapping
  }, [activeView]);

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* TPP Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800">Teacher Professional Platform</h1>
                <p className="text-slate-500 font-medium">LingoLIVE IA Enterprise Edition - TPP v1.0</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <Users className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-emerald-700">142 Alunos</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-xl border border-indigo-100">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span className="font-bold text-indigo-700">Copilot Ativo</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex overflow-x-auto pb-4 mb-4 gap-2 scrollbar-hide">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'classes', label: 'Turmas & Alunos', icon: Users },
            { id: 'planning', label: 'Planeamento', icon: Calendar },
            { id: 'builder', label: 'Construtor (Provas/Exames)', icon: PenTool },
            { id: 'ai-copilot', label: 'Teacher AI Copilot', icon: BrainCircuit },
            { id: 'live', label: 'Aulas ao Vivo', icon: Play },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as TPPSection)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                activeSection === item.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
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
            {activeSection === 'dashboard' && <TPPDashboard />}
            {activeSection === 'classes' && <TPPClasses />}
            {activeSection === 'planning' && <TPPPlanning />}
            {activeSection === 'builder' && <TPPBuilder />}
            {activeSection === 'ai-copilot' && <TPPAICopilot />}
            {activeSection === 'live' && <TPPLiveClasses />}
            {activeSection === 'analytics' && <TPPAnalytics />}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
};

// --- SUBCOMPONENTS ---

const TPPDashboard = () => (
  <div className="space-y-6">
    {/* Copilot Insights */}
    <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-900/20">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <BrainCircuit className="w-48 h-48" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-500/30 rounded-full flex items-center justify-center backdrop-blur-md border border-indigo-400/30">
            <Sparkles className="w-5 h-5 text-indigo-300" />
          </div>
          <h2 className="text-xl font-bold">Teacher AI Copilot Resumo Diário</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:bg-white/15 transition-colors">
            <h3 className="text-indigo-200 text-sm font-bold flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" /> Atenção Necessária
            </h3>
            <p className="text-white text-sm leading-relaxed">
              <strong>3 alunos</strong> na turma "Inglês B2 Intensivo" apresentam risco de desmotivação (queda de 40% na participação).
            </p>
            <button className="mt-3 text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1">
              Ver Plano de Intervenção <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:bg-white/15 transition-colors">
            <h3 className="text-indigo-200 text-sm font-bold flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4" /> Correções Pendentes
            </h3>
            <p className="text-white text-sm leading-relaxed">
              <strong>12 redações</strong> submetidas pela turma C1. A IA já realizou a pré-correção e sugeriu feedback.
            </p>
            <button className="mt-3 text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1">
              Validar Correções <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:bg-white/15 transition-colors">
            <h3 className="text-indigo-200 text-sm font-bold flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" /> Próxima Aula
            </h3>
            <p className="text-white text-sm leading-relaxed">
              "Business English Negotiations" às 14:00. O material gerado pela IA já está sincronizado no quadro interativo.
            </p>
            <button className="mt-3 text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1">
              Rever Material <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
       <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
         <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
           <Users className="w-5 h-5 text-indigo-600" />
           As Minhas Turmas
         </h3>
         <div className="space-y-4">
           {[
             { name: "Inglês B2 Intensivo", students: 24, performance: 85, nextClass: "Hoje, 14:00" },
             { name: "Inglês C1 Corporativo", students: 12, performance: 92, nextClass: "Amanhã, 09:00" },
             { name: "Espanhol A2 Iniciação", students: 18, performance: 78, nextClass: "Amanhã, 11:30" },
           ].map((cls, i) => (
             <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-indigo-200 transition-colors cursor-pointer group">
               <div>
                 <h4 className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{cls.name}</h4>
                 <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                   <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {cls.students} alunos</span>
                   <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {cls.nextClass}</span>
                 </div>
               </div>
               <div className="text-right">
                 <span className="text-sm font-black text-emerald-600 block">{cls.performance}%</span>
                 <span className="text-[10px] text-slate-400 font-bold uppercase">Performance</span>
               </div>
             </div>
           ))}
         </div>
       </div>

       <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
         <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
           <Clock className="w-5 h-5 text-indigo-600" />
           Agenda & Tarefas
         </h3>
         <div className="relative border-l-2 border-slate-100 pl-4 space-y-6">
           <div className="relative">
             <div className="absolute -left-[21px] top-1 w-3 h-3 bg-indigo-600 rounded-full border-2 border-white"></div>
             <p className="text-xs font-bold text-indigo-600 mb-1">14:00 - 15:30</p>
             <h4 className="font-bold text-slate-800 text-sm">Aula ao Vivo: Business English</h4>
             <p className="text-xs text-slate-500">Turma C1 Corporativo</p>
           </div>
           <div className="relative">
             <div className="absolute -left-[21px] top-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
             <p className="text-xs font-bold text-emerald-600 mb-1">Pendente</p>
             <h4 className="font-bold text-slate-800 text-sm">Validar correções geradas pela IA</h4>
             <p className="text-xs text-slate-500">12 Redações da Turma B2</p>
           </div>
           <div className="relative opacity-60">
             <div className="absolute -left-[21px] top-1 w-3 h-3 bg-slate-300 rounded-full border-2 border-white"></div>
             <p className="text-xs font-bold text-slate-500 mb-1">Amanhã</p>
             <h4 className="font-bold text-slate-800 text-sm">Preparar Simulado Mensal</h4>
             <p className="text-xs text-slate-500">LingoLIVE IA gerará o draft inicial.</p>
           </div>
         </div>
       </div>
    </div>
  </div>
);

const TPPClasses = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20">
    <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <Users className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">Gestão Integrada de Turmas e Alunos</h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Acompanhe o perfil, evolução CEFR, competências e alertas da IA para cada aluno em tempo real. Crie e organize grupos com facilidade.
    </p>
  </div>
);

const TPPPlanning = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20">
    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <Calendar className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">Planeamento Pedagógico Inteligente</h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Defina planos anuais, mensais ou semanais. O Adaptive Learning Path Engine (ALPE) ajusta automaticamente as suas metas com base na evolução real da turma.
    </p>
  </div>
);

const TPPBuilder = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20">
    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <PenTool className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">Construtor Profissional (Drag & Drop)</h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Crie testes, exames e simulados profissionais com suporte multimédia. Utilize a IA para gerar bancos de perguntas instantâneos. Submeta para aprovação LARS.
    </p>
  </div>
);

const TPPAICopilot = () => (
  <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 py-16 relative overflow-hidden">
    <div className="absolute top-0 right-0 p-8 opacity-10">
      <Cpu className="w-64 h-64 text-indigo-400" />
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/30">
          <Sparkles className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">Teacher AI Copilot</h2>
          <p className="text-indigo-400 font-medium text-sm">O seu Colega de Trabalho Digital</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
          <h3 className="text-white font-bold mb-4">Apoio na Preparação</h3>
          <ul className="space-y-3">
             <li className="flex items-start gap-3">
               <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle className="w-3 h-3 text-indigo-400" /></div>
               <p className="text-xs text-slate-300 leading-relaxed">Gera planos de aula detalhados com base no currículo e nível da turma.</p>
             </li>
             <li className="flex items-start gap-3">
               <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle className="w-3 h-3 text-indigo-400" /></div>
               <p className="text-xs text-slate-300 leading-relaxed">Cria exercícios e flashcards personalizados em segundos.</p>
             </li>
          </ul>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
          <h3 className="text-white font-bold mb-4">Correção Assistida</h3>
          <ul className="space-y-3">
             <li className="flex items-start gap-3">
               <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle className="w-3 h-3 text-emerald-400" /></div>
               <p className="text-xs text-slate-300 leading-relaxed">Pré-correção automática de redações e respostas curtas (Auto-Grading).</p>
             </li>
             <li className="flex items-start gap-3">
               <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle className="w-3 h-3 text-emerald-400" /></div>
               <p className="text-xs text-slate-300 leading-relaxed">Deteta padrões de dificuldade (ex: 70% da turma falhou na Passiva).</p>
             </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

const TPPLiveClasses = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20">
    <div className="w-20 h-20 bg-sky-50 text-sky-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <Play className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">Aulas ao Vivo (Live Classes)</h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Estúdio completo com gravação, quadro branco, salas paralelas (breakout rooms) e transcrição automática / resumo da aula gerado por IA para os alunos.
    </p>
  </div>
);

const TPPAnalytics = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20">
    <div className="w-20 h-20 bg-fuchsia-50 text-fuchsia-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <BarChart3 className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">Analytics Pedagógicos Enterprise</h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Preveja abandonos e detete falhas curriculares através de Dashboards avançados. Integra perfeitamente com os dados gerados pelo Knowledge Graph Engine (KGE).
    </p>
  </div>
);
