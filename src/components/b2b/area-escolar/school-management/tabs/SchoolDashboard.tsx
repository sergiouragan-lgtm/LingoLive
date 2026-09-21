import React from 'react';
import {
  GraduationCap, Users, BookOpen, ClipboardList, Award,
  Clock, Sparkles, TrendingUp, Settings2, CalendarDays,
  AlertTriangle, FileText, Download, RefreshCw
} from 'lucide-react';
import { StatCard, TabHeader } from '../components';

interface SchoolDashboardProps {
  onSync: (section: string) => void;
  isSyncing: string | null;
}

export const SchoolDashboard: React.FC<SchoolDashboardProps> = ({ onSync, isSyncing }) => (
  <div className="space-y-6">
    <TabHeader
      title="Resumo Executivo da Escola"
      subtitle="Indicadores consolidados, eventos urgentes e integridade da licença corporativa."
      onSync={() => onSync('dashboard')}
      isSyncing={isSyncing === 'dashboard'}
    />

    {/* KPI Cards Grid */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {[
        { label: 'Alunos Ativos', val: '1.248', icon: GraduationCap, color: 'text-indigo-600 bg-indigo-50' },
        { label: 'Professores', val: '58', icon: Users, color: 'text-emerald-600 bg-emerald-50' },
        { label: 'Turmas', val: '42', icon: BookOpen, color: 'text-amber-600 bg-amber-50' },
        { label: 'Cursos Ativos', val: '96', icon: ClipboardList, color: 'text-rose-600 bg-rose-50' },
        { label: 'Idiomas Ativos', val: '4', icon: Award, color: 'text-purple-600 bg-purple-50' },
        { label: 'Média Geral', val: '81%', icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
        { label: 'Frequência Hoje', val: '94%', icon: Clock, color: 'text-teal-600 bg-teal-50' },
        { label: 'IA Utilizada Hoje', val: '3.412 sessões', icon: Sparkles, color: 'text-pink-600 bg-pink-50' },
      ].map((stat, idx) => (
        <StatCard key={idx} {...stat} />
      ))}

      {/* License Card */}
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

    {/* Events, Alerts, Reports Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
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
            { date: '09 JUL', title: 'Feira de Idiomas LingoLIVE', desc: 'Apresentação dos projetos práticos dos alunos.' },
            { date: '15 JUL', title: 'Conselho de Professores', desc: 'Revisão das notas parciais e engajamento com IA.' },
            { date: '22 JUL', title: 'Libertação dos Certificados', desc: 'Emissão automatizada baseada no progresso CEFR.' },
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

      {/* Alerts */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={18} />
            <h3 className="font-bold text-slate-900 text-sm">Alertas do Diretor</h3>
          </div>
          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md">Urgente</span>
        </div>
        <div className="space-y-3">
          {[
            { title: 'Queda de Desempenho', msg: 'A turma 8B registou uma queda acentuada de 15% em Listening nas últimas 2 semanas.', color: 'rose' },
            { title: 'Alunos em Risco', msg: 'Há 12 alunos identificados pela IA como alto risco de reprovação ou abandono por baixa frequência.', color: 'amber' },
          ].map((alert, idx) => (
            <div key={idx} className={`p-3 bg-${alert.color}-50 rounded-xl border border-${alert.color}-100 text-xs`}>
              <div className={`flex items-center gap-1.5 font-semibold text-${alert.color}-800 mb-1`}>
                <AlertTriangle size={14} />
                <span>{alert.title}</span>
              </div>
              <p className={`text-${alert.color}-700`}>{alert.msg}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reports */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="text-emerald-600" size={18} />
            <h3 className="font-bold text-slate-900 text-sm">Últimos Relatórios</h3>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { file: 'Consolidado_Trimestre2.pdf', size: '1.4 MB' },
            { file: 'Insights_Cognitivos_Gerais.xlsx', size: '850 KB' },
            { file: 'Estatisticas_Uso_IA_Junho.pdf', size: '2.1 MB' },
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
);
