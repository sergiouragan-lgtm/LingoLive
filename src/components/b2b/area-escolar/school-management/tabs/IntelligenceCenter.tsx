import React from 'react';
import { TrendingUp, Sparkles, Award, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';

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

interface IntelligenceCenterProps {
  onSync: (section: string) => void;
  isSyncing: string | null;
  selectedClassTrend: string;
  setSelectedClassTrend: (trend: string) => void;
  atRiskFilter: 'all' | 'critical' | 'warning';
  setAtRiskFilter: (filter: 'all' | 'critical' | 'warning') => void;
  selectedAtRiskStudent: any | null;
  setSelectedAtRiskStudent: (student: any) => void;
  addToast: (msg: string) => void;
}

export const IntelligenceCenter: React.FC<IntelligenceCenterProps> = ({
  onSync,
  isSyncing,
  selectedClassTrend,
  setSelectedClassTrend,
  atRiskFilter,
  setAtRiskFilter,
  selectedAtRiskStudent,
  setSelectedAtRiskStudent,
  addToast,
}) => (
  <div className="space-y-6">
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
          onClick={() => onSync('analytics')}
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
          color: "text-indigo-600 bg-indigo-50 border-indigo-100",
          icon: TrendingUp
        },
        {
          label: "Engajamento com IA",
          val: selectedClassTrend === '8B' ? "88%" : selectedClassTrend === '7A' ? "95%" : "92.4%",
          change: "+14.1%",
          isPositive: true,
          color: "text-amber-600 bg-amber-50 border-amber-100",
          icon: Sparkles
        },
        {
          label: "Proficiência CEFR",
          val: "B1.2 Médio",
          change: "0.4 Nível",
          isPositive: true,
          color: "text-emerald-600 bg-emerald-50 border-emerald-100",
          icon: Award
        },
        {
          label: "Alunos Sob Alerta",
          val: "3 alunos",
          change: "-18%",
          isPositive: true,
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
          </div>
        </div>
      ))}
    </div>

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
              <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#F1F5F9', fontSize: '11px' }} />
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
              <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#F1F5F9', fontSize: '11px' }} />
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
              <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#F1F5F9', fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
              <Line type="monotone" dataKey="sessoesIA" name="Sessões Diárias de IA" stroke="#F59E0B" strokeWidth={3} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

    {/* Simplified Alert Summary */}
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <AlertTriangle className="text-rose-500" size={16} />
        <h3 className="font-bold text-slate-800 text-sm">Alertas Ativos: Alunos em Risco Pedagógico</h3>
      </div>
      <p className="text-xs text-slate-500 mb-4">Algoritmo preditivo de IA focado em evasão ou insuficiência académica.</p>

      <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-0.5 text-[10px] font-bold text-slate-600 mb-4">
        <button
          onClick={() => setAtRiskFilter('all')}
          className={`px-2 py-1 rounded-md transition-all ${atRiskFilter === 'all' ? 'bg-white text-slate-950 shadow-xs' : 'hover:bg-slate-100'}`}
        >
          Todos (3)
        </button>
        <button
          onClick={() => setAtRiskFilter('critical')}
          className={`px-2 py-1 rounded-md text-rose-700 transition-all ${atRiskFilter === 'critical' ? 'bg-rose-50 text-rose-950 shadow-xs' : 'hover:bg-slate-100'}`}
        >
          Crítico (1)
        </button>
        <button
          onClick={() => setAtRiskFilter('warning')}
          className={`px-2 py-1 rounded-md text-amber-700 transition-all ${atRiskFilter === 'warning' ? 'bg-amber-50 text-amber-950 shadow-xs' : 'hover:bg-slate-100'}`}
        >
          Atenção (2)
        </button>
      </div>

      <p className="text-[10px] text-slate-500 italic">O limiar de perigo da LingoLIVE IA baseia-se em: (Frequência &lt; 85%) OU (Nota de Quizzes Semanais &lt; 65%) OU (Ausência de conversação em IA por mais de 7 dias úteis).</p>
    </div>
  </div>
);
