import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Cpu, 
  Radio, 
  Cloud, 
  Map, 
  Zap, 
  ShieldCheck, 
  RefreshCw, 
  Activity, 
  FileCode, 
  Layout, 
  Terminal, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight,
  TrendingDown,
  Navigation
} from 'lucide-react';

interface CloudRegion {
  id: string;
  name: string;
  providerCode: string; // e.g. europe-west2 (London), us-central1 (Iowa), southamerica-east1 (São Paulo)
  continent: string;
  status: 'online' | 'degraded' | 'offline';
  latencyMs: number;
  containerCount: number;
  cacheHitRatio: number; // e.g. 98.4
  loadPercent: number;
}

export default function GlobalDeploymentDashboard() {
  const [activeTab, setActiveTab] = useState<'regions' | 'anycast' | 'tf' | 'dns'>('regions');
  const [regions, setRegions] = useState<CloudRegion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [globalTraffic, setGlobalTraffic] = useState<number>(3420); // total requests/sec
  const [anycastStatus, setAnycastStatus] = useState<'healthy' | 'converging'>('healthy');
  const [logs, setLogs] = useState<string[]>([]);
  
  // Real-time Traffic Simulator state
  const [simClientIp, setSimClientIp] = useState('188.29.165.22');
  const [simClientCountry, setSimClientCountry] = useState('PT');
  const [simResolvedRegion, setSimResolvedRegion] = useState('europe-west2');
  const [simLatency, setSimLatency] = useState(14);
  const [simHops, setSimHops] = useState(4);

  const initialRegions: CloudRegion[] = [
    { id: 'lon', name: 'Europe West (London)', providerCode: 'europe-west2', continent: 'Europe', status: 'online', latencyMs: 12, containerCount: 16, cacheHitRatio: 98.6, loadPercent: 42 },
    { id: 'iow', name: 'US Central (Iowa)', providerCode: 'us-central1', continent: 'North America', status: 'online', latencyMs: 45, containerCount: 24, cacheHitRatio: 97.2, loadPercent: 55 },
    { id: 'spo', name: 'South America East (São Paulo)', providerCode: 'southamerica-east1', continent: 'South America', status: 'online', latencyMs: 28, containerCount: 12, cacheHitRatio: 99.1, loadPercent: 30 },
    { id: 'tok', name: 'Asia Northeast (Tokyo)', providerCode: 'asia-northeast1', continent: 'Asia/Pacific', status: 'online', latencyMs: 85, containerCount: 8, cacheHitRatio: 94.8, loadPercent: 18 }
  ];

  const initialLogs = [
    'Initializing Multi-Region Anycast Edge Engine...',
    'Google Cloud Load Balancing configuration active via Anycast IP.',
    'Cloud CDN cache headers populated on 24 edge endpoints globally.',
    'Regional health checks reported 100% SLA for all continental clusters.'
  ];

  useEffect(() => {
    setRegions(initialRegions);
    setLogs(initialLogs.map(l => `[${new Date().toLocaleTimeString()}] ${l}`));
  }, []);

  const triggerFailoverDrill = async (regionId: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ⚠️ FAILOVER DRILL: Simulating degradation in region ${regionId}...`]);
    setRegions(prev => prev.map(r => r.id === regionId ? { ...r, status: 'degraded', latencyMs: r.latencyMs * 5, loadPercent: 85 } : r));
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    setAnycastStatus('converging');
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🔄 Anycast Router: Rerouting traffic from degraded region ${regionId} to nearest active neighbor...`]);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    setAnycastStatus('healthy');
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ Global BGP convergence complete. Primary traffic successfully re-routed.`]);
  };

  const restoreRegion = (regionId: string) => {
    setRegions(prev => prev.map(r => r.id === regionId ? { ...r, status: 'online', latencyMs: initialRegions.find(ir => ir.id === regionId)?.latencyMs || 20, loadPercent: 35 } : r));
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ❇️ Region ${regionId} restored. Scaling up Cloud Run replicas, sync complete.`]);
  };

  const evaluateAnycastSim = () => {
    let region = 'europe-west2';
    let latency = 15;
    let hops = 4;

    switch (simClientCountry) {
      case 'PT':
        region = 'europe-west2';
        latency = 12;
        hops = 4;
        break;
      case 'BR':
        region = 'southamerica-east1';
        latency = 22;
        hops = 5;
        break;
      case 'US':
        region = 'us-central1';
        latency = 35;
        hops = 6;
        break;
      case 'JP':
        region = 'asia-northeast1';
        latency = 18;
        hops = 3;
        break;
    }

    // Adjust in case a region is degraded
    const targetRegionObj = regions.find(r => r.providerCode === region);
    if (targetRegionObj && targetRegionObj.status === 'degraded') {
      region = 'us-central1'; // failover
      latency = latency + 120;
      hops = hops + 6;
    }

    setSimResolvedRegion(region);
    setSimLatency(latency);
    setSimHops(hops);
  };

  useEffect(() => {
    if (regions.length > 0) {
      evaluateAnycastSim();
    }
  }, [simClientCountry, regions]);

  // Real terraform/IaC snippet
  const terraformSnippet = `resource "google_compute_global_forwarding_rule" "lingolive_anycast" {
  name                  = "lingolive-anycast-http"
  target                = google_compute_target_http_proxy.lingolive_proxy.id
  port_range            = "80"
  ip_address            = google_compute_global_address.lingolive_ip.address
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

resource "google_compute_backend_service" "lingolive_backend" {
  name                  = "lingolive-global-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  enable_cdn            = true

  cdn_policy {
    cache_mode        = "CACHE_ALL_STATIC"
    default_ttl       = 3600
    client_ttl        = 3600
    max_ttl           = 86400
    serve_while_stale = 86400
  }

  backend {
    group = google_compute_region_network_endpoint_group.europe_neg.id
  }
  backend {
    group = google_compute_region_network_endpoint_group.us_neg.id
  }
  backend {
    group = google_compute_region_network_endpoint_group.sa_neg.id
  }
}`;

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6 relative overflow-hidden">
      {/* Background neon highlights */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5 flex-wrap gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl shadow-lg shadow-indigo-900/20">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Global Deployment Engine</h2>
            <p className="text-xs text-indigo-400 font-mono font-medium">GCP Multi-Region Anycast GLB, Cloud Run Containers, CDN caching & BGP routing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <span className="text-[10px] font-mono font-extrabold text-cyan-400 uppercase tracking-widest bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
            Anycast BGP Active
          </span>
        </div>
      </div>

      {/* Core KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Global Anycast IP</p>
            <p className="text-base font-mono font-extrabold text-white">34.120.255.80</p>
            <p className="text-[10px] text-emerald-400 font-medium">Unificado na Borda</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Clusters Ativos</p>
            <p className="text-xl font-extrabold text-white">{regions.filter(r => r.status === 'online').length} / {regions.length}</p>
            <p className="text-[10px] text-cyan-400 font-medium">Autoscaling Cloud Run</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Latência de Borda Média</p>
            <p className="text-xl font-extrabold text-white">24.5 ms</p>
            <p className="text-[10px] text-purple-400 font-medium">DNS Routing GeoIP</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Cloud CDN Cache Hit</p>
            <p className="text-xl font-extrabold text-white">97.4%</p>
            <p className="text-[10px] text-emerald-400 font-medium">Estáticos Servidos na Borda</p>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto relative z-10 scrollbar-none">
        <button 
          onClick={() => setActiveTab('regions')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'regions' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Map className="w-4 h-4" />
          <span>Multirregião Cloud Run</span>
        </button>
        <button 
          onClick={() => setActiveTab('anycast')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'anycast' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Anycast Simulation</span>
        </button>
        <button 
          onClick={() => setActiveTab('tf')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'tf' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Terraform (IaC)</span>
        </button>
      </div>

      {/* Tab: Multi-Region Status & DR */}
      {activeTab === 'regions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          {/* Region list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">GCP Active Regional Backends</h3>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                  anycastStatus === 'healthy' 
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-900' 
                    : 'bg-yellow-950 text-yellow-400 border-yellow-900'
                }`}>
                  BGP Status: {anycastStatus}
                </span>
              </div>

              <div className="space-y-4">
                {regions.map((r) => (
                  <div key={r.id} className="p-4 bg-slate-900 rounded-xl border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          r.status === 'online' 
                            ? 'bg-emerald-400' 
                            : r.status === 'degraded' 
                              ? 'bg-yellow-400 animate-pulse' 
                              : 'bg-rose-500'
                        }`} />
                        <p className="font-bold text-slate-200">{r.name}</p>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">Região GCP: <code className="text-indigo-400">{r.providerCode}</code> | Continente: {r.continent}</p>
                      
                      {/* Sub-metrics */}
                      <div className="flex gap-4 pt-1 text-[10px] font-mono text-slate-400">
                        <span>Latência: <b className="text-white">{r.latencyMs}ms</b></span>
                        <span>Instâncias: <b className="text-white">{r.containerCount}</b></span>
                        <span>Carga: <b className="text-white">{r.loadPercent}%</b></span>
                        <span>CDN HIT: <b className="text-white">{r.cacheHitRatio}%</b></span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {r.status === 'online' ? (
                        <button 
                          onClick={() => triggerFailoverDrill(r.id)}
                          className="px-3 py-1.5 bg-yellow-600/10 hover:bg-yellow-600/20 text-yellow-400 border border-yellow-900/40 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer"
                        >
                          Simular Queda (Drill)
                        </button>
                      ) : (
                        <button 
                          onClick={() => restoreRegion(r.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer"
                        >
                          Restaurar Cluster
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* DR & SLA panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">Consola BGP Edge (Live)</h4>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-850 font-mono text-[9px] text-slate-300 space-y-2 h-[220px] overflow-y-auto">
                {logs.map((log, index) => (
                  <p key={index} className="leading-relaxed whitespace-pre-wrap">{log}</p>
                ))}
              </div>

              <div className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl space-y-1 text-xs text-slate-300">
                <p className="font-bold text-white uppercase text-[10px]">Políticas de SLA Global</p>
                <p className="text-[10px] text-slate-400 leading-relaxed">Nossa infraestrutura Anycast garante replicação assíncrona entre o Firestore Europeu e o cache local com perda zero de consistência (Teorema CAP resolvido via Local Eventual Consistency).</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Anycast simulator */}
      {activeTab === 'anycast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          {/* Controls */}
          <div className="lg:col-span-1 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
              <TrendingDown className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Simulador de Latência de Rota</h4>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-slate-500 font-extrabold">Simular Conexão de Cliente</label>
                <select 
                  value={simClientCountry} 
                  onChange={(e) => setSimClientCountry(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs py-1.5 px-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="PT">Portugal (Lisboa)</option>
                  <option value="BR">Brasil (Rio de Janeiro)</option>
                  <option value="US">Estados Unidos (Chicago)</option>
                  <option value="JP">Japão (Tóquio)</option>
                </select>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-slate-850 font-mono text-[10px] space-y-1 text-slate-400">
                <p>IP Cliente: <b className="text-white">{simClientIp}</b></p>
                <p>Protocolo: <b className="text-white">HTTP/3 QUIC (UDP)</b></p>
              </div>
            </div>
          </div>

          {/* Graph results */}
          <div className="lg:col-span-2 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
              <Activity className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Roteamento Inteligente Google Load Balancing (GLB)</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 flex flex-col justify-between text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Cluster Resolvido</span>
                  <p className="text-sm font-extrabold text-white mt-1 font-mono">{simResolvedRegion}</p>
                </div>
                <span className="text-[9px] text-emerald-400 font-mono">✓ Menor latência local</span>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 flex flex-col justify-between text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Latência de Ida e Volta (RTT)</span>
                  <p className="text-3xl font-black text-white mt-1">{simLatency} ms</p>
                </div>
                <span className="text-[9px] text-emerald-400 font-mono">✓ Ultra Fast</span>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 flex flex-col justify-between text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Saltos na Rede (Hops)</span>
                  <p className="text-3xl font-black text-white mt-1">{simHops} hops</p>
                </div>
                <span className="text-[9px] text-indigo-400 font-mono">Anycast Network IP</span>
              </div>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-850 text-xs flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-2">
                <Globe className="text-cyan-400 w-4 h-4" />
                <span>Fluxo: Cliente ({simClientCountry})</span>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>Edge Anycast Node (PoP)</span>
              <ArrowRight className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>GCP Region ({simResolvedRegion})</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Terraform IaC Snippet */}
      {activeTab === 'tf' && (
        <div className="space-y-6 relative z-10">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-indigo-400" />
                Infrastructure as Code (Terraform) Snippet
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">Definições declarativas oficiais usadas para provisionar os balanceadores de carga Anycast e as CDN regionais em produção na Google Cloud Platform.</p>
            </div>

            <pre className="bg-slate-900 p-4 rounded-xl border border-slate-850 font-mono text-[10px] text-indigo-300 overflow-x-auto leading-relaxed max-h-[300px]">
              <code>{terraformSnippet}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
