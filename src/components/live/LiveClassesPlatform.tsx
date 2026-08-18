import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, Calendar as CalendarIcon, Users, Clock, PlayCircle, 
  Settings, Sparkles, MessageSquare, BookOpen, Star, 
  BarChart3, Shield, Globe, Mic, Monitor, BrainCircuit,
  MessageCircle, LayoutDashboard, FileText, Search
} from 'lucide-react';

type LCPSection = 'dashboard' | 'calendar' | 'teachers' | 'rooms' | 'recordings' | 'analytics';

export const LiveClassesPlatform: React.FC<{ activeView?: string; setView?: (v: any) => void }> = ({ activeView = "live-classes", setView }) => {
  const [activeSection, setActiveSection] = useState<LCPSection>('dashboard');

  useEffect(() => {
    if (activeView === 'live-classes' || activeView === 'live-dashboard') setActiveSection('dashboard');
    else if (activeView === 'live-calendar' || activeView === 'live-schedule') setActiveSection('calendar');
    else if (activeView === 'live-teachers') setActiveSection('teachers');
    else if (activeView === 'live-rooms') setActiveSection('rooms');
    else if (activeView === 'live-recordings') setActiveSection('recordings');
    else if (activeView === 'live-analytics') setActiveSection('analytics');
  }, [activeView]);

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* LCP Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800">Live Classes Platform</h1>
                <p className="text-slate-500 font-medium">LingoLIVE IA - LCP v1.0 (Enterprise)</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-xl border border-blue-100">
              <BrainCircuit className="w-4 h-4 text-blue-500" />
              <span className="font-bold text-blue-700">LACA Ativo</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <Video className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-emerald-700">14 Salas Abertas</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex overflow-x-auto pb-4 mb-4 gap-2 scrollbar-hide">
          {[
            { id: 'dashboard', label: 'Painel Central', icon: LayoutDashboard },
            { id: 'calendar', label: 'Agenda & Marcações', icon: CalendarIcon },
            { id: 'teachers', label: 'Professores Nativos', icon: Users },
            { id: 'rooms', label: 'Salas Inteligentes', icon: Monitor },
            { id: 'recordings', label: 'Gravações & Resumos', icon: PlayCircle },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as LCPSection)}
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
            {activeSection === 'dashboard' && <LCPDashboard />}
            {activeSection === 'calendar' && <LCPCalendar />}
            {activeSection === 'teachers' && <LCPTeachers />}
            {activeSection === 'rooms' && <LCPRooms />}
            {activeSection === 'recordings' && <LCPRecordings />}
            {activeSection === 'analytics' && <LCPAnalytics />}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
};

// --- SUBCOMPONENTS ---

const LCPDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { title: 'Próxima Aula', value: '14:30', trend: 'Inglês B2 - Conversação', icon: Clock, color: 'blue' },
        { title: 'Horas Concluídas', value: '42h', trend: '+4h esta semana', icon: Star, color: 'emerald' },
        { title: 'Traduções em Tempo Real', value: '1,204', trend: 'LACA Engine', icon: Globe, color: 'indigo' },
        { title: 'Resumos Gerados', value: '18', trend: 'Disponíveis na Biblioteca', icon: BookOpen, color: 'amber' }
      ].map((kpi, i) => (
        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-${kpi.color}-500`}>
            <kpi.icon className="w-24 h-24" />
          </div>
          <h3 className="text-sm font-bold text-slate-500 mb-2">{kpi.title}</h3>
          <span className="text-3xl font-black text-slate-800 mb-2 block">{kpi.value}</span>
          <span className={`text-xs font-bold text-${kpi.color}-600 bg-${kpi.color}-50 px-2 py-1 rounded-md inline-block`}>{kpi.trend}</span>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-slate-900 p-8 rounded-3xl border border-slate-800 py-12 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <BrainCircuit className="w-64 h-64 text-blue-400" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Live AI Classroom Assistant (LACA)</h3>
              <p className="text-blue-400 text-sm font-bold">Assistente Pedagógico em Tempo Real</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl">
              <MessageCircle className="w-5 h-5 text-emerald-400 mb-3" />
              <h4 className="text-white font-bold mb-2">Tradução Simultânea</h4>
              <p className="text-slate-300 text-sm">Tradução por frase adaptada ao nível CEFR, legendas automáticas e correção fonética em tempo real.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl">
              <FileText className="w-5 h-5 text-amber-400 mb-3" />
              <h4 className="text-white font-bold mb-2">Resumo Automático</h4>
              <p className="text-slate-300 text-sm">A IA gera o plano de revisão com conceitos abordados, novas palavras e expressões idiomáticas.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-500" />
          Agenda de Hoje
        </h3>
        <div className="flex-1 space-y-4">
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
            </div>
            <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">14:30 - 15:30</span>
            <h4 className="font-bold text-slate-800 text-md">Masterclass: Business English</h4>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-6 h-6 rounded-full bg-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700">SJ</div>
              <span className="text-sm text-slate-600">Sarah Johnson (Native)</span>
            </div>
            <button className="mt-3 bg-indigo-600 text-white text-sm font-bold py-2 rounded-xl hover:bg-indigo-700 transition-colors w-full">
              Entrar na Sala Virtual
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const LCPCalendar = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20 shadow-sm">
    <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <CalendarIcon className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">Agenda & Fusos Horários</h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Sincronização bidirecional com Google Calendar e Outlook. Gestão automática de fusos horários, notificações e lembretes para que nunca perca uma sessão.
    </p>
  </div>
);

const LCPTeachers = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20 shadow-sm">
    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <Users className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">Professores & Embaixadores</h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Filtre especialistas nativos por país, dialeto, especialização (ex: Preparação IELTS, Business) ou marque sessões informais com Embaixadores Linguísticos.
    </p>
  </div>
);

const LCPRooms = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20 shadow-sm">
    <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <Monitor className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">Salas Virtuais Inteligentes</h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Áudio e Vídeo HD com ultra baixa latência. Quadro branco colaborativo (Real-time Canvas), Breakout Rooms e Biblioteca de Aula integrada na própria sala.
    </p>
  </div>
);

const LCPRecordings = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20 shadow-sm">
    <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <PlayCircle className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">Gravações & Transcrições</h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Aceda ao replay das suas aulas. A IA gera transcrições interativas, destacando vocabulário novo e criando flashcards automaticamente após cada sessão.
    </p>
  </div>
);

const LCPAnalytics = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20 shadow-sm">
    <div className="w-20 h-20 bg-fuchsia-50 text-fuchsia-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <BarChart3 className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">Analytics de Participação</h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Monitorize a taxa de presença, a evolução nas avaliações do professor e a eficácia das intervenções pedagógicas via Knowledge Graph Engine.
    </p>
  </div>
);
