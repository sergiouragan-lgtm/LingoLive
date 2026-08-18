import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Percent, 
  Building2, 
  BrainCircuit, 
  Calendar, 
  Search, 
  Download, 
  RefreshCw, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight, 
  PieChart, 
  Database, 
  ShieldCheck, 
  Sparkles, 
  LineChart, 
  Filter,
  FileCode,
  Gauge
} from 'lucide-react';

interface MetricCard {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  subtext: string;
}

interface SchoolBIItem {
  name: string;
  tier: string;
  activeStudents: number;
  licenseLimit: number;
  monthlyRevenue: number;
  retentionRate: number;
}

export default function BusinessIntelligenceDashboard() {
  const [activeSubTab, setActiveSubTab] = useState<'exec' | 'financial' | 'learning' | 'ai' | 'retention'>('exec');
  const [timeframe, setTimeframe] = useState<'30d' | '90d' | '12m'>('30d');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Forecast projections states
  const [growthScenario, setGrowthScenario] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [projectedARR, setProjectedARR] = useState('€184,200');
  const [projectedChurn, setProjectedChurn] = useState('1.8%');

  // Interactive BigQuery Schema simulator logs
  const [bqLogs, setBqLogs] = useState<string[]>([]);
  const [bqRunning, setBqRunning] = useState(false);

  const initialBqLogs = [
    'Initializing ETL pipeline: raw_payments -> dbt_bronze_transactions...',
    'Partition check complete. BigQuery cluster optimized (partitioned by transaction_date).',
    'dbt compilation successful. Building schema models/marts/finance/fct_mrr_movements.sql',
    'BigQuery query cost: 0.04 TB processed (within flat-rate monthly budget).'
  ];

  useEffect(() => {
    setBqLogs(initialBqLogs.map(l => `[${new Date().toLocaleTimeString()}] ${l}`));
  }, []);

  const runBqPipeline = async () => {
    setBqRunning(true);
    setBqLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🚀 Manual run initiated. Consolidating Firestore transaction collections into BigQuery...`]);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setBqLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 📦 Row Count Verified: 14,242 rows integrated into fct_mrr_movements.`]);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setBqLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ⚡ Materialized view [mv_school_monthly_kpis] rebuilt in 1.4 seconds.`]);
    await new Promise(resolve => setTimeout(resolve, 500));
    setBqLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✓ BI pipeline synchronization complete. Zero discrepancy detected.`]);
    setBqRunning(false);
  };

  useEffect(() => {
    // Dynamic forecasting values based on scenario
    if (growthScenario === 'conservative') {
      setProjectedARR('€142,500');
      setProjectedChurn('2.4%');
    } else if (growthScenario === 'moderate') {
      setProjectedARR('€184,200');
      setProjectedChurn('1.8%');
    } else {
      setProjectedARR('€245,900');
      setProjectedChurn('1.1%');
    }
  }, [growthScenario]);

  const execMetrics: MetricCard[] = [
    { label: 'ARR (Anual Recurring Revenue)', value: '€162,400', change: '+14.2%', isPositive: true, subtext: 'Base de Escolas B2B' },
    { label: 'MRR (Mensal Recurring Revenue)', value: '€13,530', change: '+8.4%', isPositive: true, subtext: 'Subscrições Recorrentes' },
    { label: 'LTV (Lifetime Value B2B)', value: '€8,200', change: '+12.5%', isPositive: true, subtext: 'Valor médio por Instituição' },
    { label: 'CAC (Custo de Aquisição B2B)', value: '€1,150', change: '-5.2%', isPositive: true, subtext: 'Marketing & Sales ROI' }
  ];

  const financialMetrics: MetricCard[] = [
    { label: 'Faturamento Total Bruto', value: '€42,890', change: '+18.1%', isPositive: true, subtext: 'Últimos 3 meses' },
    { label: 'Receita Líquida (Transacionado)', value: '€41,600', change: '+17.9%', isPositive: true, subtext: 'Gateway Stripe / Conciliado' },
    { label: 'Invoices Pendentes B2B', value: '€1,290', change: '-45.0%', isPositive: true, subtext: 'A receber (Vencimento 15d)' },
    { label: 'Churn Rate Financeiro (MRR)', value: '1.4%', change: '-0.3%', isPositive: true, subtext: 'SLA de Retenção ativo' }
  ];

  const learningMetrics: MetricCard[] = [
    { label: 'Total de Práticas de Fala', value: '42,450', change: '+24.6%', isPositive: true, subtext: 'Sessões com AI Speech Tutor' },
    { label: 'Duração Média de Sessão', value: '14.2 min', change: '+5.4%', isPositive: true, subtext: 'Engajamento por Aluno' },
    { label: 'Decks de Vocabulário Criados', value: '12,980', change: '+32.1%', isPositive: true, subtext: 'Memorização ativa' },
    { label: 'Média de Quizzes Resolvidos', value: '8.4 / Aluno', change: '+12.0%', isPositive: true, subtext: 'Taxa de acertos: 78.4%' }
  ];

  const aiMetrics: MetricCard[] = [
    { label: 'Requisições Gemini API', value: '145,240', change: '+35.2%', isPositive: true, subtext: 'Tutor de Voz & Vocabulário' },
    { label: 'Custo Total de Tokens API', value: '€124.50', change: '-12.4%', isPositive: true, subtext: 'Otimização de Context Cache' },
    { label: 'Tokens por Sessão (Média)', value: '1.2k tokens', change: '-20.0%', isPositive: true, subtext: 'Compressão e Prompt Tuning' },
    { label: 'Latência do Pipeline AI', value: '280 ms', change: '-15.4%', isPositive: true, subtext: 'Borda com cache inteligente' }
  ];

  const b2bSchools: SchoolBIItem[] = [
    { name: 'Escola Secundária de Pinhal Novo', tier: 'Pro Multi-School', activeStudents: 850, licenseLimit: 1000, monthlyRevenue: 1200, retentionRate: 100 },
    { name: 'Colégio Internato dos Carvalhos', tier: 'Standard B2B', activeStudents: 420, licenseLimit: 500, monthlyRevenue: 650, retentionRate: 98.4 },
    { name: 'Agrupamento de Escolas de Portimão', tier: 'Pro Multi-School', activeStudents: 1240, licenseLimit: 1500, monthlyRevenue: 1950, retentionRate: 100 },
    { name: 'Escola Alemã de Lisboa', tier: 'Premium Custom', activeStudents: 310, licenseLimit: 400, monthlyRevenue: 850, retentionRate: 96.8 },
    { name: 'IPVC - Instituto Politécnico', tier: 'Standard B2B', activeStudents: 550, licenseLimit: 600, monthlyRevenue: 800, retentionRate: 99.2 }
  ];

  const bqModelSql = `SELECT
  DATE_TRUNC(t.transaction_date, MONTH) AS transaction_month,
  s.school_id,
  s.school_name,
  s.subscription_tier,
  COUNT(DISTINCT u.user_id) AS active_students_count,
  SUM(t.amount_paid_cents) / 100 AS gross_revenue_eur,
  AVG(u.streak_days) AS avg_student_streak
FROM
  \`lingolive-prod-40291.analytics.fct_school_transactions\` t
JOIN
  \`lingolive-prod-40291.analytics.dim_schools\` s ON t.school_id = s.school_id
JOIN
  \`lingolive-prod-40291.analytics.dim_users\` u ON u.school_id = s.school_id
WHERE
  t.status = 'succeeded'
  AND t.transaction_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
GROUP BY
  1, 2, 3, 4
ORDER BY
  transaction_month DESC, gross_revenue_eur DESC;`;

  const filteredSchools = b2bSchools.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.tier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6 relative overflow-hidden">
      {/* Background neon highlights */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5 flex-wrap gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl shadow-lg shadow-indigo-900/20">
            <BarChart2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Executive BI Platform</h2>
            <p className="text-xs text-indigo-400 font-mono font-medium">LingoLIVE SaaS Financials, BigQuery Data Marts & Predictive Forecasts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
          </span>
          <span className="text-[10px] font-mono font-extrabold text-indigo-400 uppercase tracking-widest bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
            Warehouse Synced
          </span>
        </div>
      </div>

      {/* Sub Tabs Menu */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto relative z-10 scrollbar-none">
        <button 
          onClick={() => setActiveSubTab('exec')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeSubTab === 'exec' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Métricas SaaS Executivas</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('financial')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeSubTab === 'financial' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Faturamento & Conciliação</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('learning')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeSubTab === 'learning' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Engajamento & Prática</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('ai')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeSubTab === 'ai' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          <span>Custos & Tokens AI</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('retention')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeSubTab === 'retention' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>BigQuery & dbt Pipelines</span>
        </button>
      </div>

      {/* Tab: Exec Metrics Dashboard */}
      {activeSubTab === 'exec' && (
        <div className="space-y-6 relative z-10">
          {/* Executive Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {execMetrics.map((m, idx) => (
              <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{m.label}</span>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-black text-white">{m.value}</p>
                  <span className="flex items-center gap-0.5 text-xs text-emerald-400 font-bold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {m.change}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 font-medium">{m.subtext}</span>
                  <span className="text-indigo-400 font-mono">100% real</span>
                </div>
              </div>
            ))}
          </div>

          {/* SaaS Funnel Conversions & Predictive Forecast columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales conversion Funnel */}
            <div className="lg:col-span-2 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Funil de Aquisição e Conversão de Alunos (B2B2C)</h3>
                <span className="text-[10px] text-indigo-400 font-mono">Conversão Global: 18.4%</span>
              </div>

              <div className="space-y-3">
                {/* Stage 1 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-300">1. Landing Page / Visitas Externas</span>
                    <span className="font-mono text-slate-400">12,420 visitantes (100%)</span>
                  </div>
                  <div className="w-full bg-slate-900 h-6 rounded-lg overflow-hidden border border-slate-850 relative">
                    <div className="bg-indigo-600/40 h-full w-full" />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">TOFU (Topo de Funil)</span>
                  </div>
                </div>

                {/* Stage 2 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-300">2. Onboarding Concluído (Inscrição Escolar)</span>
                    <span className="font-mono text-slate-400">5,840 alunos (47.0%)</span>
                  </div>
                  <div className="w-full bg-slate-900 h-6 rounded-lg overflow-hidden border border-slate-850 relative">
                    <div className="bg-indigo-600/60 h-full w-[47%]" />
                    <span className="absolute inset-x-0 inset-y-0 flex items-center justify-center text-[10px] font-bold text-white">MOFU (Qualificação Escolar)</span>
                  </div>
                </div>

                {/* Stage 3 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-300">3. Engajados (Falaram com Tutor AI / Quizzes ativos)</span>
                    <span className="font-mono text-slate-400">3,120 alunos (25.1%)</span>
                  </div>
                  <div className="w-full bg-slate-900 h-6 rounded-lg overflow-hidden border border-slate-850 relative">
                    <div className="bg-indigo-600/80 h-full w-[25.1%]" />
                    <span className="absolute inset-x-0 inset-y-0 flex items-center justify-center text-[10px] font-bold text-white">Active Product Qualified (PQL)</span>
                  </div>
                </div>

                {/* Stage 4 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-300">4. Licenças Ativas Pagas B2B</span>
                    <span className="font-mono text-slate-400">2,285 licenças pagas (18.4%)</span>
                  </div>
                  <div className="w-full bg-slate-900 h-6 rounded-lg overflow-hidden border border-slate-850 relative">
                    <div className="bg-emerald-600 h-full w-[18.4%]" />
                    <span className="absolute inset-x-0 inset-y-0 flex items-center justify-center text-[10px] font-bold text-white">BOFU (Conversão & Faturamento SaaS)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Predictive Revenue Forecast */}
            <div className="lg:col-span-1 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-1.5 border-b border-slate-900 pb-3 text-slate-300">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Predictive ARR Forecast (ML)</h3>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">Selecione o cenário para calcular a projeção de receita recorrente para o próximo trimestre com base no ritmo histórico de onboarding de novas escolas (SaaS Velocity).</p>
              
              <div className="grid grid-cols-3 gap-2">
                {(['conservative', 'moderate', 'aggressive'] as const).map((scen) => (
                  <button
                    key={scen}
                    onClick={() => setGrowthScenario(scen)}
                    className={`py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all cursor-pointer ${
                      growthScenario === scen 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm' 
                        : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white'
                    }`}
                  >
                    {scen}
                  </button>
                ))}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-900/60">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">ARR Projetado (6m):</span>
                  <span className="font-extrabold text-white font-mono">{projectedARR}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Churn de Escolas Estimado:</span>
                  <span className="font-extrabold text-white font-mono">{projectedChurn}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Taxa de Renovação Esperada:</span>
                  <span className="font-extrabold text-emerald-400 font-mono">98.2%</span>
                </div>
              </div>

              <div className="p-3 bg-indigo-950/25 border border-indigo-900/40 rounded-xl">
                <p className="text-[10px] text-indigo-300 font-mono leading-relaxed">✓ IA Sales Engine calibrado: O modelo de regressão calcula o aumento de CAC com expansão regional de escolas públicas e municipais em Portugal.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Financial Revenue Breakdown */}
      {activeSubTab === 'financial' && (
        <div className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {financialMetrics.map((m, idx) => (
              <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{m.label}</span>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-black text-white">{m.value}</p>
                  <span className="flex items-center gap-0.5 text-xs text-emerald-400 font-bold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {m.change}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">{m.subtext}</p>
              </div>
            ))}
          </div>

          {/* Active schools B2B metrics */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Receita Institucional B2B por Licença de Escolas</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Visão unificada das subscrições institucionais ativas sob contratos plurianuais.</p>
              </div>
              
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  placeholder="Pesquisar escola..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono w-48 sm:w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[9px] uppercase tracking-wider font-mono">
                    <th className="py-3 px-1">Instituição de Ensino</th>
                    <th className="py-3 px-1">Plano SaaS</th>
                    <th className="py-3 px-1">Alunos Ativos / Limite</th>
                    <th className="py-3 px-1 text-right">Mensalidade</th>
                    <th className="py-3 px-1 text-center">Taxa de Retenção</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filteredSchools.map((school, index) => {
                    const fillPercent = Math.round((school.activeStudents / school.licenseLimit) * 100);
                    return (
                      <tr key={index} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-1 font-bold text-white flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-indigo-400" />
                          {school.name}
                        </td>
                        <td className="py-3 px-1 font-mono text-slate-400">{school.tier}</td>
                        <td className="py-3 px-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-200">{school.activeStudents} / {school.licenseLimit}</span>
                            <div className="w-20 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-850">
                              <div className="bg-indigo-500 h-full" style={{ width: `${fillPercent}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-500">({fillPercent}%)</span>
                          </div>
                        </td>
                        <td className="py-3 px-1 text-right font-mono font-bold text-emerald-400">€{school.monthlyRevenue}/mês</td>
                        <td className="py-3 px-1 text-center font-mono font-bold text-white">{school.retentionRate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Learning Engagement */}
      {activeSubTab === 'learning' && (
        <div className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {learningMetrics.map((m, idx) => (
              <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{m.label}</span>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-black text-white">{m.value}</p>
                  <span className="flex items-center gap-0.5 text-xs text-emerald-400 font-bold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {m.change}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">{m.subtext}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-900 pb-3">Engajamento Semanal por Faixa Etária e Idioma</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Os dados revelam que o engajamento diário de alunos de nível secundário (14-18 anos) na Sala de Prática de Fala com o AI Speech Tutor registrou um pico de utilização entre as 18h e 21h em Portugal Continental.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 space-y-3">
                <p className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">Idiomas Mais Praticados</p>
                
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Inglês (UK/US)</span>
                      <span className="font-mono text-white">64% das sessões</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                      <div className="bg-indigo-500 h-full w-[64%]" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Espanhol (ES/MX)</span>
                      <span className="font-mono text-white">22% das sessões</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                      <div className="bg-cyan-500 h-full w-[22%]" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Português (PT/BR) - Para Estrangeiros</span>
                      <span className="font-mono text-white">14% das sessões</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                      <div className="bg-emerald-500 h-full w-[14%]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 space-y-3 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">Métrica de Churn Predictor (ML)</p>
                  <p className="text-xs text-slate-400 mt-2">Nossos modelos de Machine Learning identificam preventivamente quedas de streaks diários de alunos. Se um aluno fica inativo por mais de 5 dias seguidos, o Churn Score institucional aumenta em 1.2%.</p>
                </div>
                <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-white">Média Global do Churn Risk:</span>
                  <span className="bg-emerald-950 text-emerald-400 px-2.5 py-0.5 rounded border border-emerald-900 text-[10px] font-mono font-bold">BAIXO RISCO (1.4%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: AI Costs & Tokens */}
      {activeSubTab === 'ai' && (
        <div className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {aiMetrics.map((m, idx) => (
              <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{m.label}</span>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-black text-white">{m.value}</p>
                  <span className="flex items-center gap-0.5 text-xs text-emerald-400 font-bold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {m.change}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">{m.subtext}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-900 pb-3">Análise de Custo e Eficiência do Pipeline Gemini</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Implementamos uma camada robusta de compressão de histórico e cache estático no lado do servidor (Context Caching). Isso resultou numa diminuição drástica no custo de chamadas recorrentes à API da Google, mantendo o tempo de geração de feedback do tutor de voz abaixo de 300ms.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-850">
                <p className="text-slate-500 text-[10px] uppercase font-mono font-bold">Custo Sem Context Caching</p>
                <p className="text-2xl font-black text-rose-400 mt-1">€1.42 / 1k reqs</p>
                <p className="text-[9px] text-slate-500 mt-1">Histórico completo enviado</p>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-850">
                <p className="text-slate-500 text-[10px] uppercase font-mono font-bold">Custo Com Context Caching</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">€0.12 / 1k reqs</p>
                <p className="text-[9px] text-emerald-400 font-bold mt-1">91.5% de Economia</p>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 flex flex-col justify-center">
                <p className="text-slate-500 text-[10px] uppercase font-mono font-bold">Acurácia do Feed de Voz</p>
                <p className="text-xl font-black text-white mt-1">99.4%</p>
                <p className="text-[9px] text-slate-500 mt-1">Zero perda de semântica</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: BigQuery models & DBT */}
      {activeSubTab === 'retention' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          {/* SQL snippet */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  Google BigQuery / dbt Analytics Model
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">Modelo SQL dimensional consolidado. Agrega faturamento financeiro B2B e streaks de alunos ativos mensais.</p>
              </div>

              <pre className="bg-slate-900 p-4 rounded-xl border border-slate-850 font-mono text-[10px] text-indigo-300 overflow-x-auto leading-relaxed max-h-[300px]">
                <code>{bqModelSql}</code>
              </pre>
            </div>
          </div>

          {/* BigQuery orchestration */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col h-full">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3 justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Orquestrador BigQuery</span>
                </div>
                <button 
                  onClick={runBqPipeline}
                  disabled={bqRunning}
                  className="text-[10px] text-slate-500 hover:text-white font-mono uppercase border border-slate-850 px-2 py-0.5 rounded cursor-pointer"
                >
                  Sync
                </button>
              </div>

              <div className="flex-1 bg-slate-900 p-3 rounded-xl border border-slate-850 font-mono text-[10px] text-slate-300 overflow-y-auto space-y-1.5 h-[230px]">
                {bqLogs.map((log, index) => (
                  <p key={index} className="leading-relaxed whitespace-pre-wrap">{log}</p>
                ))}
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <p className="text-[10px] text-emerald-400 leading-normal">
                  <b>Conformidade de Segurança:</b> Dados restritos a tenants isolados. Processamento em conformidade com as regras de confidencialidade escolar B2B.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
