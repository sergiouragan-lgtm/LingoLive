import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, BookOpen, Calendar, MessageSquare, TrendingUp, Award, 
  HeartHandshake, Settings, Plus, Search, HelpCircle, ArrowRight, 
  Sparkles, ShieldCheck, CheckSquare, Sliders, ChevronRight, Play, 
  CheckCircle, AlertCircle, RefreshCw, Send, Trash2, Filter, Download, 
  Edit2, Check, BarChart2, PieChart, Trophy, BookOpenCheck, 
  FileSignature, ThumbsUp, Volume2, Layers, ListTodo, Bookmark, 
  Newspaper, ClipboardList, Target, Library, ShoppingCart, Globe, Image,
  Eye, PlayCircle, Database, Clock, Cpu
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, BarChart as RechartsBarChart, Bar, Cell, PieChart as RechartsPieChart, Pie
} from 'recharts';

interface ViewProps {
  triggerToast: (msg: string) => void;
  classes?: any[];
  courses?: any[];
}

// ----------------------------------------------------
// 1. ALUNOS VIEW
// ----------------------------------------------------
export const AlunosView: React.FC<ViewProps> = ({ triggerToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [aiFeedback, setAiFeedback] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const students = [
    { id: 's1', name: 'Marta Rebelo', avatar: '👩‍💼', fluencyScore: 84, attendance: 96, streak: 12, lastActive: 'Hoje', confidence: 'Alta', email: 'marta.r@company.com', class: 'Turma Alfa', activeMinutes: 240, audioCount: 42, commonErrors: 'Uso de preposições (agree in vs. agree on)' },
    { id: 's2', name: 'Ricardo Dias', avatar: '👨‍💼', fluencyScore: 78, attendance: 92, streak: 9, lastActive: 'Ontem', confidence: 'Média', email: 'ricardo.d@tech.pt', class: 'Turma Alfa', activeMinutes: 180, audioCount: 28, commonErrors: 'Pronúncia de consoantes oclusivas' },
    { id: 's3', name: 'Ana Filipa', avatar: '👩‍💻', fluencyScore: 88, attendance: 98, streak: 15, lastActive: 'Há 2 dias', confidence: 'Alta', email: 'ana.f@dev.io', class: 'Turma Alfa', activeMinutes: 310, audioCount: 56, commonErrors: 'Nenhum erro recorrente' },
    { id: 's4', name: 'Tiago Santos', avatar: '👨‍🎨', fluencyScore: 68, attendance: 85, streak: 4, lastActive: 'Ontem', confidence: 'Média', email: 'tiago.s@design.pt', class: 'Turma Beta', activeMinutes: 120, audioCount: 14, commonErrors: 'Falta de vocabulário acadêmico' },
    { id: 's5', name: 'Sara Costa', avatar: '👩‍🔬', fluencyScore: 92, attendance: 100, streak: 22, lastActive: 'Hoje', confidence: 'Alta', email: 'sara.c@health.org', class: 'Turma Alfa', activeMinutes: 420, audioCount: 88, commonErrors: 'Ritmo rápido de fala' },
    { id: 's6', name: 'Carlos Cruz', avatar: '👨‍💻', fluencyScore: 74, attendance: 90, streak: 8, lastActive: 'Ontem', confidence: 'Média', email: 'carlos.c@corp.com', class: 'Turma Beta', activeMinutes: 145, audioCount: 21, commonErrors: 'Gerúndio após preposições' },
    { id: 's7', name: 'Beatriz Lima', avatar: '👩‍⚕️', fluencyScore: 80, attendance: 94, streak: 11, lastActive: 'Hoje', confidence: 'Alta', email: 'beatriz.l@hospital.pt', class: 'Turma Beta', activeMinutes: 210, audioCount: 33, commonErrors: 'Entonação de perguntas' },
  ];

  const filtered = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSendAiMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiFeedback.trim()) return;
    setSendingMsg(true);
    setTimeout(() => {
      triggerToast(`✉️ Dica de IA enviada para o e-mail de ${selectedStudent.name}!`);
      setAiFeedback('');
      setSendingMsg(false);
      setSelectedStudent(null);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-display">Alunos Registrados</h2>
          <p className="text-xs text-slate-400">Controle individual de proficiência, tempo ativo e feedbacks auxiliados por IA.</p>
        </div>
        <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input 
            type="text" 
            placeholder="Pesquisar aluno..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none text-xs text-slate-100 placeholder:text-slate-650 focus:outline-none focus:ring-0 w-full font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-850">
                    <th className="pb-3 font-black uppercase tracking-wider">Aluno</th>
                    <th className="pb-3 font-black uppercase tracking-wider">Turma</th>
                    <th className="pb-3 font-black uppercase tracking-wider">Fluência</th>
                    <th className="pb-3 font-black uppercase tracking-wider">Ofensiva</th>
                    <th className="pb-3 font-black uppercase tracking-wider text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-3.5 flex items-center gap-2.5">
                        <span className="text-xl">{s.avatar}</span>
                        <div>
                          <p className="font-bold text-slate-200 text-xs sm:text-sm">{s.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{s.email}</p>
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-350 font-medium">{s.class}</td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black font-mono text-xs text-indigo-400">{s.fluencyScore}%</span>
                          <div className="w-16 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                            <div className="h-full bg-indigo-500" style={{ width: `${s.fluencyScore}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/10 px-2 py-0.5 rounded font-black font-mono text-[10px]">
                          ⚡ {s.streak} dias
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button 
                          onClick={() => {
                            setSelectedStudent(s);
                            triggerToast(`🔍 Perfil de ${s.name} carregado no painel lateral!`);
                          }}
                          className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Ver Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right side: Student detail and AI action */}
        <div>
          {selectedStudent ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-5 sticky top-24">
              <div className="flex items-start gap-3 border-b border-slate-850 pb-4">
                <span className="text-4xl">{selectedStudent.avatar}</span>
                <div>
                  <h3 className="font-extrabold text-slate-100 text-base">{selectedStudent.name}</h3>
                  <p className="text-[11px] text-slate-400">{selectedStudent.class} • {selectedStudent.email}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Confiança Estimada: {selectedStudent.confidence}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 text-xs">
                <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Minutos Ativos</span>
                  <strong className="text-slate-200 font-mono font-black text-sm">{selectedStudent.activeMinutes} min</strong>
                </div>
                <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Áudios Gravados</span>
                  <strong className="text-slate-200 font-mono font-black text-sm">{selectedStudent.audioCount} gravações</strong>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-rose-400 font-black uppercase tracking-wider block">Erros Gramaticais Frequentes</span>
                <p className="text-xs bg-rose-500/5 border border-rose-500/15 text-rose-300 p-3 rounded-xl italic font-medium leading-relaxed">
                  "{selectedStudent.commonErrors}"
                </p>
              </div>

              {/* IA Assist direct email feedback */}
              <form onSubmit={handleSendAiMessage} className="space-y-3.5 pt-3 border-t border-slate-850">
                <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-black uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>Disparar Dica Pedagógica IA</span>
                </div>
                <textarea
                  value={aiFeedback}
                  onChange={(e) => setAiFeedback(e.target.value)}
                  placeholder={`Mande um exercício adaptado para ${selectedStudent.name.split(' ')[0]} focado no erro detectado...`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 h-24 resize-none font-medium"
                />
                <button
                  type="submit"
                  disabled={sendingMsg || !aiFeedback.trim()}
                  className="w-full py-2 bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-500/50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {sendingMsg ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Enviar por E-mail</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-10 text-center text-xs text-slate-500 space-y-3">
              <Users className="w-12 h-12 mx-auto text-slate-700 opacity-40" />
              <p className="font-bold text-slate-400">Nenhum Aluno Selecionado</p>
              <p className="max-w-xs mx-auto">Clique em "Ver Detalhes" para carregar as métricas individuais e disparar feedbacks automáticos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 2. AULAS VIEW
// ----------------------------------------------------
export const AulasView: React.FC<ViewProps> = ({ triggerToast }) => {
  const [syllabusClass, setSyllabusClass] = useState('Turma Alfa');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [creatingLesson, setCreatingLesson] = useState(false);

  const lessons = [
    { id: 'l1', title: 'Pitching Commercial Achievements', class: 'Turma Alfa', duration: '50 min', date: 'Hoje, 19:00', type: 'Conversação', status: 'Agendada' },
    { id: 'l2', title: 'Salary Review and Negotiation Tactics', class: 'Turma Alfa', duration: '50 min', date: 'Amanhã, 18:30', type: 'Roleplay', status: 'Agendada' },
    { id: 'l3', title: 'IELTS Speaking Section 2 Boot Camp', class: 'Turma Beta', duration: '60 min', date: '18 Jul, 14:00', type: 'Prática Intensiva', status: 'Agendada' },
    { id: 'l4', title: 'Customer Support Empathy Vocabulary', class: 'Turma Gama', duration: '45 min', date: '20 Jul, 11:00', type: 'Vocabulário', status: 'Agendada' },
  ];

  const handleScheduleLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic.trim()) return;
    setCreatingLesson(true);
    setTimeout(() => {
      triggerToast(`📅 Aula "${selectedTopic}" agendada com sucesso para a ${syllabusClass}!`);
      setSelectedTopic('');
      setCreatingLesson(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-display">Aulas & Planejador de Conteúdo</h2>
        <p className="text-xs text-slate-400">Programe as sessões de conversação ao vivo, defina os ementas de aula e acompanhe o plano letivo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider border-b border-slate-850 pb-2">Aulas Próximas na Agenda</h3>
            <div className="space-y-3">
              {lessons.map((l) => (
                <div key={l.id} className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 text-[8px] font-black uppercase font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
                      {l.type}
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-100">{l.title}</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Turma: {l.class} • Duração: {l.duration}</p>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-xs font-mono text-indigo-300 font-bold">{l.date}</span>
                    <button 
                      onClick={() => triggerToast(`🚀 Iniciando sala virtual de conversação para "${l.title}"...`)}
                      className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 fill-slate-950" /> Entrar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Schedule panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider border-b border-slate-850 pb-2">Agendar Nova Aula</h3>
          <form onSubmit={handleScheduleLesson} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Selecione a Turma</label>
              <select
                value={syllabusClass}
                onChange={(e) => setSyllabusClass(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
              >
                <option>Turma Alfa (Inglês Executive)</option>
                <option>Turma Beta (IELTS Prep)</option>
                <option>Turma Gama (Beginners)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Tema ou Assunto da Aula</label>
              <input
                type="text"
                placeholder="Ex: Apresentação de KPIs Comerciais..."
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-250 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Data e Hora</label>
              <input
                type="datetime-local"
                defaultValue="2026-07-20T19:00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={creatingLesson || !selectedTopic.trim()}
              className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-500/50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {creatingLesson ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Agendar Aula</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 3. CALENDÁRIO VIEW
// ----------------------------------------------------
export const CalendarioView: React.FC<ViewProps> = ({ triggerToast }) => {
  const [currentMonth, setCurrentMonth] = useState('Julho 2026');
  
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  // Scheduled events on specific days
  const events: { [key: number]: { title: string; class: string; type: string } } = {
    6: { title: 'Exame Final Oral', class: 'Turma Alfa', type: 'exam' },
    12: { title: 'Apresentação de KPI', class: 'Turma Alfa', type: 'class' },
    17: { title: 'Simulado IELTS Oral', class: 'Turma Beta', type: 'test' },
    22: { title: 'Revisão Gramatical', class: 'Turma Gama', type: 'class' },
    28: { title: 'Pitch Competitivo', class: 'Turma Alfa', type: 'contest' }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-display">Calendário Escolar</h2>
          <p className="text-xs text-slate-400">Controle de datas importantes, exames orais, aulas de conversação e publicação de atividades.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-1.5 text-xs text-slate-200 font-bold font-mono">
          <span>{currentMonth}</span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-6">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2.5 text-center">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <span key={day} className="text-[10px] font-black uppercase tracking-wider text-slate-500 py-2">{day}</span>
          ))}

          {/* Spacer for offset days */}
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={`offset-${idx}`} className="bg-slate-950/20 border border-transparent rounded-2xl h-24 opacity-20" />
          ))}

          {daysInMonth.map((day) => {
            const hasEvent = events[day];
            return (
              <div 
                key={day} 
                onClick={() => {
                  if (hasEvent) {
                    triggerToast(`📅 Evento em ${day} de Julho: ${hasEvent.title} (${hasEvent.class})`);
                  } else {
                    triggerToast(`➕ Cadastrar evento ou atividade em ${day} de Julho...`);
                  }
                }}
                className={`bg-slate-950 border hover:border-slate-700/60 p-2.5 rounded-2xl h-24 text-left flex flex-col justify-between transition-all cursor-pointer relative group ${
                  hasEvent ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-slate-850/60'
                }`}
              >
                <span className={`text-xs font-black font-mono ${hasEvent ? 'text-indigo-400' : 'text-slate-500'}`}>{day}</span>
                {hasEvent && (
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-bold text-slate-200 line-clamp-1 leading-tight">{hasEvent.title}</p>
                    <p className="text-[8px] text-slate-500 line-clamp-1 font-semibold">{hasEvent.class}</p>
                  </div>
                )}
                {!hasEvent && (
                  <span className="text-[8px] text-slate-650 opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase tracking-wider">➕ Adicionar</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 4. CHAT VIEW
// ----------------------------------------------------
export const ChatView: React.FC<ViewProps> = ({ triggerToast }) => {
  const [activeChannel, setActiveChannel] = useState('Turma Alfa');
  const [messages, setMessages] = useState<any[]>([
    { sender: 'Marta Rebelo', text: 'Professor, posso enviar meu pitch gravado de novo para a IA reavaliar?', time: '14:20', isTeacher: false },
    { sender: 'LingoLIVE AI', text: 'Olá Marta! Sua tentativa anterior teve nota 84. Pratique o fonema /θ/ (th) antes de reenviar para bater sua meta de 90.', time: '14:22', isTeacher: false, isAi: true },
    { sender: 'Professor (Você)', text: 'Com certeza Marta! Recomendo focar nos feedbacks de vocabulário avançado que a IA gerou.', time: '14:35', isTeacher: true },
  ]);
  const [newMsg, setNewMsg] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    const msg = {
      sender: 'Professor (Você)',
      text: newMsg,
      time: 'Agora',
      isTeacher: true
    };
    setMessages(prev => [...prev, msg]);
    setNewMsg('');
    triggerToast('✉️ Mensagem publicada no canal!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-display">Canais de Discussão & IA Chat</h2>
        <p className="text-xs text-slate-400">Comunicação em tempo real com as turmas e interações com o Tutor AI Core integrado.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden h-[550px]">
        {/* Left sidebar: Channels */}
        <div className="border-r border-slate-850 p-4 flex flex-col gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Canais Ativos</span>
          {['Turma Alfa (Inglês Executive)', 'Turma Beta (IELTS Prep)', 'Suporte Escolar / IA Tutor'].map((ch) => (
            <button
              key={ch}
              onClick={() => {
                setActiveChannel(ch);
                triggerToast(`💬 Canal alterado para: ${ch}`);
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeChannel.includes(ch.split(' ')[0])
                  ? 'bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 font-extrabold'
                  : 'text-slate-400 hover:bg-slate-950/40 hover:text-slate-200'
              }`}
            >
              # {ch}
            </button>
          ))}
        </div>

        {/* Right chat logs */}
        <div className="lg:col-span-3 flex flex-col justify-between h-full bg-slate-950/40">
          <div className="p-4 border-b border-slate-850 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-100"># {activeChannel}</h3>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                className={`max-w-[75%] space-y-1 ${
                  m.isTeacher ? 'ml-auto' : 'mr-auto'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                  <span>{m.sender}</span>
                  {m.isAi && <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.5 rounded text-[8px] uppercase font-black">AI Helper</span>}
                  <span>•</span>
                  <span>{m.time}</span>
                </div>
                <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                  m.isTeacher 
                    ? 'bg-indigo-600 text-slate-100 rounded-tr-none' 
                    : m.isAi 
                      ? 'bg-emerald-950/10 border border-emerald-500/20 text-emerald-300 rounded-tl-none'
                      : 'bg-slate-900 border border-slate-850 text-slate-300 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Typing box */}
          <form onSubmit={handleSend} className="p-4 border-t border-slate-850 flex gap-2.5">
            <input 
              type="text" 
              placeholder={`Escrever mensagem para #${activeChannel}...`}
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            />
            <button
              type="submit"
              disabled={!newMsg.trim()}
              className="px-4 bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-500/50 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 5. RELATÓRIOS GERAIS VIEW
// ----------------------------------------------------
export const RelatoriosGeraisView: React.FC<ViewProps> = ({ triggerToast }) => {
  const chartData = [
    { name: 'Semana 1', 'Média Geral': 68, 'Taxa Retenção': 95 },
    { name: 'Semana 2', 'Média Geral': 72, 'Taxa Retenção': 94 },
    { name: 'Semana 3', 'Média Geral': 74, 'Taxa Retenção': 96 },
    { name: 'Semana 4', 'Média Geral': 78, 'Taxa Retenção': 98 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-display">Relatórios de Desempenho e Retenção</h2>
          <p className="text-xs text-slate-400">Analise estatísticas detalhadas de evolução linguística corporativa e métricas de satisfação B2B.</p>
        </div>
        <button
          onClick={() => {
            triggerToast('📥 Compilando Excel consolidado de notas e frequências...');
            setTimeout(() => triggerToast('✓ Planilha de desempenho exportada com sucesso!'), 1500);
          }}
          className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" /> Exportar Planilha (XLS)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest">Evolução de Fluência Semanal Geral</h3>
            <span className="text-[10px] font-mono text-slate-500">Média combinada das turmas</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[50, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                <Area type="monotone" dataKey="Média Geral" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest border-b border-slate-850 pb-2">Estatísticas Rápidas B2B</h3>
            <div className="space-y-4 mt-4">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Participação em Provas</span>
                <strong className="text-slate-100 font-mono text-sm">98.2%</strong>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Engajamento Diário com IA</span>
                <strong className="text-slate-100 font-mono text-sm">84.5%</strong>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Syllabus Coberto</span>
                <strong className="text-slate-100 font-mono text-sm">76.0%</strong>
              </div>
            </div>
          </div>
          <div className="bg-indigo-950/20 border border-indigo-900/30 p-3.5 rounded-2xl text-[11px] text-slate-450 leading-relaxed italic">
            "A taxa de retenção média das turmas atingiu 98% de satisfação com as interações orais do tutor AI."
          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 6. CERTIFICAÇÕES VIEW
// ----------------------------------------------------
export const CertificacoesView: React.FC<ViewProps> = ({ triggerToast }) => {
  const certifications = [
    { title: 'IELTS Academic Ready', target: 'CEFR B2-C1', studentsReady: 18, totalStudents: 28, passRate: '89%' },
    { title: 'TOEFL iBT Speaking Prep', target: 'CEFR C1', studentsReady: 12, totalStudents: 15, passRate: '92%' },
    { title: 'Cambridge C1 Business Higher', target: 'CEFR C1', studentsReady: 8, totalStudents: 10, passRate: '80%' },
    { title: 'Cambridge B2 First', target: 'CEFR B2', studentsReady: 22, totalStudents: 35, passRate: '78%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-display">Certificações & Preparatórios</h2>
        <p className="text-xs text-slate-400">Gerencie o progresso e simulações focadas em exames de proficiência internacional.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certifications.map((c, idx) => {
          const ratio = (c.studentsReady / c.totalStudents) * 100;
          return (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <Award className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] bg-slate-950 border border-slate-850 text-indigo-300 font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                    {c.target}
                  </span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-100">{c.title}</h4>
                  <p className="text-[11px] text-slate-400 font-medium">Aprovados históricos simulados: {c.passRate}</p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-850 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Prontos para Exame</span>
                  <span className="font-bold text-slate-200">{c.studentsReady} / {c.totalStudents} alunos</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                  <div className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full" style={{ width: `${ratio}%` }} />
                </div>
                <div className="flex justify-end pt-1">
                  <button 
                    onClick={() => triggerToast(`🔬 Disparando simulação de teste oral IELTS para ${c.totalStudents} alunos!`)}
                    className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-slate-300 rounded-lg transition-all cursor-pointer"
                  >
                    Lançar Simulado Oral IA
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 7. EMBAIXADORES VIEW
// ----------------------------------------------------
export const EmbaixadoresView: React.FC<ViewProps> = ({ triggerToast }) => {
  const ambassadors = [
    { name: 'Sara Costa', avatar: '👩‍🔬', class: 'Turma Alfa', referrals: 4, points: 420, activeChallenges: 'Concluir 15 sessões orais seguidas' },
    { name: 'Ana Filipa', avatar: '👩‍💻', class: 'Turma Alfa', referrals: 3, points: 310, activeChallenges: 'Ajudar um colega com feedback de áudio' },
    { name: 'Beatriz Lima', avatar: '👩‍⚕️', class: 'Turma Beta', referrals: 1, points: 210, activeChallenges: 'Grave seu primeiro case de vídeo corporativo' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-display">Programa de Embaixadores LingoLIVE</h2>
          <p className="text-xs text-slate-400">Gerencie indicações, nomeie embaixadores de destaque e incentive conquistas colaborativas.</p>
        </div>
        <button
          onClick={() => triggerToast('➕ Nomear um novo Embaixador Acadêmico!')}
          className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Nomear Embaixador
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest border-b border-slate-850 pb-2">Embaixadores Nomeados</h3>
          <div className="space-y-3">
            {ambassadors.map((a, idx) => (
              <div key={idx} className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{a.avatar}</span>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-100">{a.name}</h4>
                    <p className="text-[11px] text-slate-400">Turma: {a.class} • Desafio: {a.activeChallenges}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">LingoPoints</span>
                    <strong className="text-emerald-400 font-mono font-black text-xs sm:text-sm">{a.points} PTS</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Indicações</span>
                    <strong className="text-indigo-400 font-mono font-black text-xs sm:text-sm">{a.referrals} indicados</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-5 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest border-b border-slate-850 pb-2">Incentivos de Referência</h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Alunos indicados ganham 20% de desconto corporativo na assinatura individual de speaking. O aluno que indica ganha 250 LingoPoints adicionais para trocar por mentorias B2B.
            </p>
          </div>
          <div className="bg-emerald-950/20 border border-emerald-900/30 p-3.5 rounded-2xl text-[11px] text-emerald-400 leading-relaxed font-sans mt-4">
            🎉 <strong>Campanha Ativa:</strong> "Nominate the Best" — o embaixador com mais indicações ganha uma mentoria com falante nativo este mês!
          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 8. CONFIGURAÇÕES VIEW
// ----------------------------------------------------
export const ConfiguracoesView: React.FC<ViewProps> = ({ triggerToast }) => {
  const [threshold, setThreshold] = useState(70);
  const [autoGrading, setAutoGrading] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-display">Configurações Gerais de Workspace</h2>
        <p className="text-xs text-slate-400">Configure as preferências do seu espaço letivo, limites de aceitabilidade do tutor AI e parâmetros pedagógicos.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 space-y-6">
        <div className="space-y-4">
          <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider border-b border-slate-850 pb-2">Parâmetros de Fluência do AI Tutor</h3>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-350">
              <span className="font-semibold">Nível mínimo de aceitação de pronúncia</span>
              <span className="font-mono font-black text-indigo-400">{threshold}%</span>
            </div>
            <input 
              type="range" 
              min="50" 
              max="95" 
              value={threshold} 
              onChange={(e) => {
                setThreshold(Number(e.target.value));
                triggerToast(`⚙️ Limite mínimo de aceitação alterado para ${e.target.value}%`);
              }}
              className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <p className="text-[10px] text-slate-500">Muda a tolerância aos desvios de sotaque no grading das gravações de microfones.</p>
          </div>

          <div className="flex items-center justify-between py-3 text-xs">
            <div className="space-y-0.5">
              <p className="font-semibold text-slate-200">Autocorreção Inteligente com IA</p>
              <p className="text-[10px] text-slate-500">Permite que a IA envie os relatórios de gramática direto aos alunos sem revisão prévia.</p>
            </div>
            <button
              onClick={() => {
                setAutoGrading(!autoGrading);
                triggerToast(autoGrading ? '⚙️ Correção manual ativada' : '⚙️ Autocorreção automatizada ativada');
              }}
              className={`w-12 h-6 rounded-full p-1 transition-all ${autoGrading ? 'bg-indigo-500' : 'bg-slate-950 border border-slate-800'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-slate-950 transition-all ${autoGrading ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-850 flex justify-end gap-3 text-xs font-bold">
          <button 
            onClick={() => triggerToast('✓ Configurações salvas com sucesso!')}
            className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 rounded-xl transition-all font-black uppercase tracking-wider cursor-pointer"
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 9. ASSESSMENT STUDIO (EXTENDED FOR EXERCISES / RUBRICS / MARKETPLACE)
// ----------------------------------------------------
export const AssessmentStudioExtendedView: React.FC<ViewProps & { activeSubTab: string }> = ({ triggerToast, activeSubTab }) => {
  return (
    <div className="space-y-6">
      {activeSubTab === 'exercicios' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white font-display">Gerenciador de Exercícios</h3>
              <p className="text-xs text-slate-400">Crie, edite e gerencie exercícios interativos de preenchimento de lacunas e gravação de áudio.</p>
            </div>
            <button onClick={() => triggerToast('➕ Criar Novo Exercício')} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer">
              Novo Exercício
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Executive Introduction Roleplay', type: 'Foco Oral', items: '5 prompts de voz', level: 'C1' },
              { title: 'Conditional Clauses in Negotiations', type: 'Gramática & Lacunas', items: '10 perguntas', level: 'B2' },
              { title: 'Corporate Vocabulary Matching', type: 'Léxico', items: '15 termos', level: 'B1' },
            ].map((ex, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-start">
                <div className="space-y-1">
                  <span className="px-1.5 py-0.5 text-[8px] font-black uppercase font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
                    {ex.type}
                  </span>
                  <h4 className="font-bold text-xs text-slate-200 mt-1">{ex.title}</h4>
                  <p className="text-[10px] text-slate-500">{ex.items} • Nível: {ex.level}</p>
                </div>
                <button onClick={() => triggerToast(`👁️ Visualizando ${ex.title}`)} className="text-[10px] font-bold text-indigo-400 hover:underline">Editar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'testes' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white font-display">Gerenciador de Testes Rápidos</h3>
              <p className="text-xs text-slate-400">Monte testes rápidos e baterias de conversação rápida para medir o nível de proficiência imediata.</p>
            </div>
            <button onClick={() => triggerToast('➕ Criar Novo Teste')} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer">
              Novo Teste
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'TOEFL Grammar Diagnostic', duration: '20 min', q: 15, level: 'B1-C1' },
              { title: 'Weekly Fluency Review', duration: '10 min', q: 5, level: 'B2' },
              { title: 'Vocabulary Quiz: Tech Talk', duration: '15 min', q: 12, level: 'C1' },
            ].map((t, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-100">{t.title}</h4>
                  <p className="text-[10px] text-slate-500">Tempo: {t.duration} • Questões: {t.q}</p>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-indigo-400 font-bold">{t.level}</span>
                  <button onClick={() => triggerToast(`🚀 Lançando simulação de teste rápido: ${t.title}`)} className="text-emerald-400 hover:underline font-bold">Lançar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'rubricas' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white font-display">Rubricas de Avaliação</h3>
              <p className="text-xs text-slate-400">Crie modelos estruturados de feedback para avaliar coesão, gramática, vocabulário e pronúncia.</p>
            </div>
            <button onClick={() => triggerToast('➕ Criar Nova Rubrica')} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer">
              Nova Rubrica
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider">Modelo CEFR Oficial (Inglês Avançado)</h4>
            <div className="space-y-3 text-xs text-slate-350">
              <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                <span>Gramática & Complexidade</span>
                <span className="font-bold text-slate-100 font-mono">Peso 30%</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                <span>Fluência & Ritmo Vocabular</span>
                <span className="font-bold text-slate-100 font-mono">Peso 30%</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                <span>Precisão de Pronúncia Fônica</span>
                <span className="font-bold text-slate-100 font-mono">Peso 40%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'biblioteca' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white font-display">Biblioteca de Atividades</h3>
              <p className="text-xs text-slate-400">Gerencie todos os recursos, PDFs pedagógicos e blueprints escolares em uma estante central.</p>
            </div>
            <button onClick={() => triggerToast('➕ Adicionar Recurso')} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer">
              Adicionar Arquivo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { title: 'Guia de Pronúncia Fônica B2.pdf', size: '1.2 MB', ext: 'PDF' },
              { title: 'Syllabus Executive 4 Semanas.docx', size: '420 KB', ext: 'DOCX' },
              { title: 'Flashcards de Idioma Negócios.json', size: '95 KB', ext: 'JSON' },
              { title: 'Audio Model Castelhano RP.mp3', size: '5.4 MB', ext: 'MP3' },
            ].map((file, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between h-28 hover:border-slate-700 transition-all">
                <span className="text-[10px] bg-slate-950 border border-slate-850 text-indigo-300 font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded w-max">
                  {file.ext}
                </span>
                <p className="font-bold text-xs text-slate-200 truncate mt-2">{file.title}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>{file.size}</span>
                  <button onClick={() => triggerToast(`📥 Baixando ${file.title}...`)} className="text-indigo-400 hover:underline">Baixar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'marketplace' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white font-display">Resource Marketplace</h3>
              <p className="text-xs text-slate-400">Importe e compre rubricas prontas, pacotes de atividades e blueprints desenvolvidos por outros especialistas.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'IELTS Cambridge Full Exam Plan', author: 'Dr. Michael J.', rating: '4.9 ⭐', price: 'Free', tags: ['IELTS', 'Speaking'] },
              { title: 'Corporate Negotiation Pack (Spanish)', author: 'Prof. Sarah J.', rating: '4.8 ⭐', price: 'Free', tags: ['Negócios', 'Espanhol'] },
              { title: 'Accent Neutralization Drills', author: 'Tutor AI Team', rating: '5.0 ⭐', price: 'Free', tags: ['Fônica', 'Pronúncia'] },
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between h-52 hover:border-slate-750 transition-all">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((t) => (
                      <span key={t} className="text-[8px] bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded text-indigo-400 font-bold font-mono uppercase">{t}</span>
                    ))}
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-200">{item.title}</h4>
                  <p className="text-[10px] text-slate-500">Por {item.author} • {item.rating}</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-850 pt-3">
                  <span className="font-mono font-black text-sm text-emerald-400">{item.price}</span>
                  <button onClick={() => triggerToast(`🎁 Pacote "${item.title}" importado com sucesso para a biblioteca!`)} className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-[10px] rounded-lg transition-all uppercase tracking-wider cursor-pointer">Importar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ====================================================
// 10. LINGOLIVE CREATOR PLATFORM VIEWS
// ====================================================

// Creator Assessment Sub-tabs View
export const CreatorAssessmentView: React.FC<ViewProps & { activeSubTab: string }> = ({ triggerToast, activeSubTab }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-display">Assessment Studio Creator</h2>
        <p className="text-xs text-slate-400">Monte itens de avaliação, exames dinâmicos e rubricas de correção automatizada para publicação.</p>
      </div>

      {activeSubTab === 'creator-exercicios' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <h3 className="font-extrabold text-sm text-slate-100">Criador de Exercícios Interativos</h3>
            <button onClick={() => triggerToast('🔨 Novo Exercício de Pronúncia / Escrita')} className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer">Novo Exercício</button>
          </div>
          <p className="text-xs text-slate-400">Os criadores podem formular quizzes de áudio, jogos fônicos e simulações para alimentar a biblioteca escolar.</p>
          <div className="p-10 bg-slate-950 rounded-2xl border border-dashed border-slate-800 text-center text-xs text-slate-550">
            Arraste cartões ou clique em Novo Exercício para montar uma trilha didática personalizada.
          </div>
        </div>
      )}

      {activeSubTab === 'creator-testes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <h3 className="font-extrabold text-sm text-slate-100">Testes Rápidos de Compreensão</h3>
            <button onClick={() => triggerToast('🔨 Novo Teste de Leitura / Conversação')} className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer">Criar Teste</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl space-y-2">
              <span className="text-[8px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 rounded font-black font-mono">B2</span>
              <h4 className="font-bold text-xs text-slate-200">IELTS Speaking Part 1 Prep</h4>
              <p className="text-[10px] text-slate-500">Tempo: 15 min • 8 perguntas</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl space-y-2">
              <span className="text-[8px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 rounded font-black font-mono">C1</span>
              <h4 className="font-bold text-xs text-slate-200">TOEFL Listening & Note Taking</h4>
              <p className="text-[10px] text-slate-500">Tempo: 25 min • 5 perguntas</p>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'creator-exames' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <h3 className="font-extrabold text-sm text-slate-100">Editor de Exames Corporativos</h3>
            <button onClick={() => triggerToast('🔨 Novo Exame Global')} className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer">Novo Exame</button>
          </div>
          <p className="text-xs text-slate-400">Configure exames formais com controle de privacidade, gravação de webcam opcional e áudio nativo modelado.</p>
        </div>
      )}

      {activeSubTab === 'creator-rubricas' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <h3 className="font-extrabold text-sm text-slate-100">Arquitetura de Rubricas (Grading)</h3>
            <button onClick={() => triggerToast('🔨 Criar Rubrica de Coerência')} className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer">Nova Rubrica</button>
          </div>
          <p className="text-xs text-slate-400">Defina pesos, descrições para níveis CEFR de A1 a C2 e parametrize as tags de correção do tutor de inteligência artificial.</p>
        </div>
      )}

      {activeSubTab === 'creator-correcoes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <h3 className="font-extrabold text-sm text-slate-100">Workflow de Revisões & Notas</h3>
          </div>
          <p className="text-xs text-slate-400">Organize o fluxo de entrega das redações e de gravações dos alunos para dar feedback humano complementar de forma simplificada.</p>
        </div>
      )}
    </div>
  );
};

// Course Builder View
export const CourseBuilderView: React.FC<ViewProps> = ({ triggerToast }) => {
  const [courseTitle, setCourseTitle] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('C1');
  const [modules, setModules] = useState([
    { id: 1, title: 'Fundamentos de Negociação Avançada', level: 'C1', units: 4, published: true },
    { id: 2, title: 'Socializing and Networking across Borders', level: 'B2', units: 3, published: true },
    { id: 3, title: 'Product Pitching & Commercial Achievements', level: 'C1', units: 5, published: false }
  ]);

  const handleAddModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim()) return;
    const newMod = {
      id: Date.now(),
      title: courseTitle,
      level: selectedLevel,
      units: 1,
      published: false
    };
    setModules(prev => [...prev, newMod]);
    setCourseTitle('');
    triggerToast(`✓ Módulo "${courseTitle}" estruturado no Course Builder!`);
  };

  const togglePublish = (id: number) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, published: !m.published } : m));
    triggerToast('✓ Status de publicação do módulo atualizado!');
  };

  const deleteModule = (id: number) => {
    setModules(prev => prev.filter(m => m.id !== id));
    triggerToast('🗑️ Módulo removido da ementa.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-display flex items-center gap-2">
            <Layers className="w-6 h-6 text-violet-400" />
            Course Builder
          </h2>
          <p className="text-xs text-slate-400">Desenvolva a arquitetura de módulos, ementas letivas e cronogramas de aprendizado de forma interativa.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest border-b border-slate-850 pb-2">Módulos Estruturados</h3>
            <div className="space-y-3">
              {modules.map((m) => (
                <div key={m.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[8px] font-black uppercase font-mono bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded">
                        CEFR {m.level}
                      </span>
                      {m.published ? (
                        <span className="px-1.5 py-0.5 text-[8px] font-black uppercase font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">Ativo</span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-[8px] font-black uppercase font-mono bg-slate-800 text-slate-400 border border-slate-700 rounded">Rascunho</span>
                      )}
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-200 mt-1">{m.title}</h4>
                    <p className="text-[10px] text-slate-500">{m.units} Micro-aulas • Plano Semanal Ativo</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => togglePublish(m.id)}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        m.published 
                          ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                      }`}
                    >
                      {m.published ? 'Pausar' : 'Ativar'}
                    </button>
                    <button 
                      onClick={() => deleteModule(m.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest border-b border-slate-850 pb-2">Modelar Módulo</h3>
          <form onSubmit={handleAddModule} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Nome do Módulo Acadêmico</label>
              <input
                type="text"
                placeholder="Ex: Marketing Digital e E-commerce..."
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-250 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Nível de Proficiência (CEFR)</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 font-semibold"
              >
                <option value="A1">A1 - Iniciante</option>
                <option value="A2">A2 - Básico</option>
                <option value="B1">B1 - Intermediário</option>
                <option value="B2">B2 - Usuário Independente</option>
                <option value="C1">C1 - Avançado</option>
                <option value="C2">C2 - Fluência Plena (Nativo/Master)</option>
              </select>
            </div>
            <button type="submit" disabled={!courseTitle.trim()} className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer">
              Criar Novo Módulo
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Lesson Builder View
export const LessonBuilderView: React.FC<ViewProps> = ({ triggerToast }) => {
  const [slides, setSlides] = useState([
    { id: 1, title: 'Boas-vindas & Vocabulário Chave', type: 'Explicativo', duration: '3 min' },
    { id: 2, title: 'Exemplo Prático: Ouvindo o Diretor', type: 'Áudio Nativo', duration: '5 min' },
    { id: 3, title: 'Prática de Repetição de Fonema /v/', type: 'Fônica', duration: '4 min' }
  ]);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Fônica');

  const handleAddSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSlides(prev => [...prev, {
      id: Date.now(),
      title: newTitle,
      type: newType,
      duration: '4 min'
    }]);
    setNewTitle('');
    triggerToast('✓ Nova tela adicionada ao fluxo de micro-learning!');
  };

  const removeSlide = (id: number) => {
    setSlides(prev => prev.filter(s => s.id !== id));
    triggerToast('🗑️ Tela removida da aula.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-display flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-violet-400" />
            Lesson Builder
          </h2>
          <p className="text-xs text-slate-400">Monte as telas de leitura de e-learning, adicione áudios fônicos e estruture a progressão slide por slide.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest border-b border-slate-850 pb-2">Sequência de Slides</h3>
            {slides.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-6">Nenhum slide cadastrado neste e-learning.</p>
            ) : (
              <div className="space-y-2">
                {slides.map((slide, index) => (
                  <div key={slide.id} className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-violet-500/10 text-violet-400 font-black font-mono text-[10px] flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-xs text-slate-200">{slide.title}</h4>
                        <p className="text-[10px] text-slate-500">Mídia: {slide.type} • Estimativa: {slide.duration}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeSlide(slide.id)}
                      className="text-slate-500 hover:text-rose-400 transition-all p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest border-b border-slate-850 pb-2">Adicionar Slide</h3>
          <form onSubmit={handleAddSlide} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Título da Tela</label>
              <input
                type="text"
                placeholder="Ex: Dominação de Sotaque em Reuniões..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-250 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Tipo de Slide</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 font-semibold"
              >
                <option value="Fônica">Prática Fônica (Gravação de Voz)</option>
                <option value="Explicativo">Explicativo / Texto Teórico</option>
                <option value="Áudio Nativo">Audição (Áudio de Referência Nativo)</option>
                <option value="Quiz">Pergunta Objetiva / Quiz</option>
              </select>
            </div>
            <button type="submit" disabled={!newTitle.trim()} className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer">
              Adicionar ao Final
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Activity Builder View
export const ActivityBuilderView: React.FC<ViewProps> = ({ triggerToast }) => {
  const [activities, setActivities] = useState([
    { id: 1, text: 'Complete standard negotiation conditionals: If we ________ (accept) this price, we will reduce our margin.', type: 'Preenchimento' },
    { id: 2, text: 'Record your introduction pitches using active professional voice.', type: 'Fala Livre' }
  ]);
  const [actText, setActText] = useState('');
  const [actType, setActType] = useState('Preenchimento');

  const handleAddAct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actText.trim()) return;
    setActivities(prev => [...prev, { id: Date.now(), text: actText, type: actType }]);
    setActText('');
    triggerToast('✓ Nova atividade prática cadastrada!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-display flex items-center gap-2">
          <ListTodo className="w-6 h-6 text-violet-400" />
          Activity Builder
        </h2>
        <p className="text-xs text-slate-400">Formule atividades gamificadas de correspondência, preenchimento de palavras, arrastar cartões e fala livre.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest border-b border-slate-850 pb-2">Banco de Atividades Customizadas</h3>
            <div className="space-y-3">
              {activities.map((a) => (
                <div key={a.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2">
                  <span className="px-2 py-0.5 text-[8px] font-black uppercase font-mono bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded">
                    {a.type}
                  </span>
                  <p className="text-xs text-slate-350 leading-relaxed font-medium">{a.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest border-b border-slate-850 pb-2">Criar Atividade</h3>
          <form onSubmit={handleAddAct} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Prompt / Texto do Exercício</label>
              <textarea
                placeholder="Ex: Preencha a lacuna com a preposição correta..."
                value={actText}
                onChange={(e) => setActText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-250 placeholder:text-slate-650 h-24 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Tipo de Exercício</label>
              <select
                value={actType}
                onChange={(e) => setActType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-250 focus:outline-none focus:ring-1 focus:ring-violet-500 font-semibold"
              >
                <option value="Preenchimento">Preenchimento de Lacunas (Gap-filling)</option>
                <option value="Fala Livre">Gravação Livre (Oral Prompt)</option>
                <option value="Correspondência">Correspondência de Termos</option>
              </select>
            </div>
            <button type="submit" disabled={!actText.trim()} className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer">
              Salvar Atividade
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Flashcard Builder View
export const FlashcardBuilderView: React.FC<ViewProps> = ({ triggerToast }) => {
  const [cards, setCards] = useState([
    { id: 1, word: 'Leverage', translation: 'Alavancar / Aproveitar', ipa: '/ˈliːvərɪdʒ/', dialect: 'US English' },
    { id: 2, word: 'Endeavour', translation: 'Esforço / Empreendimento', ipa: '/ɪnˈdɛvər/', dialect: 'UK English' }
  ]);
  const [word, setWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [ipa, setIpa] = useState('');
  const [dialect, setDialect] = useState('US English');

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !translation.trim()) return;
    setCards(prev => [...prev, { id: Date.now(), word, translation, ipa, dialect }]);
    setWord('');
    setTranslation('');
    setIpa('');
    triggerToast('✓ Flashcard adicionado ao baralho de repetição espaçada!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-display flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-violet-400" />
          Flashcard Builder
        </h2>
        <p className="text-xs text-slate-400">Crie baralhos de repetição espaçada focados em vocabulário profissional, termos técnicos e expressões idiomáticas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest border-b border-slate-850 pb-2">Baralho de Vocabulário</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cards.map((c) => (
                <div key={c.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between h-32 hover:border-violet-500/20 transition-all">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-violet-400 font-mono">{c.dialect}</span>
                      <span className="text-[10px] text-slate-500 font-mono font-bold">{c.ipa}</span>
                    </div>
                    <h4 className="font-black text-sm text-slate-100 mt-2">{c.word}</h4>
                    <p className="text-xs text-slate-400 font-medium italic">{c.translation}</p>
                  </div>
                  <div className="text-[9px] text-slate-600 font-bold uppercase tracking-wider text-right border-t border-slate-900 pt-2">Repetição Ativa</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest border-b border-slate-850 pb-2">Criar Flashcard</h3>
          <form onSubmit={handleAddCard} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Palavra / Expressão (Inglês)</label>
              <input
                type="text"
                placeholder="Ex: Synergy..."
                value={word}
                onChange={(e) => setWord(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-250 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Tradução / Significado</label>
              <input
                type="text"
                placeholder="Ex: Sinergia, cooperação..."
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-250 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Transcrição Fonética IPA (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: /ˈsɪn.ə.dʒi/..."
                value={ipa}
                onChange={(e) => setIpa(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-250 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Dialeto Sotaque</label>
              <select
                value={dialect}
                onChange={(e) => setDialect(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 font-semibold"
              >
                <option value="US English">US English (Geral)</option>
                <option value="UK English">UK English (Received Pronunciation)</option>
                <option value="AU English">AU English (Australiano)</option>
              </select>
            </div>
            <button type="submit" disabled={!word.trim() || !translation.trim()} className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer">
              Adicionar Card
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Story Builder View
export const StoryBuilderView: React.FC<ViewProps> = ({ triggerToast }) => {
  const [nodes, setNodes] = useState([
    { id: 1, title: 'Início: Reunião Inesperada', speaker: 'Diretor Geral', dialogue: 'Good morning, we need to address our Q3 drop immediately.', optionsCount: 3 }
  ]);

  const handleCreateNode = () => {
    const title = prompt('Qual o título do novo cenário / decisão?');
    if (!title) return;
    setNodes(prev => [...prev, {
      id: Date.now(),
      title,
      speaker: 'Você (Aluno)',
      dialogue: 'Sim, eu tenho os relatórios prontos aqui.',
      optionsCount: 2
    }]);
    triggerToast('✓ Nova ramificação (branching node) adicionada à história!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-display flex items-center gap-2">
          <Newspaper className="w-6 h-6 text-violet-400" />
          Story Builder
        </h2>
        <p className="text-xs text-slate-400">Monte cenários de história imersivos onde os alunos tomam decisões conversacionais e praticam compreensão auditiva.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="flex justify-between items-center border-b border-slate-850 pb-3">
          <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest">Estrutura de Diálogo Dinâmico</h3>
          <button 
            onClick={handleCreateNode}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            Adicionar Ramificação
          </button>
        </div>

        <div className="space-y-4">
          {nodes.map((node) => (
            <div key={node.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded font-black font-mono">
                  {node.title}
                </span>
                <span className="text-[10px] text-slate-500 font-bold">{node.optionsCount} opções de decisão</span>
              </div>
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg flex gap-3 items-start">
                <span className="text-2xl">👨‍💼</span>
                <div>
                  <h4 className="font-black text-[11px] text-violet-400">{node.speaker}</h4>
                  <p className="text-xs text-slate-300 italic font-medium mt-1">"{node.dialogue}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Pronunciation Builder View
export const PronunciationBuilderView: React.FC<ViewProps> = ({ triggerToast }) => {
  const [phonemes, setPhonemes] = useState([
    { id: 1, phoneme: '/θ/', example: 'Thought, Think, Month', difficulty: 'Fácil para nativos, Difícil para Português L1' },
    { id: 2, phoneme: '/æ/', example: 'Cat, Bad, Back', difficulty: 'Média tolerância necessária' }
  ]);
  const [targetWord, setTargetWord] = useState('');
  const [phonemeText, setPhonemeText] = useState('/r/');

  const handleAddPhoneme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetWord.trim()) return;
    setPhonemes(prev => [...prev, {
      id: Date.now(),
      phoneme: phonemeText,
      example: targetWord,
      difficulty: 'Calibragem dinâmica ativa'
    }]);
    setTargetWord('');
    triggerToast('✓ Novo fonema de referência cadastrado!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-display flex items-center gap-2">
          <Volume2 className="w-6 h-6 text-violet-400" />
          Pronunciation Builder
        </h2>
        <p className="text-xs text-slate-400">Cadastre modelos fonéticos de referência, selecione os fonemas chave a serem testados e ajuste a calibração de notas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest border-b border-slate-850 pb-2">Metas Fônicas Monitoradas</h3>
            <div className="space-y-2">
              {phonemes.map((p) => (
                <div key={p.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-sm font-black text-violet-400 font-mono">{p.phoneme}</span>
                    <h4 className="font-bold text-xs text-slate-200 mt-1">Exemplos: {p.example}</h4>
                    <p className="text-[10px] text-slate-500">{p.difficulty}</p>
                  </div>
                  <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Fidelidade Alta</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest border-b border-slate-850 pb-2">Cadastrar Meta</h3>
          <form onSubmit={handleAddPhoneme} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Fonema Alvo (IPA)</label>
              <input
                type="text"
                value={phonemeText}
                onChange={(e) => setPhonemeText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-250 focus:outline-none focus:ring-1 focus:ring-violet-500 font-black font-mono text-center"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Palavras Exemplo (Separadas por vírgula)</label>
              <input
                type="text"
                placeholder="Ex: Red, Right, Carrot..."
                value={targetWord}
                onChange={(e) => setTargetWord(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-250 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
              />
            </div>
            <button type="submit" disabled={!targetWord.trim()} className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer">
              Ativar Meta Fonética
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Conversation Builder View
export const ConversationBuilderView: React.FC<ViewProps> = ({ triggerToast }) => {
  const [blueprints, setBlueprints] = useState([
    { id: 1, title: 'Commercial Contract Negotiation', role: 'Chief Legal Officer', prompt: 'Be extremely stubborn about clause 4.2.' },
    { id: 2, title: 'Job Interview Pitch', role: 'HR Manager', prompt: 'Check for technical skill adequacy first.' }
  ]);
  const [title, setTitle] = useState('');
  const [role, setRole] = useState('');
  const [prompt, setPrompt] = useState('');

  const handleAddBlueprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !role.trim()) return;
    setBlueprints(prev => [...prev, { id: Date.now(), title, role, prompt }]);
    setTitle('');
    setRole('');
    setPrompt('');
    triggerToast('✓ Nova Persona de Roleplay AI criada com sucesso!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-display flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-violet-400" />
          Conversation Builder
        </h2>
        <p className="text-xs text-slate-400">Estruture o roteiro de conversas com inteligência artificial, criando diálogos com branching scenarios e regras de pontuação.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest border-b border-slate-850 pb-2">Personagens & Roteiros de Roleplay</h3>
            <div className="space-y-3">
              {blueprints.map((b) => (
                <div key={b.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-black text-xs text-slate-200">{b.title}</h4>
                    <span className="text-[10px] text-violet-400 font-bold">{b.role}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 italic leading-relaxed">System Rule: "{b.prompt}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest border-b border-slate-850 pb-2">Criar Persona AI</h3>
          <form onSubmit={handleAddBlueprint} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Nome do Cenário</label>
              <input
                type="text"
                placeholder="Ex: Customer Support Call..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-250 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Papel do AI Bot</label>
              <input
                type="text"
                placeholder="Ex: Cliente Insatisfeito..."
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-250 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Instrução Secreta de Atuação (IA)</label>
              <textarea
                placeholder="Ex: Comece a conversa reclamando do frete lento e insista em ter o reembolso integral..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-250 placeholder:text-slate-650 h-24 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
              />
            </div>
            <button type="submit" disabled={!title.trim() || !role.trim()} className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer">
              Ativar Persona AI
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Assignment Builder View
export const AssignmentBuilderView: React.FC<ViewProps> = ({ triggerToast }) => {
  const [assignments, setAssignments] = useState([
    { id: 1, title: 'Executive Presentation Video', weight: '30%', deadline: '24 Julho 2026' },
    { id: 2, title: 'Corporate Report Synthesis', weight: '20%', deadline: '30 Julho 2026' }
  ]);
  const [title, setTitle] = useState('');
  const [weight, setWeight] = useState('20%');

  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setAssignments(prev => [...prev, { id: Date.now(), title, weight, deadline: '05 Agosto 2026' }]);
    setTitle('');
    triggerToast('✓ Novo Trabalho formal de fala/escrita publicado!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-display flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-violet-400" />
          Assignment Builder
        </h2>
        <p className="text-xs text-slate-400">Crie, programe e distribua projetos orais ou escritos com pesos customizados nas notas gerais da escola.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest border-b border-slate-850 pb-2">Projetos Ativos</h3>
            <div className="space-y-2">
              {assignments.map((a) => (
                <div key={a.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-200">{a.title}</h4>
                    <p className="text-[10px] text-slate-500">Prazo final: {a.deadline}</p>
                  </div>
                  <span className="text-[10px] font-mono font-black text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded">Peso {a.weight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest border-b border-slate-850 pb-2">Publicar Projeto</h3>
          <form onSubmit={handleAddAssignment} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Título do Trabalho</label>
              <input
                type="text"
                placeholder="Ex: Case Study Speech..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-250 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Peso da Nota</label>
              <select
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 font-semibold"
              >
                <option value="10%">10% da Média</option>
                <option value="20%">20% da Média</option>
                <option value="30%">30% da Média</option>
                <option value="50%">50% da Média</option>
              </select>
            </div>
            <button type="submit" disabled={!title.trim()} className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer">
              Distribuir para as Turmas
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Homework Builder View
export const HomeworkBuilderView: React.FC<ViewProps> = ({ triggerToast }) => {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Vocabulary Review: Tech Synonyms', dueDays: 2 },
    { id: 2, title: '30-second Audio Pitch: Project Proposal', dueDays: 3 }
  ]);
  const [hTitle, setHTitle] = useState('');

  const handleAddHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hTitle.trim()) return;
    setTasks(prev => [...prev, { id: Date.now(), title: hTitle, dueDays: 2 }]);
    setHTitle('');
    triggerToast('✓ Nova Tarefa de Casa cadastrada e agendada!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-display flex items-center gap-2">
          <FileSignature className="w-6 h-6 text-violet-400" />
          Homework Builder
        </h2>
        <p className="text-xs text-slate-400">Monte tarefas de casa com data de expiração rápida para reforçar o vocabulário fônico aprendido em sala de aula.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest border-b border-slate-850 pb-2">Tarefas de Casa do Estudante</h3>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-xs text-slate-200">{task.title}</h4>
                    <p className="text-[10px] text-slate-500">Expira em {task.dueDays} dias</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-850">Notificação Automática</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest border-b border-slate-850 pb-2">Programar Tarefa</h3>
          <form onSubmit={handleAddHomework} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Título da Tarefa de Casa</label>
              <input
                type="text"
                placeholder="Ex: Prática Fônica de sotaque no 'r'..."
                value={hTitle}
                onChange={(e) => setHTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-250 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
              />
            </div>
            <button type="submit" disabled={!hTitle.trim()} className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer">
              Disparar Atividade por Push
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// AI Content Generator View
export const AIContentGeneratorView: React.FC<ViewProps> = ({ triggerToast }) => {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('B2');
  const [type, setType] = useState('Dialogue');
  const [generating, setGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      let content = '';
      if (type === 'Dialogue') {
        content = `### Roleplay Dialogue: ${topic} (CEFR ${level})\n\n**Speaker A (Director):** We need to address the integration issues with the API.\n**Speaker B (Architect):** Understood. I suggest we leverage an event-driven queue to prevent buffering issues.\n\n**Vocabulary Highlight:**\n- *Leverage* (/ˈliː.vər.ɪdʒ/) - To use something to maximum advantage.\n- *API Integration* (/ˌeɪ.pi.ˈaɪ ˌɪn.tɪˈɡreɪ.ʃən/) - Connecting services smoothly.\n\n*Target phoneme of this lesson: /v/ in "leverage" and "event-driven".*`;
      } else if (type === 'Vocabulary') {
        content = `### Advanced Vocabulary Blueprint: ${topic} (CEFR ${level})\n\n1. **Synergistic** (/ˌsɪn.əˈdʒɪs.tɪk/) - Working together effectively.\n   *Example:* We need a synergistic strategy for our cross-functional teams.\n\n2. **Pivotal** (/ˈpɪv.ə.təl/) - Of crucial importance.\n   *Example:* This release represents a pivotal point in our development cycle.`;
      } else {
        content = `### Grammar Review: Conditional Clauses for ${topic} (CEFR ${level})\n\n- **First Conditional:** If they *deliver* the contract on time, we *will execute* the rollout.\n- **Second Conditional:** If we *had* a larger budget, we *would outsource* the localization.\n\n**Practice prompt:** Record an explanation of what would happen if the launch date slipped.`;
      }
      setGeneratedText(content);
      setGenerating(false);
      triggerToast('✨ Lição gerada com sucesso via motor LingoLIVE AI Core!');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-display flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
          AI Content Generator
        </h2>
        <p className="text-xs text-slate-400">Acelere seu desenvolvimento de conteúdo escolar usando inteligência artificial fônica para gerar roteiros, histórias e vocabulário.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 h-max">
          <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest border-b border-slate-850 pb-2">AI Settings</h3>
          <form onSubmit={handleGenerate} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Tema ou Assunto</label>
              <input
                type="text"
                placeholder="Ex: Reunião Comercial de Software..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-250 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Nível CEFR Alvo</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 font-semibold"
              >
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Formato Pedagógico</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 font-semibold"
              >
                <option value="Dialogue">Diálogo de Roleplay Guiado</option>
                <option value="Vocabulary">Baralho de Vocabulário Técnico</option>
                <option value="Grammar">Exercícios de Gramática Focados</option>
              </select>
            </div>
            <button type="submit" disabled={generating || !topic.trim()} className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5">
              {generating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Gerar com LingoLIVE Core IA</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest border-b border-slate-850 pb-2">Conteúdo Produzido</h3>
          {generating ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
              <p className="text-xs text-slate-400 font-mono animate-pulse">Sintetizando fonemas nativos e estruturando árvore de decisão...</p>
            </div>
          ) : generatedText ? (
            <div className="space-y-4">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {generatedText}
              </div>
              <div className="flex justify-end gap-2.5 text-xs font-bold">
                <button 
                  onClick={() => {
                    setGeneratedText('');
                    triggerToast('🗑️ Conteúdo descartado.');
                  }}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 rounded-xl transition-all cursor-pointer"
                >
                  Limpar
                </button>
                <button 
                  onClick={() => triggerToast('✓ Conteúdo exportado para o Lesson Builder!')}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Exportar para Lições
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center space-y-2">
              <Sparkles className="w-10 h-10 text-slate-700 opacity-40 animate-pulse" />
              <p className="text-xs text-slate-400 font-bold">Workspace Inteligente Vazio</p>
              <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed">Defina as especificidades no painel lateral esquerdo e gere blueprints educacionais perfeitamente estruturados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Media Library View
export const MediaLibraryView: React.FC<ViewProps> = ({ triggerToast }) => {
  const [medias, setMedias] = useState([
    { id: 1, name: 'Sample Pitch Audio.mp3', size: '1.2 MB', ext: 'MP3' },
    { id: 2, name: 'IPA Phonetic Diagram.png', size: '420 KB', ext: 'PNG' },
    { id: 3, name: 'Customer Interview Script.pdf', size: '150 KB', ext: 'PDF' }
  ]);

  const handleUploadSim = () => {
    const name = prompt('Qual o nome do arquivo para upload?');
    if (!name) return;
    setMedias(prev => [...prev, {
      id: Date.now(),
      name,
      size: '150 KB',
      ext: name.split('.').pop()?.toUpperCase() || 'FILE'
    }]);
    triggerToast('✓ Arquivo multimídia armazenado na biblioteca escolar!');
  };

  const deleteMedia = (id: number) => {
    setMedias(prev => prev.filter(m => m.id !== id));
    triggerToast('🗑️ Arquivo multimídia removido.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-display flex items-center gap-2">
            <Image className="w-6 h-6 text-violet-400" />
            Media Library
          </h2>
          <p className="text-xs text-slate-400">Biblioteca de arquivos multimídia contendo áudios de gravação, imagens fônicas explicativas e diagramas.</p>
        </div>
        <button 
          onClick={handleUploadSim}
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
        >
          Carregar Arquivo (Drag & Drop)
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {medias.map((file) => (
          <div key={file.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between hover:border-slate-700 transition-all">
            <div>
              <span className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded font-black font-mono text-violet-400 uppercase border border-slate-850">{file.ext}</span>
              <p className="text-xs font-bold text-slate-200 mt-2 truncate max-w-[150px]">{file.name}</p>
              <p className="text-[10px] text-slate-500 font-semibold">{file.size}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => triggerToast(`👁️ Visualizando ${file.name}`)} className="text-[10px] font-bold text-violet-400 hover:underline">Ver</button>
              <button onClick={() => deleteMedia(file.id)} className="text-slate-500 hover:text-rose-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Question Bank View
export const QuestionBankView: React.FC<ViewProps> = ({ triggerToast }) => {
  const [questions, setQuestions] = useState([
    { id: 1, text: 'Introduce yourself in a formal business context. Focus on /θ/ sounds.', level: 'B2', dialect: 'UK English' },
    { id: 2, text: 'How do you handle a budget overflow in your department?', level: 'C1', dialect: 'US English' },
    { id: 3, text: 'Discuss the benefits of remote work compared to on-site work.', level: 'B1', dialect: 'AU English' }
  ]);

  const handleAddQuestion = () => {
    const text = prompt('Escreva a pergunta fonológica do exame:');
    if (!text) return;
    setQuestions(prev => [...prev, {
      id: Date.now(),
      text,
      level: 'B2',
      dialect: 'US English'
    }]);
    triggerToast('✓ Nova pergunta armazenada no Question Bank!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-display flex items-center gap-2">
            <Database className="w-6 h-6 text-violet-400" />
            Question Bank (Creator Central)
          </h2>
          <p className="text-xs text-slate-400">Acesse o banco de dados geral contendo milhares de perguntas orais de fonoaudiologia e quizzes.</p>
        </div>
        <button 
          onClick={handleAddQuestion}
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
        >
          Cadastrar Nova Pergunta
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
        {questions.map((q) => (
          <div key={q.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-800 transition-all">
            <div className="space-y-1">
              <p className="text-xs text-slate-200 font-bold leading-relaxed">"{q.text}"</p>
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-slate-900 border border-slate-850 px-2 py-0.5 rounded font-bold text-slate-400 font-mono">CEFR {q.level}</span>
                <span className="text-[9px] bg-slate-900 border border-slate-850 px-2 py-0.5 rounded font-bold text-violet-400 font-mono">{q.dialect}</span>
              </div>
            </div>
            <button 
              onClick={() => triggerToast('✓ Pergunta associada ao exame ativo!')}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
            >
              Adicionar ao Exame
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Resource Marketplace View
export const ResourceMarketplaceView: React.FC<ViewProps> = ({ triggerToast }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-display flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-violet-400" />
          Resource Marketplace
        </h2>
        <p className="text-xs text-slate-400">Compre ou compartilhe trilhas de aprendizado completas de idiomas para acelerar a formação dos alunos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'IELTS Cambridge Full Exam Plan', author: 'Dr. Michael J.', rating: '4.9 ⭐', price: 'Free', tags: ['IELTS', 'Speaking'] },
          { title: 'Corporate Negotiation Pack (Spanish)', author: 'Prof. Sarah J.', rating: '4.8 ⭐', price: 'Free', tags: ['Negócios', 'Espanhol'] },
          { title: 'Accent Neutralization Drills', author: 'Tutor AI Team', rating: '5.0 ⭐', price: 'Free', tags: ['Fônica', 'Pronúncia'] },
        ].map((item, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between h-52 hover:border-slate-750 transition-all">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {item.tags.map((t) => (
                  <span key={t} className="text-[8px] bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded text-indigo-400 font-bold font-mono uppercase">{t}</span>
                ))}
              </div>
              <h4 className="font-extrabold text-xs text-slate-200">{item.title}</h4>
              <p className="text-[10px] text-slate-500">Por {item.author} • {item.rating}</p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-850 pt-3">
              <span className="font-mono font-black text-sm text-emerald-400">{item.price}</span>
              <button onClick={() => triggerToast(`🎁 Pacote "${item.title}" importado com sucesso para a biblioteca!`)} className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-black text-[10px] rounded-lg transition-all uppercase tracking-wider cursor-pointer">Importar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Publishing Center View
export const PublishingCenterView: React.FC<ViewProps> = ({ triggerToast }) => {
  const [targetClass, setTargetClass] = useState('Turma Alfa');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-display flex items-center gap-2">
          <Globe className="w-6 h-6 text-violet-400" />
          Publishing Center
        </h2>
        <p className="text-xs text-slate-400">Publique suas criações fônicas na grade letiva da escola, catalogando o conteúdo ou exportando para canais externos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest border-b border-slate-850 pb-2">Destino da Publicação</h3>
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-450 font-black uppercase tracking-wider block">Selecione a Turma Alvo</label>
              <select
                value={targetClass}
                onChange={(e) => setTargetClass(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 font-semibold"
              >
                <option value="Turma Alfa">Turma Alfa (Inglês Executive)</option>
                <option value="Turma Beta">Turma Beta (IELTS Prep)</option>
                <option value="Toda a Escola">Disponibilizar para Toda a Instituição</option>
              </select>
            </div>
            <div className="flex items-center gap-2.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-850">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-200">Revisão Prévia Concluída</h4>
                <p className="text-[10px] text-slate-500">Este conteúdo passou pelas validações básicas fonológicas e gramaticais do motor de compliance fônico.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between h-52">
          <div>
            <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-widest border-b border-slate-850 pb-1">Concluir Publicação</h3>
            <p className="text-[11px] text-slate-500 mt-2">Ao publicar, todos os alunos receberão uma notificação instantânea de novas atividades disponíveis.</p>
          </div>
          <button 
            onClick={() => triggerToast(`🚀 Lição publicada com sucesso na grade de ${targetClass}!`)}
            className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Globe className="w-4 h-4" />
            Publicar Agora
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 11. LINGOLIVE AI REVIEW SYSTEM (LARS) VIEW
// ----------------------------------------------------
export const LarsView: React.FC<ViewProps> = ({ triggerToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'rules' | 'metrics'>('pending');
  const [selectedReview, setSelectedReview] = useState<any | null>({
    id: 'r1',
    student: 'Marta Rebelo',
    avatar: '👩‍💼',
    activity: 'IELTS Speaking Section 2: Case Proposal',
    date: 'Há 5 minutos',
    dialect: 'UK English',
    audioUrl: '#',
    transcription: 'I believe that we should focus on the synergy between these projects as it will improve execution speed.',
    incorrectPhonemes: [
      { text: 'synergy', ipa: '/ˈsɪn.ə.dʒi/', status: 'error', feedback: 'O som sibilante inicial foi excessivamente forte.' },
      { text: 'execution', ipa: '/ˌek.sɪˈkjuː.ʃən/', status: 'warning', feedback: 'Tolerância aceitável mas houve hesitação na vogal média.' }
    ],
    aiScores: { pronunciation: 82, fluency: 88, vocabulary: 90, grammar: 84 },
    aiFeedback: 'Great clarity in the presentation. Pay attention to the pronunciation of the word "synergy" ensuring a softer /s/ sound, and practice vowel length in "speed".'
  });

  const [pendingReviews, setPendingReviews] = useState([
    {
      id: 'r1',
      student: 'Marta Rebelo',
      avatar: '👩‍💼',
      activity: 'IELTS Speaking Section 2: Case Proposal',
      date: 'Há 5 minutos',
      dialect: 'UK English',
      audioUrl: '#',
      transcription: 'I believe that we should focus on the synergy between these projects as it will improve execution speed.',
      incorrectPhonemes: [
        { text: 'synergy', ipa: '/ˈsɪn.ə.dʒi/', status: 'error', feedback: 'O som sibilante inicial foi excessivamente forte.' },
        { text: 'execution', ipa: '/ˌek.sɪˈkjuː.ʃən/', status: 'warning', feedback: 'Tolerância aceitável mas houve hesitação na vogal média.' }
      ],
      aiScores: { pronunciation: 82, fluency: 88, vocabulary: 90, grammar: 84 },
      aiFeedback: 'Great clarity in the presentation. Pay attention to the pronunciation of the word "synergy" ensuring a softer /s/ sound, and practice vowel length in "speed".'
    },
    {
      id: 'r2',
      student: 'Ricardo Dias',
      avatar: '👨‍💼',
      activity: 'Executive Meeting Pitching',
      date: 'Há 12 minutos',
      dialect: 'US English',
      audioUrl: '#',
      transcription: 'Our revenue exceeded our targets by twelve percent this quarter.',
      incorrectPhonemes: [
        { text: 'revenue', ipa: '/ˈrev.ən.juː/', status: 'error', feedback: 'O fonema labiodental /v/ soou como oclusiva bilabial /b/.' }
      ],
      aiScores: { pronunciation: 74, fluency: 82, vocabulary: 80, grammar: 90 },
      aiFeedback: 'Perfect grammar structure. Make sure you fully articulate the sound of the /v/ in "revenue" avoiding a Spanish-like soft /b/ sound.'
    },
    {
      id: 'r3',
      student: 'Beatriz Lima',
      avatar: '👩‍⚕️',
      activity: 'Medical Presentation Summary',
      date: 'Há 1 hora',
      dialect: 'US English',
      audioUrl: '#',
      transcription: 'The patient responded very well to the proposed therapeutic interventions.',
      incorrectPhonemes: [
        { text: 'therapeutic', ipa: '/ˌθer.əˈpjuː.tɪk/', status: 'error', feedback: 'O som interdental do "th" /θ/ foi pronunciado como /t/.' }
      ],
      aiScores: { pronunciation: 78, fluency: 85, vocabulary: 94, grammar: 92 },
      aiFeedback: 'Very professional vocabulary. Practice the placement of the tongue between your teeth for the /θ/ in "therapeutic" to avoid producing a hard /t/ sound.'
    }
  ]);

  const [editedFeedback, setEditedFeedback] = useState(selectedReview ? selectedReview.aiFeedback : '');
  const [sliders, setSliders] = useState({ pronunciation: 82, fluency: 88, vocabulary: 90, grammar: 84 });

  React.useEffect(() => {
    if (selectedReview) {
      setEditedFeedback(selectedReview.aiFeedback);
      setSliders(selectedReview.aiScores);
    }
  }, [selectedReview]);

  const handleApprove = () => {
    if (!selectedReview) return;
    triggerToast(`✓ LARS: Avaliação para ${selectedReview.student} aprovada com sucesso!`);
    const remaining = pendingReviews.filter(r => r.id !== selectedReview.id);
    setPendingReviews(remaining);
    if (remaining.length > 0) {
      setSelectedReview(remaining[0]);
    } else {
      setSelectedReview(null);
    }
  };

  const handleRegenerate = () => {
    triggerToast('⚡ LARS: Re-solicitando geração do relatório oratório com o modelo Gemini...');
    setTimeout(() => {
      setEditedFeedback(prev => prev + '\n\n*Nota Adicional da IA:* Focando prioritariamente na clareza vocal e velocidade de fala.');
      triggerToast('✓ LARS: Feedback re-sintetizado com o motor AI!');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-display flex items-center gap-2">
            <Cpu className="w-6 h-6 text-indigo-400 animate-pulse" />
            LingoLIVE AI Review System (LARS)
          </h2>
          <p className="text-xs text-slate-400">Auditoria e controle humano pedagógico sobre as notas e correções automáticas geradas pela IA.</p>
        </div>
        <div className="flex gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl self-start sm:self-auto">
          {(['pending', 'rules', 'metrics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === tab
                  ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'pending' && `Pendentes (${pendingReviews.length})`}
              {tab === 'rules' && 'Filtros & Calibragem'}
              {tab === 'metrics' && 'Performance & Validez'}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'pending' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Fila de Gravações Oratoriais</span>
              {pendingReviews.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
                  <p className="text-xs text-slate-400 font-bold">Fila de Auditoria Limpa!</p>
                  <p className="text-[10px] text-slate-500">Nenhum áudio de estudante aguarda revisão manual neste momento.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingReviews.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => setSelectedReview(r)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        selectedReview?.id === r.id
                          ? 'bg-indigo-500/5 border-indigo-500/30'
                          : 'bg-slate-950 border-slate-850/60 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{r.avatar}</span>
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-200">{r.student}</h4>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{r.activity}</p>
                          <span className="text-[9px] font-mono font-bold text-slate-650 mt-1 block">{r.date}</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-black text-indigo-400">{r.aiScores.pronunciation}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedReview ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6">
                <div className="flex items-start justify-between border-b border-slate-850 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{selectedReview.avatar}</span>
                    <div>
                      <h3 className="font-extrabold text-slate-100 text-sm sm:text-base">{selectedReview.student}</h3>
                      <p className="text-xs text-slate-400">{selectedReview.activity} • <span className="font-mono">{selectedReview.dialect}</span></p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                    LARS Pre-Grading
                  </span>
                </div>

                {/* Audio block simulator */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 animate-bounce" /> Gravação de Voz do Estudante
                  </span>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => triggerToast('🔊 Tocando o arquivo de áudio do aluno...')}
                      className="w-9 h-9 rounded-full bg-indigo-500 text-slate-950 flex items-center justify-center font-bold hover:bg-indigo-400 transition-all cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
                    </button>
                    <div className="flex-1 h-8 flex items-center gap-1">
                      {/* Fake Waveform */}
                      {[12, 18, 8, 24, 32, 16, 20, 10, 28, 38, 14, 22, 18, 28, 42, 34, 12, 10, 24, 30, 8, 12, 18].map((h, i) => (
                        <div key={i} className="flex-1 bg-indigo-500/20 rounded-full" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">0:08</span>
                  </div>
                </div>

                {/* Phonemic highlights */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Detecção de Erros Fonéticos pelo Gemini API</span>
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3.5">
                    <p className="text-xs text-slate-350 leading-relaxed font-semibold italic">
                      "{selectedReview.transcription}"
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {selectedReview.incorrectPhonemes.map((ph: any, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-1">
                          <div className="flex justify-between items-center">
                            <strong className="text-slate-100 text-xs font-black">{ph.text}</strong>
                            <span className="text-[10px] text-indigo-400 font-mono font-bold">{ph.ipa}</span>
                          </div>
                          <span className="inline-block px-1.5 py-0.5 text-[8px] font-black uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded font-mono">
                            {ph.status === 'error' ? 'Erro Crítico' : 'Tolerância Média'}
                          </span>
                          <p className="text-[10px] text-slate-550 pt-1 leading-relaxed">{ph.feedback}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sliders override */}
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Ajustes & Override das Notas de IA</span>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(sliders).map(([key, value]) => (
                      <div key={key} className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold capitalize text-slate-350">{key === 'pronunciation' ? 'Pronúncia' : key === 'fluency' ? 'Fluência' : key === 'vocabulary' ? 'Vocabulário' : 'Gramática'}</span>
                          <span className="font-mono font-bold text-indigo-400">{value}%</span>
                        </div>
                        <input
                          type="range"
                          min="40"
                          max="100"
                          value={value}
                          onChange={(e) => {
                            setSliders(prev => ({ ...prev, [key]: Number(e.target.value) }));
                          }}
                          className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Edit feedb */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Feedback do Relatório Final (Editável)</span>
                  <textarea
                    value={editedFeedback}
                    onChange={(e) => setEditedFeedback(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 p-3.5 rounded-xl text-xs text-slate-200 placeholder:text-slate-650 h-24 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed font-semibold"
                  />
                </div>

                <div className="flex justify-end gap-3 text-xs font-bold border-t border-slate-850 pt-5">
                  <button 
                    onClick={handleRegenerate}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 rounded-xl transition-all cursor-pointer"
                  >
                    Regerar via IA
                  </button>
                  <button 
                    onClick={handleApprove}
                    className="px-5 py-2 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Aprovar & Publicar
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-12 text-center text-xs text-slate-500 space-y-3">
                <CheckSquare className="w-12 h-12 mx-auto text-slate-700 opacity-40" />
                <p className="font-bold text-slate-400">Nenhum Caso de LARS Carregado</p>
                <p className="max-w-xs mx-auto">Tudo certo! Selecione um aluno na lista ao lado para iniciar a auditoria fônica assistida por inteligência de voz.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'rules' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6 text-xs">
          <h3 className="font-extrabold text-sm text-slate-100 border-b border-slate-850 pb-2 uppercase tracking-wider">Regras de Validade & Sotaques (IA Fine-Tuning Rules)</h3>
          <p className="text-slate-400 leading-relaxed">Customize a inteligência de processamento de voz para entender desvios aceitáveis e focar na redução de sotaques específicos.</p>
          
          <div className="space-y-4">
            {[
              { title: 'Ignorar sotaque regional (Indian / Spanish / Portuguese English)', desc: 'Evita penalizar pequenos desvios de sotaque que não afetam a compreensão internacional.', defaultOn: true },
              { title: 'Detector de Hesitação Severo', desc: 'Pontua negativamente pausas de silêncio superiores a 2.5 segundos no cálculo de fluência.', defaultOn: true },
              { title: 'Foco estrito em sibilantes (/s/, /z/, /θ/)', desc: 'Gera alertas avançados de fonoaudiologia caso o aluno confunda fonemas fônicos com "th".', defaultOn: false }
            ].map((rule, idx) => (
              <div key={idx} className="flex items-center justify-between py-3.5 border-b border-slate-850/50">
                <div className="space-y-0.5 max-w-[80%]">
                  <h4 className="font-bold text-slate-200">{rule.title}</h4>
                  <p className="text-[11px] text-slate-500">{rule.desc}</p>
                </div>
                <button
                  onClick={() => triggerToast(`⚙️ Regra de calibragem atualizada!`)}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-[10px] font-black text-indigo-400 rounded-lg transition-all"
                >
                  Alternar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'metrics' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6">
          <h3 className="font-extrabold text-sm text-slate-100 border-b border-slate-850 pb-2 uppercase tracking-wider">Correlação IA vs Validação Humana</h3>
          <p className="text-xs text-slate-400">Taxa de paridade média: <strong className="text-emerald-400 font-mono font-black text-sm">96.4%</strong>. Os relatórios gerados pela inteligência artificial coincidem em 96.4% com as notas corrigidas manualmente pelos professores.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-center space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Total Avaliado LARS</span>
              <p className="font-mono font-black text-lg text-slate-200">142 áudios</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-center space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Velocidade Média Auditoria</span>
              <p className="font-mono font-black text-lg text-indigo-400">45 seg / áudio</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-center space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Erros de Pronúncia Corrigidos</span>
              <p className="font-mono font-black text-lg text-emerald-400">98.2% precisão</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

