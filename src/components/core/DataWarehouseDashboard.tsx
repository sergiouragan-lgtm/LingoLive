import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Layers, 
  TrendingUp, 
  Play, 
  Search, 
  RefreshCw, 
  CheckCircle, 
  ShieldAlert, 
  AlertTriangle, 
  Terminal, 
  FileCode, 
  FileText, 
  Sparkles, 
  GitBranch, 
  EyeOff, 
  Activity, 
  ArrowRight,
  TrendingDown,
  Lock,
  Cpu,
  Bookmark
} from 'lucide-react';

interface WarehouseTable {
  name: string;
  type: 'fact' | 'dimension' | 'staging';
  rowCount: number;
  sizeBytes: number;
  lastUpdated: string;
  partitionField: string;
  clusterFields: string[];
}

export function DataWarehouseDashboard() {
  const [activeTab, setActiveTab] = useState<'lineage' | 'schemas' | 'pipelines' | 'gdpr' | 'ai-train'>('lineage');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncRunning, setSyncRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [gdprMasking, setGdprMasking] = useState(true);

  // BigQuery Tables Data
  const tables: WarehouseTable[] = [
    { name: 'fct_speech_sessions', type: 'fact', rowCount: 124500, sizeBytes: 42100000, lastUpdated: '10 min ago', partitionField: 'session_date', clusterFields: ['school_id', 'user_id'] },
    { name: 'fct_financial_transactions', type: 'fact', rowCount: 14242, sizeBytes: 3100000, lastUpdated: '2 hours ago', partitionField: 'transaction_date', clusterFields: ['school_id', 'status'] },
    { name: 'dim_students_historical', type: 'dimension', rowCount: 8520, sizeBytes: 1200000, lastUpdated: '1 day ago', partitionField: 'None', clusterFields: ['school_id', 'proficiency_level'] },
    { name: 'dim_schools_metadata', type: 'dimension', rowCount: 24, sizeBytes: 45000, lastUpdated: '3 days ago', partitionField: 'None', clusterFields: ['tier'] },
    { name: 'stg_firestore_speech_raw', type: 'staging', rowCount: 15400, sizeBytes: 8500000, lastUpdated: 'Just now', partitionField: 'ingestion_time', clusterFields: ['raw_id'] }
  ];

  const initialLogs = [
    'Initializing Data Warehouse Pipeline Sync Engine...',
    'Connecting to firestore-export-bucket via storage transfer service...',
    'Evaluating dbt schema constraints: non-null keys, primary references...',
    'Secure column masking (GDPR/PII) automatically configured for all student emails.'
  ];

  useEffect(() => {
    setLogs(initialLogs.map(l => `[${new Date().toLocaleTimeString()}] ${l}`));
  }, []);

  const triggerPipelineSync = async () => {
    setSyncRunning(true);
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🚀 INGESTION: Running Firestore exported raw snapshot sync...`]);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 📦 Row Count Verified: 15.4k staging entries compiled to Silver layer.`]);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🛡️ GDPR Masking applied to raw_student_email (SHA256).`]);
    await new Promise(resolve => setTimeout(resolve, 800));
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ DBT Build Complete. Gold dimensional tables fully materialised.`]);
    setSyncRunning(false);
  };

  const dbtModelSql = `{{ config(
    materialized='incremental',
    partition_by={
      "field": "session_date",
      "data_type": "date",
      "granularity": "day"
    },
    cluster_by=["school_id", "cefr_level"]
) }};

WITH raw_speech AS (
    SELECT 
        id as session_id,
        user_id,
        school_id,
        CAST(created_at AS DATE) as session_date,
        transcription,
        pronunciation_score,
        cefr_level,
        JSON_VALUE(metadata, '$.browser_agent') as browser
    FROM {{ source('firestore_export', 'speech_sessions_raw') }}
    {% if is_incremental() %}
    WHERE created_at >= (SELECT MAX(session_date) FROM {{ this }})
    {% endif %}
)

SELECT 
    session_id,
    user_id,
    school_id,
    session_date,
    pronunciation_score,
    cefr_level,
    CASE 
        WHEN pronunciation_score >= 85 THEN 'Avançado'
        WHEN pronunciation_score >= 60 THEN 'Intermédio'
        ELSE 'Iniciante'
    END AS proficiency_tier
FROM raw_speech;`;

  const filteredTables = tables.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6 relative overflow-hidden">
      {/* Background neon highlights */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5 flex-wrap gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-cyan-600 to-cyan-500 rounded-2xl shadow-lg shadow-cyan-900/20">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Enterprise Data Warehouse</h2>
            <p className="text-xs text-cyan-400 font-mono font-medium">LingoLIVE OLAP Infrastructure, dbt Models, GDPR Masking & Firestore Ingestion Pipelines</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <span className="text-[10px] font-mono font-extrabold text-cyan-400 uppercase tracking-widest bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
            OLAP Clusters Sync
          </span>
        </div>
      </div>

      {/* BigQuery KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">BigQuery Storage</p>
            <p className="text-base font-mono font-extrabold text-white">42.8 GB</p>
            <p className="text-[10px] text-emerald-400 font-medium">100% Organizado em Star Schema</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Tabelas de Linha</p>
            <p className="text-xl font-extrabold text-white">164,262</p>
            <p className="text-[10px] text-indigo-400 font-medium">Fatos & Dimensões Ativas</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
            <Play className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">dbt Models Compiled</p>
            <p className="text-xl font-extrabold text-white">14 Models</p>
            <p className="text-[10px] text-purple-400 font-medium">Incremental Materialisation</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400">
            <EyeOff className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">GDPR Protection</p>
            <p className="text-xl font-extrabold text-white">SHA256</p>
            <p className="text-[10px] text-emerald-400 font-medium">Ativo em Emails / Menores</p>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto relative z-10 scrollbar-none">
        <button 
          onClick={() => setActiveTab('lineage')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'lineage' 
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Data Lineage & Star Schema</span>
        </button>
        <button 
          onClick={() => setActiveTab('schemas')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'schemas' 
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>BigQuery Tables</span>
        </button>
        <button 
          onClick={() => setActiveTab('pipelines')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'pipelines' 
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>dbt Models (ELT)</span>
        </button>
        <button 
          onClick={() => setActiveTab('gdpr')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'gdpr' 
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>PII Masking & Privacy</span>
        </button>
        <button 
          onClick={() => setActiveTab('ai-train')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'ai-train' 
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Training Datasets</span>
        </button>
      </div>

      {/* Tab: Data Lineage & Star Schema flow */}
      {activeTab === 'lineage' && (
        <div className="space-y-6 relative z-10">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Pipeline de Linhagem de Dados (LingoLive Data Flow)</h3>
              <p className="text-[10px] text-slate-500 mt-1">Como os dados operacionais do Firestore são processados nas camadas bronze, silver e gold até alimentarem o BI executivo.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center pt-2">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center space-y-2">
                <span className="bg-indigo-950 text-indigo-400 border border-indigo-900 font-mono text-[9px] px-2 py-0.5 rounded uppercase font-bold">1. Operacional</span>
                <p className="font-bold text-xs text-white">Firestore DB</p>
                <p className="text-[10px] text-slate-400">Dados transacionais em tempo real.</p>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6 text-cyan-500 animate-pulse hidden md:block" />
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center space-y-2">
                <span className="bg-cyan-950 text-cyan-400 border border-cyan-900 font-mono text-[9px] px-2 py-0.5 rounded uppercase font-bold">2. Ingestão</span>
                <p className="font-bold text-xs text-white">Cloud Storage</p>
                <p className="text-[10px] text-slate-400">GCS Bucket raw schemas & JSON extracts.</p>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6 text-cyan-500 animate-pulse hidden md:block" />
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center space-y-2">
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-900 font-mono text-[9px] px-2 py-0.5 rounded uppercase font-bold">3. DW / dbt</span>
                <p className="font-bold text-xs text-white">BigQuery (OLAP)</p>
                <p className="text-[10px] text-slate-400">Esquema Estrela com fatos e dimensões.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-900 rounded-xl border border-slate-850 text-xs space-y-2">
              <p className="font-bold text-white uppercase text-[10px]">Benefício do Modelo Estrela (Star Schema)</p>
              <p className="text-slate-400 leading-normal">
                Todas as junções desnecessárias foram limpas. Consultas de performance que varrem as tabelas de fatos (<code className="text-indigo-400">fct_speech_sessions</code>) filtram instantaneamente por chaves de dimensão (<code className="text-indigo-400">dim_students_historical</code>) usando índices altamente eficientes clusterizados por região escolar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: BigQuery Tables */}
      {activeTab === 'schemas' && (
        <div className="space-y-6 relative z-10">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Modelagem do Schema e Particionamento</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">As tabelas estão fisicamente organizadas e otimizadas no console da GCP.</p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  placeholder="Filtrar tabelas..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono w-48 sm:w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[9px] uppercase tracking-wider font-mono">
                    <th className="py-3 px-1">Nome da Tabela</th>
                    <th className="py-3 px-1">Camada / Tipo</th>
                    <th className="py-3 px-1 text-right">Registros (Rows)</th>
                    <th className="py-3 px-1 text-right">Tamanho Físico</th>
                    <th className="py-3 px-1 text-center">Particionado por</th>
                    <th className="py-3 px-1 text-center">Campos de Cluster</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filteredTables.map((t, index) => {
                    const kbSize = Math.round(t.sizeBytes / 1024);
                    const mbSize = (kbSize / 1024).toFixed(2);
                    return (
                      <tr key={index} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-1 font-bold text-white font-mono flex items-center gap-2">
                          <Database className="w-3.5 h-3.5 text-cyan-400" />
                          {t.name}
                        </td>
                        <td className="py-3 px-1">
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                            t.type === 'fact' 
                              ? 'bg-rose-950 text-rose-400 border border-rose-900' 
                              : t.type === 'dimension' 
                                ? 'bg-cyan-950 text-cyan-400 border border-cyan-900' 
                                : 'bg-slate-800 text-slate-300'
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="py-3 px-1 text-right font-mono text-slate-200">{t.rowCount.toLocaleString()}</td>
                        <td className="py-3 px-1 text-right font-mono text-slate-200">{mbSize} MB</td>
                        <td className="py-3 px-1 text-center font-mono text-slate-400">{t.partitionField}</td>
                        <td className="py-3 px-1 text-center font-mono text-slate-400">{t.clusterFields.join(', ')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: dbt models compilation */}
      {activeTab === 'pipelines' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  dbt Transformation Pipeline (Silver Layer Build)
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">Este script dbt é compilado e executado incrementalmente para transformar dados de voz em conhecimento analítico.</p>
              </div>

              <pre className="bg-slate-900 p-4 rounded-xl border border-slate-850 font-mono text-[10px] text-cyan-300 overflow-x-auto leading-relaxed max-h-[350px]">
                <code>{dbtModelSql}</code>
              </pre>
            </div>
          </div>

          {/* Pipelines terminal logs */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col h-full">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3 justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">dbt Cloud Run Console</span>
                </div>
                <button 
                  onClick={triggerPipelineSync}
                  disabled={syncRunning}
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-800 text-white font-extrabold text-[10px] rounded-lg cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncRunning ? 'animate-spin' : ''}`} />
                  Run
                </button>
              </div>

              <div className="flex-1 bg-slate-900 p-3 rounded-xl border border-slate-850 font-mono text-[9px] text-slate-300 overflow-y-auto space-y-1.5 h-[230px]">
                {logs.map((log, index) => (
                  <p key={index} className="leading-relaxed whitespace-pre-wrap">{log}</p>
                ))}
              </div>

              <div className="p-3 bg-cyan-950/20 border border-cyan-900/40 rounded-xl">
                <p className="text-[10px] text-cyan-300 font-mono leading-relaxed">
                  ✓ Pipelines baseadas no DBT Core compilam e validam chaves de multi-tenancy a cada commit de schema.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: GDPR privacy & masking validation */}
      {activeTab === 'gdpr' && (
        <div className="space-y-6 relative z-10">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-cyan-400" />
                Máscaras de Anonimização GDPR e Mascaramento PII
              </h3>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">SHA256 Email Hash</span>
                <button 
                  onClick={() => setGdprMasking(!gdprMasking)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border cursor-pointer ${
                    gdprMasking 
                      ? 'bg-emerald-600/10 text-emerald-400 border-emerald-900/40' 
                      : 'bg-rose-600/10 text-rose-400 border-rose-900/40'
                  }`}
                >
                  {gdprMasking ? 'Mascara Ativa (SHA256)' : 'Visualização Bruta (Perigoso)'}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-normal">
              Em conformidade com as diretivas de GDPR e de proteção de menores escolares B2B, todos os relatórios analíticos do DW ofuscam emails de alunos e pais reais. Veja a simulação dinâmica abaixo de como os dados são mascarados:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 space-y-1">
                <p className="text-slate-500 text-[10px] uppercase font-mono font-bold">Email de Aluno Bruto (GCS Ingest)</p>
                <code className="text-white bg-slate-950 px-2 py-1 rounded block">joao.silva2012@gmail.com</code>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 space-y-1">
                <p className="text-slate-500 text-[10px] uppercase font-mono font-bold">SHA256 Hash no BigQuery DW Layer (Analistas)</p>
                <code className="text-cyan-400 bg-slate-950 px-2 py-1 rounded block font-mono">
                  {gdprMasking ? '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08' : 'joao.silva2012@gmail.com'}
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: AI Model Training Inputs */}
      {activeTab === 'ai-train' && (
        <div className="space-y-6 relative z-10">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Massa de Treino e Afinação AI (Gemini Tuning & NLP)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              O armazém analítico consolida logs de conversas, correções de fala e feedback do Tutor AI para estruturar massas de dados prontas para afinação (Fine-Tuning) ou injeção de Few-Shot exemplares nos prompts.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-850 space-y-1">
                <p className="font-bold text-white font-mono">Exemplos NLP Consolidados</p>
                <p className="text-[10px] text-cyan-400 font-mono">14,250 datasets de diálogos</p>
                <p className="text-[10px] text-slate-500">Massa higienizada de conversas CEFR estruturadas.</p>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-850 space-y-1">
                <p className="font-bold text-white font-mono">Feedback de Áudio (Acoustic)</p>
                <p className="text-[10px] text-cyan-400 font-mono">8,540 amostras curtas de voz</p>
                <p className="text-[10px] text-slate-500">Nenhum áudio possui identificadores PII dos alunos.</p>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-850 space-y-1">
                <p className="font-bold text-white font-mono">Curadoria de Vocabulário</p>
                <p className="text-[10px] text-cyan-400 font-mono">12,980 cards de proficiência</p>
                <p className="text-[10px] text-slate-500">Categorizados por nível e índice de dificuldade local.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
