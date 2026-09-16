import React, { useState, useEffect } from 'react';
import { AICostTrackerDashboard } from './AICostTrackerDashboard';
import { 
  Cpu, 
  Brain, 
  Coins, 
  DollarSign, 
  Sliders, 
  Database, 
  Play, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Search, 
  Lock, 
  ArrowRight, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingDown, 
  Flame, 
  Layers, 
  Zap, 
  BookOpen, 
  Terminal, 
  FileCode, 
  Activity, 
  Gauge, 
  ShieldCheck, 
  BellRing,
  Award
} from 'lucide-react';

interface ModelConfig {
  name: string;
  id: string;
  costPerMillionInput: number; // in USD
  costPerMillionOutput: number; // in USD
  avgLatencyMs: number;
  useCase: string;
}

interface SchoolLimit {
  schoolName: string;
  monthlyBudget: number; // in EUR
  spentBudget: number;
  dailyTokenLimit: number;
  activeStudents: number;
  alertThresholdPercent: number;
}

export function AICostOptimizationDashboard() {
  const [activeTab, setActiveTab] = useState<'monitor' | 'router' | 'cache' | 'limits' | 'docs' | 'tracker'>('monitor');
  const [loading, setLoading] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<'chat' | 'grading' | 'translation'>('chat');
  
  // Prompt Compression Simulator
  const [originalPrompt, setOriginalPrompt] = useState<string>(
    "Você é um tutor de inglês altamente experiente e empático. O seu objetivo é ajudar o aluno a praticar a fala fluida. Analise a gravação de voz enviada pelo aluno, forneça uma análise detalhada da pronúncia de cada palavra individual, identifique quaisquer sotaques ou desvios fonéticos regionais e sugira 3 exercícios personalizados de correção oral imediatos, citando exemplos de palavras semelhantes para ele repetir no microfone."
  );
  const [compressedPrompt, setCompressedPrompt] = useState<string>("");
  const [compressionRatio, setCompressionRatio] = useState<number>(0);
  const [tokensSaved, setTokensSaved] = useState<number>(0);

  // Model Router Simulator
  const [testRequestText, setTestRequestText] = useState<string>("Olá, como posso dizer 'obrigado' em espanhol formal?");
  const [resolvedModel, setResolvedModel] = useState<string>("Gemini 1.5 Flash");
  const [routingReason, setRoutingReason] = useState<string>("Classificado como Query Simples (Tradução/Ajuda Básica). Redirecionado para Flash para menor latência e custo reduzido.");
  const [estimatedCost, setEstimatedCost] = useState<number>(0.00003);

  // Semantic Cache Logs
  const [cacheLogs, setCacheLogs] = useState<string[]>([]);
  const [cacheHits, setCacheHits] = useState<number>(8450);
  const [semanticThreshold, setSemanticThreshold] = useState<number>(0.92);

  const initialCacheLogs = [
    'Semantic Cache Engine online. Indexado no Vector DB Redis.',
    'Verificando similaridade de cosseno com histórico escolar...',
    'Cache HIT para prompt similar a: "como conjugar o verbo ser no passado"',
    'Resposta servida da borda (Edge Cloud Run) em 24ms. Tokens consumidos: 0.'
  ];

  useEffect(() => {
    setCacheLogs(initialCacheLogs.map(l => `[${new Date().toLocaleTimeString()}] ${l}`));
    compressPrompt();
  }, []);

  const compressPrompt = () => {
    // Basic heuristic simulation for prompt compression
    const compressed = originalPrompt
      .replace("Você é um tutor de inglês altamente experiente e empático. O seu objetivo é ajudar o aluno a praticar a fala fluida.", "Tutor inglês empático de fala.")
      .replace("Analise a gravação de voz enviada pelo aluno, forneça uma análise detalhada da pronúncia de cada palavra individual", "Analise pronúncia de cada palavra.")
      .replace("identifique quaisquer sotaques ou desvios fonéticos regionais e sugira 3 exercícios personalizados de correção oral imediatos", "Sugerir 3 correções de desvios fonéticos.")
      .replace("citando exemplos de palavras semelhantes para ele repetir no microfone.", "Exemplos de repetição.");
    
    setCompressedPrompt(compressed);
    const origLen = originalPrompt.length;
    const compLen = compressed.length;
    const ratio = Math.round(((origLen - compLen) / origLen) * 100);
    setCompressionRatio(ratio);
    setTokensSaved(Math.round((origLen - compLen) / 4)); // Rough estimate
  };

  const simulateRouting = () => {
    const text = testRequestText.toLowerCase();
    if (text.includes("analise") || text.includes("avaliação") || text.includes("grade") || text.includes("redação") || text.includes("complexo")) {
      setResolvedModel("Gemini 1.5 Pro");
      setRoutingReason("Classificado como análise profunda/correção complexa de redação ou áudio. Requer alta capacidade cognitiva de raciocínio.");
      setEstimatedCost(0.0025);
    } else if (text.includes("obrigado") || text.includes("olá") || text.includes("tradução") || text.includes("palavra") || text.length < 50) {
      setResolvedModel("Gemini 1.5 Flash (Cached)");
      setRoutingReason("Classificado como Query Curta/Comum ou assistencial. Executado com latência ultra-baixa com cache contextual ativo.");
      setEstimatedCost(0.00002);
    } else {
      setResolvedModel("Gemini 1.5 Flash");
      setRoutingReason("Classificado como conversação livre padrão. Roteado automaticamente para Flash para máxima eficiência financeira.");
      setEstimatedCost(0.00015);
    }
  };

  useEffect(() => {
    simulateRouting();
  }, [testRequestText]);

  const runCacheSync = async () => {
    setCacheLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🔄 Sincronizando embeddings do Redis Vetorial com o BigQuery...`]);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCacheLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ❇️ Expurgados 142 itens obsoletos (TTL expirado).`]);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCacheLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ Cache consolidado. Taxa média de HIT atualizada: 42.4%`]);
    setCacheHits(prev => prev + 120);
  };

  const modelConfigs: ModelConfig[] = [
    { name: 'Gemini 1.5 Flash', id: 'gemini-1.5-flash', costPerMillionInput: 0.075, costPerMillionOutput: 0.30, avgLatencyMs: 310, useCase: 'Diálogos livres, Chat, Traduções e Práticas Rápidas' },
    { name: 'Gemini 1.5 Pro', id: 'gemini-1.5-pro', costPerMillionInput: 1.25, costPerMillionOutput: 5.00, avgLatencyMs: 950, useCase: 'Avaliações detalhadas, Correção de Redações e Análise Pedagógica' },
    { name: 'Lingo-SLM (Local/Edge)', id: 'lingo-slm-0.5b', costPerMillionInput: 0.005, costPerMillionOutput: 0.01, avgLatencyMs: 45, useCase: 'Análise de Vocabulário simples e Correções de Pronúncia rápidas' }
  ];

  const schoolLimits: SchoolLimit[] = [
    { schoolName: 'Escola Secundária de Pinhal Novo', monthlyBudget: 150, spentBudget: 42.50, dailyTokenLimit: 500000, activeStudents: 850, alertThresholdPercent: 80 },
    { schoolName: 'Colégio Internato dos Carvalhos', monthlyBudget: 100, spentBudget: 85.20, dailyTokenLimit: 300000, activeStudents: 420, alertThresholdPercent: 75 },
    { schoolName: 'Agrupamento de Escolas de Portimão', monthlyBudget: 250, spentBudget: 12.40, dailyTokenLimit: 800000, activeStudents: 1240, alertThresholdPercent: 85 },
    { schoolName: 'Escola Alemã de Lisboa', monthlyBudget: 200, spentBudget: 184.10, dailyTokenLimit: 600000, activeStudents: 310, alertThresholdPercent: 90 }
  ];

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6 relative overflow-hidden">
      {/* Background neon highlights */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5 flex-wrap gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl shadow-lg shadow-indigo-900/20">
            <Coins className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">AI Cost Optimization Engine</h2>
            <p className="text-xs text-indigo-400 font-mono font-medium">FinOps, Smart Model Routing, Prompt Compression & Semantic Caching</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
          </span>
          <span className="text-[10px] font-mono font-extrabold text-indigo-400 uppercase tracking-widest bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
            FinOps Active: €184.20/mo Saved
          </span>
        </div>
      </div>

      {/* FinOps KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Custo de IA Acumulado</p>
            <p className="text-base font-mono font-extrabold text-white">€324.20 <span className="text-[10px] text-emerald-400 font-bold font-sans">-41.5%</span></p>
            <p className="text-[10px] text-slate-400">vs. €554.10 projetado s/ otimização</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Semantic Cache Hit Rate</p>
            <p className="text-xl font-extrabold text-white">42.4%</p>
            <p className="text-[10px] text-cyan-400 font-medium">{cacheHits.toLocaleString()} Reqs sem custo</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Prompt Compression Avg</p>
            <p className="text-xl font-extrabold text-white">45.2%</p>
            <p className="text-[10px] text-indigo-400 font-medium">Redução de tokens de entrada</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Model Router Speed</p>
            <p className="text-xl font-extrabold text-white">96.8% Flash</p>
            <p className="text-[10px] text-purple-400 font-medium">Apenas 3.2% escalados para Pro</p>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto relative z-10 scrollbar-none">
        <button 
          onClick={() => setActiveTab('monitor')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'monitor' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Monitorização de Tokens</span>
        </button>
        <button 
          onClick={() => setActiveTab('router')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'router' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Model Routing Inteligente</span>
        </button>
        <button 
          onClick={() => setActiveTab('cache')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'cache' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Cache Semântico</span>
        </button>
        <button 
          onClick={() => setActiveTab('limits')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'limits' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>Limites e Alertas por Escola</span>
        </button>
        <button 
          onClick={() => setActiveTab('docs')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'docs' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>FinOps Docs</span>
        </button>
        <button 
          onClick={() => setActiveTab('tracker')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'tracker' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Token Tracker</span>
        </button>
      </div>

      {/* Tab: Prompt Compression Simulator & Token Monitor */}
      {activeTab === 'monitor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          {/* Prompt compression simulator */}
          <div className="lg:col-span-2 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Simulador de Compressão de Prompt & Resumo de Contexto</h3>
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                Economia de tokens: {compressionRatio}%
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-slate-500 font-extrabold">System Prompt Original (Tutor Pedagógico)</label>
                <textarea 
                  rows={4} 
                  value={originalPrompt} 
                  onChange={(e) => { setOriginalPrompt(e.target.value); }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={compressPrompt}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Otimizar e Comprimir Prompt
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 space-y-2">
                  <p className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">Prompt Otimizado (FinOps Compresso)</p>
                  <p className="text-slate-300 font-mono text-[11px] leading-relaxed italic bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                    "{compressedPrompt}"
                  </p>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">Métricas de Otimização</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                        <span className="text-[9px] text-slate-500 font-bold uppercase block">Caracteres Salvos</span>
                        <span className="text-lg font-black text-white font-mono">{originalPrompt.length - compressedPrompt.length}</span>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                        <span className="text-[9px] text-slate-500 font-bold uppercase block">Est. Tokens Poupados</span>
                        <span className="text-lg font-black text-emerald-400 font-mono">~{tokensSaved}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                    ✓ A otimização foca em remover redundâncias semânticas. O modelo de treino indica que a precisão das avaliações do aluno manteve-se idêntica em 99.4% nos testes A/B.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Prompt cost insights & rules */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-1.5 border-b border-slate-900 pb-3">
                <Gauge className="text-indigo-400 w-4 h-4" />
                <h4 className="text-xs font-bold uppercase text-slate-300">Regras de Resumo de Diálogo</h4>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-850 space-y-1">
                  <p className="font-bold text-white">Algoritmo de Sliding Window</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Apenas os últimos 4 diálogos de áudio são mantidos no contexto original. Conversas anteriores são consolidadas em resumos enxutos de 50 tokens.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-850 space-y-1">
                  <p className="font-bold text-white">Context Caching Gemini</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Prompts de sistema e bases pedagógicas CEFR idênticas com tamanho maior que 32k tokens são automaticamente cacheados no servidor do Google, reduzindo o custo de input em até 90%.
                  </p>
                </div>

                <div className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl">
                  <p className="text-[10px] text-indigo-300 leading-normal font-mono">
                    ✓ Auditoria de Loops: A plataforma monitora o envio contínuo de mensagens pelo mesmo IP em intervalos menores que 1 segundo, travando requisições redundantes de bots de IA.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Model Routing Simulator */}
      {activeTab === 'router' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          {/* Controls & test prompt */}
          <div className="lg:col-span-1 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
            <div className="flex items-center gap-1.5 border-b border-slate-900 pb-3">
              <Sliders className="text-indigo-400 w-4 h-4" />
              <h4 className="text-xs font-bold uppercase text-slate-300">Testar Roteador de Modelos</h4>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-slate-500 font-extrabold">Simular Pergunta do Aluno</label>
                <input 
                  type="text" 
                  value={testRequestText} 
                  onChange={(e) => setTestRequestText(e.target.value)}
                  placeholder="Escreva algo para testar o roteamento..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-850 font-mono text-[10px] space-y-1.5 text-slate-400">
                <p className="text-white font-bold">Dicas de gatilho para o Roteador:</p>
                <p>• Diga "correção" ou "redação complexa" para forçar o <b className="text-indigo-400">Gemini 1.5 Pro</b>.</p>
                <p>• Diga "obrigado" ou perguntas curtas para usar <b className="text-cyan-400">Gemini Flash (Cached)</b>.</p>
              </div>
            </div>
          </div>

          {/* Live Router output */}
          <div className="lg:col-span-2 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-1.5 border-b border-slate-900 pb-3">
              <Cpu className="text-indigo-400 w-4 h-4" />
              <h4 className="text-xs font-bold uppercase text-slate-300">Decisão de Roteamento Dinâmico (LingoLive AI Gateway)</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 flex flex-col justify-between text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Modelo Resolvido</span>
                  <p className="text-sm font-extrabold text-white mt-1 font-mono">{resolvedModel}</p>
                </div>
                <span className="text-[9px] text-emerald-400 font-mono">✓ Latência menor</span>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 flex flex-col justify-between text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Custo Estimado da Query</span>
                  <p className="text-base font-extrabold text-white mt-1 font-mono">${estimatedCost.toFixed(6)}</p>
                </div>
                <span className="text-[9px] text-emerald-400 font-mono">✓ Otimizado</span>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 flex flex-col justify-between text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Decisão de Borda</span>
                  <p className="text-sm font-extrabold text-white mt-1 font-mono">Auto Edge</p>
                </div>
                <span className="text-[9px] text-indigo-400 font-mono">FinOps Configured</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-850 text-xs space-y-1">
              <p className="font-bold text-slate-300">Justificativa do Gateway:</p>
              <p className="text-slate-400 font-mono text-[11px] leading-relaxed">{routingReason}</p>
            </div>

            {/* Model Comparison Matrix */}
            <div className="pt-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Matriz de Custos Disponível no LingoLive Gateway</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-[9px] uppercase tracking-wider font-mono">
                      <th className="py-2 px-1">Modelo de LLM</th>
                      <th className="py-2 px-1">Custo Input/1M</th>
                      <th className="py-2 px-1">Custo Output/1M</th>
                      <th className="py-2 px-1 text-right">Latência Média</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {modelConfigs.map((m, index) => (
                      <tr key={index} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2.5 px-1 font-bold text-white font-mono">{m.name}</td>
                        <td className="py-2.5 px-1 font-mono text-emerald-400">${m.costPerMillionInput.toFixed(3)}</td>
                        <td className="py-2.5 px-1 font-mono text-emerald-400">${m.costPerMillionOutput.toFixed(3)}</td>
                        <td className="py-2.5 px-1 text-right font-mono text-slate-300">{m.avgLatencyMs}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Caching & Semantic Cache sync */}
      {activeTab === 'cache' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-200">Gateway de Cache Semântico (Similaridade de Cosseno)</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Se a similaridade semântica com uma pergunta já respondida for superior ao limite configurado, servimos o cache.</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono font-bold">Similaridade Limiar:</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0.80" 
                    max="0.99" 
                    value={semanticThreshold} 
                    onChange={(e) => setSemanticThreshold(parseFloat(e.target.value))}
                    className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-indigo-400 font-mono w-16 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 space-y-2">
                  <p className="font-bold text-white uppercase text-[10px]">Pergunta Testada:</p>
                  <p className="text-slate-400 italic">"como conjugar o verbo ser no passado"</p>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 space-y-2">
                  <p className="font-bold text-white uppercase text-[10px]">Similaridade de Embeddings calculada:</p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-emerald-400 font-bold">0.96 (Mais de 96% semelhante)</span>
                    <span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900 text-[10px] font-mono font-bold">CACHE HIT</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-850 text-xs">
                <p className="font-bold text-white uppercase text-[10px] mb-1">Como Funciona o Cache Semântico?</p>
                <p className="text-slate-400 leading-normal">
                  Todas as respostas fornecidas pelo Gemini são salvas juntamente com o seu embedding vetorial de 1536 dimensões no banco de dados. Quando uma nova pergunta entra, convertemos a pergunta em vetor e rodamos uma consulta de vizinhos mais próximos no Redis. Se a similaridade bater o limiar de <code className="text-indigo-400">{(semanticThreshold * 100).toFixed(0)}%</code>, devolvemos a resposta cacheada em milissegundos por uma fração quase nula do custo de rede.
                </p>
              </div>
            </div>
          </div>

          {/* Cache Engine log output */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col h-full">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3 justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Console Redis Vector</span>
                </div>
                <button 
                  onClick={runCacheSync}
                  className="text-[10px] text-slate-500 hover:text-white font-mono uppercase border border-slate-850 px-2 py-0.5 rounded cursor-pointer"
                >
                  Sync Index
                </button>
              </div>

              <div className="flex-1 bg-slate-900 p-3 rounded-xl border border-slate-850 font-mono text-[9px] text-slate-300 overflow-y-auto space-y-1.5 h-[200px]">
                {cacheLogs.map((log, index) => (
                  <p key={index} className="leading-relaxed whitespace-pre-wrap">{log}</p>
                ))}
              </div>

              <div className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-xs">
                <p className="font-bold text-white uppercase text-[10px] mb-0.5">SLA de Purga do Cache</p>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Respostas cacheadas expiram automaticamente após 30 dias para garantir que atualizações pedagógicas e melhorias de prompt se reflitam periodicamente para os estudantes.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Budget Alerts & Daily Limits */}
      {activeTab === 'limits' && (
        <div className="space-y-6 relative z-10">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Configuração de Limites Financeiros e Alertas de Teto de Gastos de IA</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Cada escola B2B possui um limite financeiro estrito parametrizado de acordo com o plano de licenças contratado.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[9px] uppercase tracking-wider font-mono">
                    <th className="py-3 px-1">Escola B2B</th>
                    <th className="py-3 px-1">Orçamento Mensal</th>
                    <th className="py-3 px-1">Gasto Atual (Mês)</th>
                    <th className="py-3 px-1">Limite Diário de Tokens</th>
                    <th className="py-3 px-1 text-center">Status do Alerta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {schoolLimits.map((s, index) => {
                    const spendPercent = Math.round((s.spentBudget / s.monthlyBudget) * 100);
                    const overBudget = s.spentBudget > s.monthlyBudget;
                    return (
                      <tr key={index} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-1 font-bold text-white flex items-center gap-2">
                          <Award className="w-4 h-4 text-indigo-400" />
                          {s.schoolName}
                        </td>
                        <td className="py-3 px-1 font-mono text-slate-300">€{s.monthlyBudget.toFixed(2)}</td>
                        <td className="py-3 px-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-bold ${overBudget ? 'text-rose-400' : 'text-emerald-400'}`}>
                              €{s.spentBudget.toFixed(2)}
                            </span>
                            <div className="w-20 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-850">
                              <div className={`h-full ${overBudget ? 'bg-rose-500' : spendPercent > s.alertThresholdPercent ? 'bg-yellow-500 animate-pulse' : 'bg-indigo-500'}`} style={{ width: `${Math.min(spendPercent, 100)}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-500">({spendPercent}%)</span>
                          </div>
                        </td>
                        <td className="py-3 px-1 font-mono text-slate-400">{s.dailyTokenLimit.toLocaleString()} tokens</td>
                        <td className="py-3 px-1 text-center">
                          {overBudget ? (
                            <span className="bg-rose-950 text-rose-400 border border-rose-900 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                              ⚠️ EXCEDIDO (Bloqueio Temporário)
                            </span>
                          ) : spendPercent > s.alertThresholdPercent ? (
                            <span className="bg-yellow-950 text-yellow-400 border border-yellow-900 px-2 py-0.5 rounded text-[10px] font-mono font-bold animate-pulse">
                              ⚠️ ALERTA ({s.alertThresholdPercent}%)
                            </span>
                          ) : (
                            <span className="bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                              ✓ CONTROLADO
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Documentation & FinOps Architectural Rules */}
      {activeTab === 'docs' && (
        <div className="space-y-6 relative z-10">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-indigo-400" />
              Documentação de Arquitetura de FinOps & Otimização de IA
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              O ecossistema LingoLive emprega uma estratégia rigorosa de otimização de infraestrutura baseada nas regras abaixo para mitigar o Custo dos Bens Vendidos (COGS) sem degradar a qualidade pedagógica:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 space-y-2">
                <p className="font-bold text-white font-mono uppercase text-[10px] text-indigo-400">1. Abstração de Gateways</p>
                <p className="text-slate-400 leading-normal">
                  Nenhum serviço interno do LingoLive fala diretamente com o SDK do Google. Todas as requisições passam pelo <code className="text-indigo-400">AIServerGateway</code>, que injeta telemetria, limpa caracteres redundantes do histórico de bate-papo, comprime o prompt e resolve a chamada vetorial ao cache semântico antes de gastar tokens reais do Gemini API.
                </p>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 space-y-2">
                <p className="font-bold text-white font-mono uppercase text-[10px] text-indigo-400">2. Roteamento Inteligente (Model Routing)</p>
                <p className="text-slate-400 leading-normal">
                  Consultas básicas de ajuda pedagógica ou bate-papo informal do estudante são tratadas pelo modelo de alta performance e baixo custo <code className="text-indigo-400">gemini-1.5-flash</code>. Apenas redações detalhadas que exijam validação estrita de gramática avançada e relatórios pedagógicos institucionais trimestrais complexos de professores escalam para o <code className="text-indigo-400">gemini-1.5-pro</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tracker' && (
        <div className="relative z-10">
          <AICostTrackerDashboard />
        </div>
      )}
    </div>
  );
}
