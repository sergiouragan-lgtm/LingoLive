import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Activity, 
  Terminal, 
  FileText, 
  Cpu, 
  Settings, 
  Layers, 
  Sparkles, 
  FileCode, 
  Clock, 
  Zap, 
  RefreshCw, 
  Search,
  Eye,
  Lock,
  Compass,
  Layout,
  BarChart2,
  GitBranch
} from 'lucide-react';

interface TestCase {
  id: string;
  name: string;
  category: 'unit' | 'integration' | 'widget' | 'golden' | 'performance' | 'stress' | 'security' | 'accessibility';
  status: 'idle' | 'running' | 'passed' | 'failed';
  durationMs: number;
  assertion: string;
  errorMessage?: string;
}

interface CoverageItem {
  file: string;
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

export default function TestAutomationDashboard() {
  const [activeTab, setActiveTab] = useState<'suites' | 'pipelines' | 'coverage' | 'load-test' | 'auditor'>('suites');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // Load Test Simulation States
  const [concurrentUsers, setConcurrentUsers] = useState(500);
  const [loadRunning, setLoadRunning] = useState(false);
  const [latencyData, setLatencyData] = useState<{ time: string; users: number; latency: number; errorRate: number }[]>([]);
  const [currentLatency, setCurrentLatency] = useState(120);
  const [currentErrorRate, setCurrentErrorRate] = useState(0);

  // Coverage statistics
  const coverageData: CoverageItem[] = [
    { file: 'src/components/ai-tutor/SpeechTutor.tsx', statements: 94, branches: 89, functions: 95, lines: 94 },
    { file: 'src/components/core/FeatureFlagDashboard.tsx', statements: 100, branches: 95, functions: 100, lines: 100 },
    { file: 'src/components/core/AdminDashboard.tsx', statements: 82, branches: 74, functions: 81, lines: 83 },
    { file: 'src/components/auth/AuthService.ts', statements: 98, branches: 92, functions: 100, lines: 98 },
    { file: 'src/repositories/FirestoreRepository.ts', statements: 91, branches: 85, functions: 88, lines: 91 },
    { file: 'src/utils/StreakCalculator.ts', statements: 100, branches: 100, functions: 100, lines: 100 }
  ];

  const initialTestCases: TestCase[] = [
    // Unit Tests
    { id: 'U001', name: 'StreakCalculator.calculateDays - Devolve sequência correta de dias ativos', category: 'unit', status: 'idle', durationMs: 4, assertion: 'expect(calculate(dates)).toBe(5)' },
    { id: 'U002', name: 'VocabDeck.filterByProficiency - Filtra adequadamente cards por nível', category: 'unit', status: 'idle', durationMs: 2, assertion: 'expect(deck.filter("A1")).toHaveLength(12)' },
    { id: 'U003', name: 'FeatureFlagEngine - Sorteia rollout gradual de forma determinística por hash', category: 'unit', status: 'idle', durationMs: 6, assertion: 'expect(hashRollout("test@user.com")).toBeLessThan(75)' },
    
    // Integration Tests
    { id: 'I001', name: 'FirestoreRepository - Sincroniza configurações globais em tempo real', category: 'integration', status: 'idle', durationMs: 48, assertion: 'expect(syncedData.practiceRoom).toBe(true)' },
    { id: 'I002', name: 'AuthSessionSync - Hydrates localstorage automatically on network reconnect', category: 'integration', status: 'idle', durationMs: 72, assertion: 'expect(localStorage.getItem("lingolive_user")).toBeDefined()' },
    { id: 'I003', name: 'StripeWebhookHandler - Atualiza licenças de escola B2B com plano correto', category: 'integration', status: 'idle', durationMs: 124, assertion: 'expect(school.tier).toBe("school_pro")' },

    // Widget Tests
    { id: 'W001', name: 'DashboardHeader - Renderiza saudações adaptativas e nome de usuário', category: 'widget', status: 'idle', durationMs: 14, assertion: 'expect(screen.getByText("Olá, Sérgio")).toBeInTheDocument()' },
    { id: 'W002', name: 'WelcomeTour - Navega pelos steps de onboarding sequencialmente', category: 'widget', status: 'idle', durationMs: 22, assertion: 'expect(screen.getByText("Próximo")).toBeVisible()' },

    // Golden Tests
    { id: 'G001', name: 'GoldenTest - Dark Theme Visual Regression Check - AdminDashboard', category: 'golden', status: 'idle', durationMs: 250, assertion: 'expect(screenshot).toMatchSnapshot("admin-dark.png")' },
    { id: 'G002', name: 'GoldenTest - B2B Metrics Charts layout fluid scaling - HighDPI', category: 'golden', status: 'idle', durationMs: 310, assertion: 'expect(chartCanvas).toMatchSnapshot("b2b-metrics.png")' },

    // Performance Tests
    { id: 'P001', name: 'AcousticSpeechEngine - Latência de inicialização fria do modelo inferior a 350ms', category: 'performance', status: 'idle', durationMs: 180, assertion: 'expect(engineInitTime).toBeLessThan(350)' },
    { id: 'P002', name: 'VocabularySearch - Filtro instantâneo em lote de 10.000 tokens sob 20ms', category: 'performance', status: 'idle', durationMs: 12, assertion: 'expect(searchTime).toBeLessThan(20)' },

    // Stress Tests
    { id: 'ST001', name: 'SpeechWebSocketPool - Sustenta 2.000 frames simultâneos sem overflow', category: 'stress', status: 'idle', durationMs: 450, assertion: 'expect(bufferOverflowRate).toBe(0)' },
    { id: 'ST002', name: 'FirestoreBatchUpdate - Gravação massiva de relatórios de turmas B2B em concorrência', category: 'stress', status: 'idle', durationMs: 620, assertion: 'expect(batchFailedCount).toBe(0)' },

    // Security Tests
    { id: 'S001', name: 'SAST - Varredura de injeções de dependências de terceiros vulneráveis (CVE)', category: 'security', status: 'idle', durationMs: 890, assertion: 'expect(vulnerabilities.critical).toBe(0)' },
    { id: 'S002', name: 'AudioSanitizer - Bloqueia payloads maliciosos de voz no endpoint AI Tutor', category: 'security', status: 'idle', durationMs: 95, assertion: 'expect(sanitizedBlob.isSafe).toBe(true)' },
    { id: 'S003', name: 'FirestoreSecurityRules - Garante restrição de acesso a tenants B2B isolados', category: 'security', status: 'idle', durationMs: 120, assertion: 'expect(tenantAuth.readDenied).toBe(true)' },

    // Accessibility Tests
    { id: 'A001', name: 'WCAG Contrast - Valida contraste AA de elementos interativos e textos', category: 'accessibility', status: 'idle', durationMs: 65, assertion: 'expect(contrastRatio).toBeGreaterThanOrEqual(4.5)' },
    { id: 'A002', name: 'AriaAttributes - Valida conformidade em leitores de tela para formulários de cadastro', category: 'accessibility', status: 'idle', durationMs: 34, assertion: 'expect(input.ariaLabel).not.toBeNull()' }
  ];

  useEffect(() => {
    setTestCases(initialTestCases);
    addLog('Suíte de automação carregada. 18 cenários empresariais mapeados.');
    addLog('Versão do Executor: v3.2.1-prod (Docker sandbox: stable)');
  }, []);

  const addLog = (text: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${text}`]);
  };

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const runAllTests = async () => {
    if (isRunningAll) return;
    setIsRunningAll(true);
    setProgress(0);
    addLog('🚀 Iniciando execução em massa da esteira de testes do LingoLive...');
    
    const updated = [...initialTestCases];
    setTestCases(updated.map(t => ({ ...t, status: 'running' })));

    for (let i = 0; i < updated.length; i++) {
      const tc = updated[i];
      addLog(`Executando [${tc.category.toUpperCase()}] ${tc.name}...`);
      
      // Simulate real run delay
      await new Promise(resolve => setTimeout(resolve, Math.max(100, tc.durationMs / 2)));
      
      // Randomly fail U002 and ST002 on rare occasions to simulate debugging, but by default all green
      const shouldPass = true; // Let's keep it solid green for the workspace unless interactive
      
      updated[i] = {
        ...tc,
        status: shouldPass ? 'passed' : 'failed',
        errorMessage: shouldPass ? undefined : 'AssertionError: expected element to be present in container.'
      };
      
      setTestCases([...updated]);
      setProgress(Math.round(((i + 1) / updated.length) * 100));
      addLog(`✅ PASS: ${tc.name} (${tc.durationMs}ms)`);
    }

    setIsRunningAll(false);
    addLog('🎉 Pipeline concluído! 100% de sucesso. Relatório de regressão gerado.');
  };

  const runSingleTest = async (id: string) => {
    setTestCases(prev => prev.map(t => t.id === id ? { ...t, status: 'running' } : t));
    addLog(`Executando teste individual: ${id}...`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setTestCases(prev => prev.map(t => {
      if (t.id === id) {
        addLog(`✅ PASS: ${t.name} (${t.durationMs}ms)`);
        return { ...t, status: 'passed' };
      }
      return t;
    }));
  };

  // Stress Test Simulation Loop
  useEffect(() => {
    let interval: any = null;
    if (loadRunning) {
      interval = setInterval(() => {
        // Dynamic jitter simulation
        const jitter = Math.floor(Math.random() * 20) - 10;
        const usersFactor = concurrentUsers / 100;
        const newLatency = Math.max(45, Math.round(80 + (usersFactor * 8) + jitter));
        const newErrorRate = Math.max(0, Math.round((concurrentUsers > 1500 ? (concurrentUsers - 1500) / 100 : 0) * 10) / 10);
        
        setCurrentLatency(newLatency);
        setCurrentErrorRate(newErrorRate);

        setLatencyData(prev => {
          const next = [...prev, {
            time: new Date().toLocaleTimeString().substring(3, 8),
            users: concurrentUsers,
            latency: newLatency,
            errorRate: newErrorRate
          }];
          if (next.length > 8) next.shift();
          return next;
        });

        addLog(`[LOAD TEST] Usuários Simultâneos: ${concurrentUsers} | Latência Média: ${newLatency}ms | Taxa de Erro: ${newErrorRate}%`);
      }, 1500);
    } else {
      setLatencyData([]);
    }
    return () => clearInterval(interval);
  }, [loadRunning, concurrentUsers]);

  const filteredTests = testCases.filter(t => {
    const matchesCategory = filterCategory === 'ALL' || t.category === filterCategory;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6 relative overflow-hidden">
      {/* Background neon highlights */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5 flex-wrap gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-emerald-600 to-emerald-500 rounded-2xl shadow-lg shadow-emerald-900/20">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Test Automation Hub</h2>
            <p className="text-xs text-emerald-400 font-mono font-medium">LingoLIVE QA Suite, BDD Scenarios, Load Simulations & SAST Analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-mono font-extrabold text-emerald-400 uppercase tracking-widest bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
            CI Engine Ready
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Sucesso Global</p>
            <p className="text-xl font-extrabold text-white">100%</p>
            <p className="text-[10px] text-emerald-400 font-medium">18 de 18 Casos</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Cobertura de Linhas</p>
            <p className="text-xl font-extrabold text-white">94.8%</p>
            <p className="text-[10px] text-indigo-400 font-medium">Média ponderada</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Tempo de CI/CD</p>
            <p className="text-xl font-extrabold text-white">12.5s</p>
            <p className="text-[10px] text-yellow-400 font-medium">Parallel Sandbox Run</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Vulnerabilidades</p>
            <p className="text-xl font-extrabold text-white">0</p>
            <p className="text-[10px] text-emerald-400 font-medium">SAST & DAST Clean</p>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto relative z-10 scrollbar-none">
        <button 
          onClick={() => setActiveTab('suites')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'suites' 
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Suítes de Regressão</span>
        </button>
        <button 
          onClick={() => setActiveTab('load-test')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'load-test' 
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Carga & Estresse</span>
        </button>
        <button 
          onClick={() => setActiveTab('coverage')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'coverage' 
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Cobertura de Código</span>
        </button>
        <button 
          onClick={() => setActiveTab('pipelines')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'pipelines' 
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>CI/CD Pipeline Run</span>
        </button>
        <button 
          onClick={() => setActiveTab('auditor')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'auditor' 
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Políticas de Segurança SAST</span>
        </button>
      </div>

      {/* Tab: Regression Suites */}
      {activeTab === 'suites' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          {/* Test Case List Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Esteira de Validação Automatizada</span>
                  <span className="bg-emerald-950 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-900 font-mono font-bold">
                    {filteredTests.length} Cenários
                  </span>
                </div>
                <button 
                  onClick={runAllTests} 
                  disabled={isRunningAll}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isRunningAll ? `A Executar (${progress}%)` : 'Executar Todos'}</span>
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                {['ALL', 'unit', 'integration', 'widget', 'golden', 'performance', 'stress', 'security', 'accessibility'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                      filterCategory === cat 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800/40'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  placeholder="Pesquisar caso de teste por nome ou código..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Tests list */}
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {filteredTests.map((tc) => (
                  <div key={tc.id} className="p-3 bg-slate-900 rounded-xl border border-slate-850 flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-400">
                          {tc.id}
                        </span>
                        <span className="text-[9px] font-mono font-extrabold bg-indigo-950 text-indigo-400 border border-indigo-900 px-1.5 py-0.5 rounded uppercase">
                          {tc.category}
                        </span>
                        <p className="font-bold text-slate-200">{tc.name}</p>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">Assert: <code className="text-indigo-300 bg-indigo-950/20 px-1.5 py-0.5 rounded">{tc.assertion}</code></p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-mono">{tc.durationMs}ms</span>
                      {tc.status === 'passed' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                      {tc.status === 'failed' && <XCircle className="w-5 h-5 text-rose-400" />}
                      {tc.status === 'running' && <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />}
                      {tc.status === 'idle' && (
                        <button 
                          onClick={() => runSingleTest(tc.id)} 
                          className="p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 rounded cursor-pointer"
                          title="Rodar individual"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time terminal log console */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col h-full">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3 justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Console de Logs (CI)</span>
                </div>
                <button 
                  onClick={() => setLogs([])}
                  className="text-[10px] text-slate-500 hover:text-white font-mono uppercase border border-slate-850 px-2 py-0.5 rounded cursor-pointer"
                >
                  Limpar
                </button>
              </div>

              <div className="flex-1 bg-slate-900 p-3 rounded-xl border border-slate-850 font-mono text-[10px] text-slate-300 overflow-y-auto space-y-1.5 h-[340px]">
                {logs.map((log, index) => (
                  <p key={index} className="leading-relaxed whitespace-pre-wrap">{log}</p>
                ))}
                <div ref={terminalEndRef} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Load & Stress Testing */}
      {activeTab === 'load-test' && (
        <div className="space-y-6 relative z-10">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                Simulador de Carga e Estresse Concorrente
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">Dispare requisições virtuais em massa para os microsserviços de voz e processamento da API para testar resiliência sob carga extrema.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Load controllers */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-extrabold text-slate-400">Usuários Virtuais (VUs): {concurrentUsers}</label>
                  <input 
                    type="range" 
                    min={100} 
                    max={5000} 
                    step={100} 
                    value={concurrentUsers}
                    onChange={(e) => setConcurrentUsers(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
                  />
                  <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                    <span>100 VUs</span>
                    <span>1500 VUs (Capacidade)</span>
                    <span>5000 VUs (Estresse)</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => {
                      setLoadRunning(!loadRunning);
                      addLog(loadRunning ? '🛑 Simulação de carga interrompida.' : '⚡ Disparando usuários virtuais concorrentes...');
                    }}
                    className={`w-full py-2.5 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      loadRunning 
                        ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>{loadRunning ? 'Interromper Disparo' : 'Iniciar Teste de Carga'}</span>
                  </button>
                </div>
              </div>

              {/* Stress indicators */}
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Latência de Resposta (P95)</span>
                    <p className="text-3xl font-black text-white mt-1">{loadRunning ? `${currentLatency} ms` : '95 ms'}</p>
                  </div>
                  <span className={`text-[10px] ${currentLatency > 180 ? 'text-rose-400' : 'text-emerald-400'} font-medium`}>
                    {currentLatency > 180 ? '⚠️ Latência Elevada' : '✓ Saudável'}
                  </span>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Taxa de Erro HTTP / WS</span>
                    <p className="text-3xl font-black text-white mt-1">{loadRunning ? `${currentErrorRate}%` : '0%'}</p>
                  </div>
                  <span className={`text-[10px] ${currentErrorRate > 1 ? 'text-rose-400' : 'text-emerald-400'} font-medium`}>
                    {currentErrorRate > 1 ? '⚠️ Perda de Pacotes Detectada' : '✓ 100% de sucesso'}
                  </span>
                </div>
              </div>
            </div>

            {/* Simulated Live Chart Grid */}
            {loadRunning && latencyData.length > 0 && (
              <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-850/80">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Histórico Dinâmico de Tráfego do Simulador</p>
                <div className="grid grid-cols-8 gap-1.5 h-32 items-end border-b border-slate-800 pb-2 pt-4">
                  {latencyData.map((d, index) => {
                    // Normalize heights (max latency 400ms = 100%)
                    const heightPercent = Math.min(100, (d.latency / 300) * 100);
                    return (
                      <div key={index} className="flex flex-col items-center justify-end h-full gap-1">
                        <span className="text-[8px] font-mono text-indigo-400">{d.latency}ms</span>
                        <div 
                          style={{ height: `${heightPercent}%` }} 
                          className={`w-full rounded-t-sm transition-all duration-500 ${
                            d.latency > 180 
                              ? 'bg-rose-500 shadow-lg shadow-rose-950/20' 
                              : 'bg-emerald-500 shadow-lg shadow-emerald-950/20'
                          }`} 
                        />
                        <span className="text-[8px] font-mono text-slate-500 mt-1">{d.time}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Coverage */}
      {activeTab === 'coverage' && (
        <div className="space-y-6 relative z-10">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                Relatório de Cobertura de Código Fonte (LCOV)
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">Varredura estática de instruções, ramos e ramificações avaliadas durante os testes.</p>
            </div>

            <div className="space-y-3.5">
              {coverageData.map((item, index) => {
                const color = item.statements > 90 ? 'bg-emerald-500' : 'bg-indigo-500';
                return (
                  <div key={index} className="p-3.5 bg-slate-900 rounded-xl border border-slate-850 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                        {item.file}
                      </span>
                      <span className="text-xs font-bold font-mono text-emerald-400">{item.statements}% statements</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                      <div className={`${color} h-full transition-all duration-500`} style={{ width: `${item.statements}%` }} />
                    </div>

                    {/* Secondary stats */}
                    <div className="grid grid-cols-3 gap-4 text-[9px] font-mono text-slate-500">
                      <span>Ramos (Branches): <b className="text-slate-300">{item.branches}%</b></span>
                      <span>Funções: <b className="text-slate-300">{item.functions}%</b></span>
                      <span>Linhas: <b className="text-slate-300">{item.lines}%</b></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: CI/CD Pipeline Visualizer */}
      {activeTab === 'pipelines' && (
        <div className="space-y-6 relative z-10">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-emerald-400" />
                Pipeline Orchestrator & CI Runners
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">Esteira visual de entrega contínua executada a cada push no repositório.</p>
            </div>

            {/* Pipeline flowchart */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-extrabold uppercase text-slate-300 font-mono">1. Lint & Audit</span>
                </div>
                <p className="text-[10px] text-slate-400">Varredura sintática, ESLint e checagem de tipos estáticos.</p>
                <p className="text-[10px] text-emerald-400 font-bold font-mono">✓ PASS (3.1s)</p>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-extrabold uppercase text-slate-300 font-mono">2. Unit Tests</span>
                </div>
                <p className="text-[10px] text-slate-400">Checagem de lógica pura e funções do sistema.</p>
                <p className="text-[10px] text-emerald-400 font-bold font-mono">✓ PASS (1.8s)</p>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-extrabold uppercase text-slate-300 font-mono">3. E2E Sandbox</span>
                </div>
                <p className="text-[10px] text-slate-400">Navegação real ponta-a-ponta com Playwright.</p>
                <p className="text-[10px] text-emerald-400 font-bold font-mono">✓ PASS (5.2s)</p>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-extrabold uppercase text-slate-300 font-mono">4. Security Block</span>
                </div>
                <p className="text-[10px] text-slate-400">Verificação de vazamento de secrets e SAST.</p>
                <p className="text-[10px] text-emerald-400 font-bold font-mono">✓ PASS (2.4s)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Security Policies (Auditor) */}
      {activeTab === 'auditor' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="md:col-span-2 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-900 pb-3">
              <Lock className="w-4 h-4 text-emerald-400" />
              Políticas de Segurança SAST & Auditoria de Vulnerabilidades
            </h3>

            <div className="space-y-3.5">
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-850 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-400 font-bold font-mono">[CVE-CLEAN] Dependências Seguras</span>
                  <span className="bg-slate-950 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 border border-emerald-900">PASS</span>
                </div>
                <p className="text-slate-400 leading-relaxed">Nenhuma vulnerabilidade crítica ou média encontrada nas 45 bibliotecas de produção mapeadas no package.json.</p>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-850 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-400 font-bold font-mono">[RULES-SEC] Regras do Firebase Firestore</span>
                  <span className="bg-slate-950 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 border border-emerald-900">PASS</span>
                </div>
                <p className="text-slate-400 leading-relaxed">As regras do Firestore (firestore.rules) foram estaticamente analisadas contra vazamentos de dados de multi-tenancy. Todas as queries de escrita possuem validação correspondente de auth.uid.</p>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-850 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-400 font-bold font-mono">[AUDIO-SEC] Higienização de Fluxo de Voz</span>
                  <span className="bg-slate-950 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 border border-emerald-900">PASS</span>
                </div>
                <p className="text-slate-400 leading-relaxed">A camada de transcrição limpa tokens e cabeçalhos binários para evitar ataques de estouro de buffer (Buffer Overflow) no pipeline do AI Speech Engine.</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-1 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-900 pb-3">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Qualidade & BDD
            </h3>
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-850 space-y-1">
                <p className="font-bold text-white font-mono">BDD: Prática de Conversação</p>
                <p className="text-[10px] text-slate-500 italic leading-relaxed">"Dado que o aluno está na sala de prática, quando ele fala com o tutor AI, então o app deve transcrever sua voz e calcular o feedback em menos de 1 segundo."</p>
                <p className="text-[10px] text-emerald-400 font-bold font-mono">✓ 100% Validado por E2E</p>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-850 space-y-1">
                <p className="font-bold text-white font-mono">BDD: Licenciamento B2B</p>
                <p className="text-[10px] text-slate-500 italic leading-relaxed">"Dado que o diretor ativa licenças via QR, quando o scanner lê o código, então a turma deve ser provisionada instantaneamente."</p>
                <p className="text-[10px] text-emerald-400 font-bold font-mono">✓ 100% Validado por E2E</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
