import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  GitBranch, 
  ToggleLeft, 
  ToggleRight, 
  Target, 
  Globe, 
  Sparkles, 
  ShieldAlert, 
  Activity, 
  RefreshCw, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Check, 
  UserCheck, 
  X, 
  FileText, 
  AlertTriangle,
  Flame,
  Gauge
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc, getDocs, limit, query, orderBy, doc, setDoc } from 'firebase/firestore';

interface FlagRule {
  id: string;
  name: string; // e.g. practiceRoom, vocabDeck
  label: string;
  enabled: boolean;
  rolloutPercentage: number; // 0 to 100
  betaEmails: string[];
  targetCountries: string[]; // e.g. PT, BR, ES, ALL
  subscriptionTiers: string[]; // e.g. school_basic, school_pro, free, ALL
  canaryEnabled: boolean;
  abTesting: {
    enabled: boolean;
    variants: { name: string; weight: number; impressions: number; conversions: number }[];
  };
}

export function FeatureFlagDashboard() {
  const [activeTab, setActiveTab] = useState<'flags' | 'experiments' | 'auditor' | 'simulator'>('flags');
  const [flags, setFlags] = useState<FlagRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FlagRule | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Simulated stats
  const [stats, setStats] = useState({
    activeFlagsCount: 5,
    experimentsActive: 2,
    avgLatencyMs: 1.8,
    canaryCount: 1
  });

  // Simulator test profile state
  const [simUserEmail, setSimUserEmail] = useState('aluno.premium@escola.pt');
  const [simCountry, setSimCountry] = useState('PT');
  const [simSubscription, setSimSubscription] = useState('school_pro');
  const [simCohort, setSimCohort] = useState('Variant B');
  const [simResults, setSimResults] = useState<{ name: string; label: string; active: boolean; reason: string }[]>([]);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<{ timestamp: string; action: string; operator: string; details: string; staleAgeDays?: number }[]>([]);

  // Default flags schema for simulation
  const defaultFlags: FlagRule[] = [
    {
      id: 'practiceRoom',
      name: 'practiceRoom',
      label: 'Sala de Prática de Fala (AI Tutor)',
      enabled: true,
      rolloutPercentage: 75,
      betaEmails: ['beta.teacher@lingolive.ai', 'diretor@escola.pt'],
      targetCountries: ['PT', 'BR'],
      subscriptionTiers: ['school_pro'],
      canaryEnabled: true,
      abTesting: {
        enabled: true,
        variants: [
          { name: 'Variant A (Standard AI)', weight: 50, impressions: 1420, conversions: 320 },
          { name: 'Variant B (Conversational Mode)', weight: 50, impressions: 1445, conversions: 495 }
        ]
      }
    },
    {
      id: 'languageQuiz',
      name: 'languageQuiz',
      label: 'Quizzes de Idiomas Adaptativos',
      enabled: true,
      rolloutPercentage: 100,
      betaEmails: [],
      targetCountries: ['ALL'],
      subscriptionTiers: ['ALL'],
      canaryEnabled: false,
      abTesting: {
        enabled: false,
        variants: []
      }
    },
    {
      id: 'liveChat',
      name: 'liveChat',
      label: 'Live Chat (Comunicação em Tempo Real)',
      enabled: false,
      rolloutPercentage: 0,
      betaEmails: ['admin@lingolive.ai', 'tester@lingolive.ai'],
      targetCountries: ['PT'],
      subscriptionTiers: ['school_pro'],
      canaryEnabled: true,
      abTesting: {
        enabled: false,
        variants: []
      }
    },
    {
      id: 'vocabDeck',
      name: 'vocabDeck',
      label: 'Vocab Deck de Palavras Inteligente',
      enabled: true,
      rolloutPercentage: 50,
      betaEmails: ['sergio.uragan@gmail.com'],
      targetCountries: ['ALL'],
      subscriptionTiers: ['school_basic', 'school_pro'],
      canaryEnabled: false,
      abTesting: {
        enabled: true,
        variants: [
          { name: 'Variant A (No Images)', weight: 50, impressions: 980, conversions: 120 },
          { name: 'Variant B (Flashcard Illustrations)', weight: 50, impressions: 994, conversions: 215 }
        ]
      }
    },
    {
      id: 'educatorDashboard',
      name: 'educatorDashboard',
      label: 'Painel do Professor (Analytics Avançado)',
      enabled: true,
      rolloutPercentage: 100,
      betaEmails: [],
      targetCountries: ['PT', 'BR', 'ES'],
      subscriptionTiers: ['school_pro'],
      canaryEnabled: false,
      abTesting: {
        enabled: false,
        variants: []
      }
    }
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      // Load rules from Settings collection if they exist, else create defaults
      const snap = await getDocs(collection(db, 'feature_flag_rules'));
      let rulesList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FlagRule));
      
      if (rulesList.length === 0) {
        for (const f of defaultFlags) {
          await setDoc(doc(db, 'feature_flag_rules', f.id), f);
        }
        rulesList = defaultFlags;
      }
      setFlags(rulesList);

      // Audit logs
      const auditSnap = await getDocs(query(collection(db, 'feature_flag_audits'), orderBy('timestamp', 'desc'), limit(15)));
      const logs = auditSnap.docs.map(doc => doc.data() as any);
      
      if (logs.length === 0) {
        const initialLogs = [
          { timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), action: 'FLAG_UPDATE', operator: 'admin@lingolive.ai', details: 'Alterou o rollout gradual da flag [practiceRoom] para 75%', staleAgeDays: 14 },
          { timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), action: 'AB_TEST_INIT', operator: 'pm@lingolive.ai', details: 'Iniciou teste A/B no modulo [vocabDeck] com foco em ilustrações', staleAgeDays: 45 },
          { timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(), action: 'FLAG_ROLLBACK', operator: 'system@lingolive.ai', details: 'Kill Switch acionado para a flag [liveChat] devido a pico de CPU na API', staleAgeDays: 8 }
        ];
        for (const l of initialLogs) {
          await addDoc(collection(db, 'feature_flag_audits'), l);
        }
        setAuditLogs(initialLogs);
      } else {
        setAuditLogs(logs);
      }
    } catch (err) {
      console.error('Error loading feature flags:', err);
      setFlags(defaultFlags);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync to standard settings/features for backward compatibility
  const syncToGlobalSettings = async (updatedFlags: FlagRule[]) => {
    try {
      const globalFeaturesObj: Record<string, boolean> = {};
      updatedFlags.forEach(f => {
        globalFeaturesObj[f.name] = f.enabled;
      });
      // Set to Firestore settings/features
      await setDoc(doc(db, 'settings', 'features'), globalFeaturesObj);
      // Sync localstorage
      localStorage.setItem('lingolive_features', JSON.stringify(globalFeaturesObj));
    } catch (err) {
      console.error('Failed to sync features globally:', err);
    }
  };

  const handleToggleFlag = async (id: string) => {
    const target = flags.find(f => f.id === id);
    if (!target) return;
    
    const nextVal = !target.enabled;
    const updated = flags.map(f => f.id === id ? { ...f, enabled: nextVal } : f);
    setFlags(updated);

    try {
      await setDoc(doc(db, 'feature_flag_rules', id), { ...target, enabled: nextVal });
      
      // Add Audit log
      const log = {
        timestamp: new Date().toISOString(),
        action: nextVal ? 'FLAG_ENABLE' : 'FLAG_KILL_SWITCH',
        operator: 'admin@lingolive.ai',
        details: `Sinalizador [${id}] foi ${nextVal ? 'ativado globalmente' : 'desativado em emergência (Kill Switch)'}.`
      };
      await addDoc(collection(db, 'feature_flag_audits'), log);
      
      await syncToGlobalSettings(updated);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveFlagDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlag) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'feature_flag_rules', editingFlag.id), editingFlag);
      
      // Audit log
      const log = {
        timestamp: new Date().toISOString(),
        action: 'FLAG_CONFIG_UPDATE',
        operator: 'admin@lingolive.ai',
        details: `Configuração atualizada para o sinalizador [${editingFlag.id}]. Rollout: ${editingFlag.rolloutPercentage}%.`
      };
      await addDoc(collection(db, 'feature_flag_audits'), log);
      
      const updated = flags.map(f => f.id === editingFlag.id ? editingFlag : f);
      await syncToGlobalSettings(updated);
      setEditingFlag(null);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Run Real-time Simulation evaluation engine (local Client-Side evaluation)
  const evaluateSimulation = () => {
    const list = flags.map(f => {
      let active = f.enabled;
      let reason = 'Ativado globalmente (100% Rollout)';

      if (!f.enabled) {
        // If flag is disabled, check if user is beta tester
        const isBeta = f.betaEmails.some(email => simUserEmail.toLowerCase() === email.toLowerCase());
        if (isBeta) {
          active = true;
          reason = 'Ativo via Whitelist de Testador Beta';
        } else {
          active = false;
          reason = 'Sinalizador está desabilitado globalmente (Inativo)';
        }
      } else {
        // If flag is enabled, perform granular checks
        // 1. Target country rules
        if (f.targetCountries.length > 0 && !f.targetCountries.includes('ALL')) {
          if (!f.targetCountries.includes(simCountry)) {
            active = false;
            reason = `Bloqueado por Regra de País: Alvo restrito a [${f.targetCountries.join(', ')}]`;
          }
        }

        // 2. Subscription plans rules
        if (active && f.subscriptionTiers.length > 0 && !f.subscriptionTiers.includes('ALL')) {
          if (!f.subscriptionTiers.includes(simSubscription)) {
            active = false;
            reason = `Bloqueado por Regra de Assinatura: Requer plano [${f.subscriptionTiers.join(', ')}]`;
          }
        }

        // 3. Rollout percentage check
        if (active && f.rolloutPercentage < 100) {
          // Stable hashing based on user email to decide rollout assignment
          let hash = 0;
          for (let i = 0; i < simUserEmail.length; i++) {
            hash = simUserEmail.charCodeAt(i) + ((hash << 5) - hash);
          }
          const userValue = Math.abs(hash) % 100;
          if (userValue > f.rolloutPercentage) {
            // Check if beta tester bypasses rollout
            const isBeta = f.betaEmails.some(email => simUserEmail.toLowerCase() === email.toLowerCase());
            if (isBeta) {
              active = true;
              reason = `Ativo via Whitelist Beta (${f.rolloutPercentage}% rollout ignorado)`;
            } else {
              active = false;
              reason = `Roteador Gradual: Fora da coorte sorteada (Sorteado: ${userValue}%, Alvo: < ${f.rolloutPercentage}%)`;
            }
          } else {
            reason = `Ativo no Rollout Gradual (${f.rolloutPercentage}% ativo, Usuário caiu no bucket dos ${userValue}%)`;
          }
        }
      }

      return {
        name: f.name,
        label: f.label,
        active,
        reason
      };
    });
    setSimResults(list);
  };

  useEffect(() => {
    if (flags.length > 0) {
      evaluateSimulation();
    }
  }, [flags, simUserEmail, simCountry, simSubscription]);

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6 relative overflow-hidden">
      {/* Background neon highlights */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5 flex-wrap gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl shadow-lg shadow-indigo-900/20">
            <Sliders className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Feature Flag Core</h2>
            <p className="text-xs text-indigo-400 font-mono font-medium">LingoLIVE Canaries, A/B Experiments & Remote Configurations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <span className="text-[10px] font-mono font-extrabold text-cyan-400 uppercase tracking-widest bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
            Edge Engine On
          </span>
        </div>
      </div>

      {/* Top Cards Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <ToggleRight className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Sinalizadores Ativos</p>
            <p className="text-xl font-extrabold text-white">{flags.filter(f => f.enabled).length} / {flags.length}</p>
            <p className="text-[10px] text-emerald-400 font-medium">Propagação Instantânea</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Experiências A/B</p>
            <p className="text-xl font-extrabold text-white">{flags.filter(f => f.abTesting.enabled).length} Ativos</p>
            <p className="text-[10px] text-cyan-400 font-medium">Tracking de Conversão</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Latência de Avaliação</p>
            <p className="text-xl font-extrabold text-white">{stats.avgLatencyMs} ms</p>
            <p className="text-[10px] text-purple-400 font-medium">In-memory Cache (Edge)</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Canary Deployments</p>
            <p className="text-xl font-extrabold text-white">{flags.filter(f => f.canaryEnabled).length} Ativos</p>
            <p className="text-[10px] text-rose-400 font-medium">Isolamento Gradual</p>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto relative z-10 scrollbar-none">
        <button 
          onClick={() => { setActiveTab('flags'); setEditingFlag(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'flags' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Sinalizadores e Regras</span>
        </button>
        <button 
          onClick={() => { setActiveTab('experiments'); setEditingFlag(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'experiments' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Experiências A/B</span>
        </button>
        <button 
          onClick={() => { setActiveTab('simulator'); setEditingFlag(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'simulator' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Remote Config Simulator</span>
        </button>
        <button 
          onClick={() => { setActiveTab('auditor'); setEditingFlag(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'auditor' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Rastreio de Débito Técnico</span>
        </button>
      </div>

      {/* Tab: Flags List & Form Editor */}
      {activeTab === 'flags' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          {/* Flags List Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Feature Toggle Registry</h3>
                <button onClick={loadData} className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {loading ? (
                <p className="text-center py-10 font-mono text-xs text-slate-500">A avaliar sinalizadores...</p>
              ) : (
                <div className="space-y-4">
                  {flags.map((f) => (
                    <div key={f.id} className="p-4 bg-slate-900 rounded-xl border border-slate-800/80 flex flex-col justify-between gap-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold text-white font-mono">{f.label}</p>
                          <p className="text-[10px] text-slate-500 font-mono">Chave: {f.name}</p>
                        </div>

                        {/* Switch */}
                        <button 
                          onClick={() => handleToggleFlag(f.id)}
                          className="p-1 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
                          title={f.enabled ? 'Emergency Kill Switch' : 'Ativar flag'}
                        >
                          {f.enabled ? (
                            <ToggleRight className="w-8 h-8 text-indigo-400" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-slate-500" />
                          )}
                        </button>
                      </div>

                      {/* Flag attributes summary */}
                      <div className="flex items-center gap-3 flex-wrap border-t border-slate-800/60 pt-2.5 text-[9px] font-mono text-slate-400">
                        <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          Rollout: <b>{f.rolloutPercentage}%</b>
                        </span>
                        <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                          <Globe className="w-3 h-3 text-cyan-400" />
                          Países: <b>{f.targetCountries.join(', ')}</b>
                        </span>
                        <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          Tiers: <b>{f.subscriptionTiers.join(', ')}</b>
                        </span>
                        {f.betaEmails.length > 0 && (
                          <span className="bg-purple-950/40 text-purple-300 px-2 py-0.5 rounded border border-purple-900/40">
                            Betas: <b>{f.betaEmails.length}</b>
                          </span>
                        )}
                        {f.canaryEnabled && (
                          <span className="bg-rose-950/40 text-rose-300 px-2 py-0.5 rounded border border-rose-900/40">
                            Canary
                          </span>
                        )}
                      </div>

                      <div className="flex justify-end pt-1">
                        <button 
                          onClick={() => setEditingFlag(f)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold uppercase cursor-pointer"
                        >
                          Editar Regras de Alvo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Edit Flag Column */}
          <div className="lg:col-span-1">
            {editingFlag ? (
              <form onSubmit={handleSaveFlagDetails} className="bg-slate-950 p-5 rounded-2xl border border-indigo-900/60 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Editar Regras: {editingFlag.id}</h4>
                  <button type="button" onClick={() => setEditingFlag(null)} className="text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Rollout Percentage slider */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-extrabold text-slate-400">Rollout Gradual ({editingFlag.rolloutPercentage}%)</label>
                  <input 
                    type="range" 
                    min={0} 
                    max={100} 
                    step={10} 
                    value={editingFlag.rolloutPercentage}
                    onChange={(e) => setEditingFlag({ ...editingFlag, rolloutPercentage: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                  />
                  <p className="text-[9px] text-slate-500">Mapeamento dinâmico e consistente de coortes via hash determinístico.</p>
                </div>

                {/* Countries targets */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-extrabold text-slate-400">Países Alvo (Separados por vírgula)</label>
                  <input 
                    type="text" 
                    value={editingFlag.targetCountries.join(', ')}
                    onChange={(e) => setEditingFlag({ ...editingFlag, targetCountries: e.target.value.split(',').map(s => s.trim().toUpperCase()) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono py-1.5 px-3 text-slate-200 focus:outline-none focus:border-indigo-500" 
                  />
                  <p className="text-[9px] text-slate-500">Ex: PT, BR, ES ou ALL para todos.</p>
                </div>

                {/* Subscription targets */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-extrabold text-slate-400">Plano de Assinatura Alvo</label>
                  <input 
                    type="text" 
                    value={editingFlag.subscriptionTiers.join(', ')}
                    onChange={(e) => setEditingFlag({ ...editingFlag, subscriptionTiers: e.target.value.split(',').map(s => s.trim().toLowerCase()) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono py-1.5 px-3 text-slate-200 focus:outline-none focus:border-indigo-500" 
                  />
                  <p className="text-[9px] text-slate-500">Ex: school_basic, school_pro ou ALL.</p>
                </div>

                {/* Whitelist Beta Emails */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-extrabold text-slate-400">Testadores Beta (E-mails whitelisted)</label>
                  <textarea 
                    value={editingFlag.betaEmails.join(', ')}
                    onChange={(e) => setEditingFlag({ ...editingFlag, betaEmails: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono py-1.5 px-3 text-slate-200 focus:outline-none focus:border-indigo-500 resize-none" 
                  />
                </div>

                {/* Toggle options */}
                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">Canary Sandbox</p>
                    <p className="text-[9px] text-slate-500">Isolar em ecossistemas fechados</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setEditingFlag({ ...editingFlag, canaryEnabled: !editingFlag.canaryEnabled })}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${editingFlag.canaryEnabled ? 'bg-indigo-500' : 'bg-slate-800'}`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${editingFlag.canaryEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-900">
                  <button 
                    type="button" 
                    onClick={() => setEditingFlag(null)}
                    className="flex-1 py-2 bg-slate-900 text-slate-400 hover:text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    {saving ? 'Gravando...' : 'Aplicar Regras'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3.5 text-slate-400 text-xs">
                <Target className="w-5 h-5 text-indigo-400" />
                <p className="font-bold text-white uppercase tracking-wider text-[10px]">Políticas Context-Aware</p>
                <p>Nossos SDKs avaliam sinalizadores localmente usando cache em memória para obter tempos de resposta na escala de microsegundos.</p>
                <p className="border-t border-slate-900/60 pt-3">Selecione uma flag da lista para definir regras detalhadas de Rollout e Geo-fencing.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: A/B Testing Cohorts */}
      {activeTab === 'experiments' && (
        <div className="space-y-6 relative z-10">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-indigo-400" />
                Matriz de Experiências e Conversões (A/B Testing)
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">Sinalizadores configurados com pesos de roteamento. Estatísticas compiladas dinamicamente com base em impressões e conversões.</p>
            </div>

            <div className="space-y-6">
              {flags.filter(f => f.abTesting.enabled).map((f) => (
                <div key={f.id} className="p-4 bg-slate-900 rounded-xl border border-slate-800/60 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800/40 pb-2">
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono">{f.label}</h4>
                      <p className="text-[10px] text-slate-500 font-mono">ID: {f.name}</p>
                    </div>
                    <span className="bg-indigo-950 text-indigo-400 border border-indigo-900 text-[9px] px-2 py-0.5 rounded font-extrabold uppercase">
                      Experiência em execução
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {f.abTesting.variants.map((v, index) => {
                      const conversionRate = v.impressions > 0 ? ((v.conversions / v.impressions) * 100).toFixed(1) : '0.0';
                      return (
                        <div key={index} className="bg-slate-950 p-3 rounded-lg border border-slate-800/60 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-xs font-bold text-indigo-400">{v.name}</span>
                            <span className="text-[10px] font-mono text-slate-500">Peso: {v.weight}%</span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                            <div className="bg-slate-900/60 p-2 rounded">
                              <p className="text-slate-500 uppercase text-[8px]">Impressões</p>
                              <p className="text-sm font-extrabold text-white">{v.impressions}</p>
                            </div>
                            <div className="bg-slate-900/60 p-2 rounded">
                              <p className="text-slate-500 uppercase text-[8px]">Conversões</p>
                              <p className="text-sm font-extrabold text-white">{v.conversions}</p>
                            </div>
                            <div className="bg-slate-900/60 p-2 rounded">
                              <p className="text-slate-500 uppercase text-[8px]">Taxa Conv.</p>
                              <p className="text-sm font-extrabold text-emerald-400">{conversionRate}%</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Remote Config & Evaluator Simulator */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          {/* Profile form */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                <UserCheck className="w-4 h-4 text-indigo-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Simulador de Contexto</h4>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-500 font-extrabold">E-mail do Aluno / Testador</label>
                  <input 
                    type="email" 
                    value={simUserEmail}
                    onChange={(e) => setSimUserEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs py-1.5 px-3 text-slate-200 focus:outline-none focus:border-indigo-500" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-500 font-extrabold">País de Conexão (GeoIP)</label>
                  <select 
                    value={simCountry} 
                    onChange={(e) => setSimCountry(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs py-1.5 px-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="PT">Portugal (PT)</option>
                    <option value="BR">Brasil (BR)</option>
                    <option value="ES">Espanha (ES)</option>
                    <option value="US">Estados Unidos (US)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-500 font-extrabold">Licença Escolar / Sub Tier</label>
                  <select 
                    value={simSubscription} 
                    onChange={(e) => setSimSubscription(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs py-1.5 px-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="school_pro">School Pro (Escola Premium)</option>
                    <option value="school_basic">School Basic (Escola Padrão)</option>
                    <option value="free">Livre / Não Integrado</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Results evaluation list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                <Activity className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Avaliações Determinísticas do Edge Engine (Microsegundos)</h4>
              </div>

              <div className="space-y-3">
                {simResults.map((r, idx) => (
                  <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-slate-800/60 flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-200">{r.label}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Chave: {r.name}</p>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-sans mt-1">Resultado lógico: <span className="text-slate-300 italic font-medium">"{r.reason}"</span></p>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded font-extrabold uppercase text-[10px] ${
                      r.active 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/60' 
                        : 'bg-slate-950 text-slate-500 border border-slate-800'
                    }`}>
                      {r.active ? 'Habilitado' : 'Bloqueado'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Tech Debt Tracking */}
      {activeTab === 'auditor' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {/* Audit trail */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-900 pb-3">
                <FileText className="w-4 h-4 text-indigo-400" />
                Trilha de Auditoria Técnica de Configurações
              </h3>

              <div className="space-y-3 max-h-[350px] overflow-y-auto">
                {auditLogs.map((log, idx) => (
                  <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-slate-800/60 text-xs flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="bg-slate-950 text-indigo-400 border border-slate-850 px-2 py-0.5 rounded font-mono font-bold text-[9px] uppercase">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-slate-200 font-bold">{log.details}</p>
                    <p className="text-[10px] text-slate-500">Operador: <b className="text-slate-400">{log.operator}</b></p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Debt alarms */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-900 pb-3">
                <ShieldAlert className="w-4 h-4" />
                Alerta de Sinalizadores Obsoletos
              </h3>
              <p className="text-[10px] text-slate-400 leading-relaxed">As chaves de alternância devem ser de curta duração para evitar o acúmulo de débito técnico e aumentar a complexidade do código.</p>

              <div className="space-y-3 pt-2">
                <div className="p-3 bg-rose-950/40 border border-rose-900/40 rounded-xl space-y-1">
                  <div className="flex items-center gap-1 text-rose-400 text-[10px] font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>ALERTA DE DÉBITO</span>
                  </div>
                  <p className="text-[11px] font-bold text-white font-mono">languageQuiz</p>
                  <p className="text-[10px] text-slate-400">Ativa a 100% por mais de 45 dias no codebase. Recomenda-se a remoção sistemática dos blocos condicionais do código principal.</p>
                </div>

                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                  <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>STATUS OK</span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-300 font-mono">practiceRoom</p>
                  <p className="text-[10px] text-slate-500">Criada há 14 dias. Coorte sob experimentação ativa.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
