import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Building,
  Users,
  Target,
  BookOpen,
  GraduationCap,
  BarChart3,
  Calendar,
  CreditCard,
  Shield,
  Settings,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Globe,
  Search,
  Activity,
  LayoutDashboard,
  BrainCircuit,
  FileText,
  Clock,
  Briefcase,
  Award,
  Zap,
  Crosshair,
  Network,
  Calculator,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { GlapModule } from "../glap/GlapModule";

type CEPSection =
  | "dashboard"
  | "command-center"
  | "employees"
  | "academies"
  | "skills"
  | "compliance"
  | "financial"
  | "analytics"
  | "glap";

export const CorporateEnterprisePlatform: React.FC<{
  activeView?: string;
  setView?: (v: any) => void;
}> = ({ activeView = "dashboard", setView }) => {
  const [activeSection, setActiveSection] = useState<CEPSection>("dashboard");

  useEffect(() => {
    // Map router views to internal sections
    if (activeView === "area-empresarial" || activeView === "dashboard")
      setActiveSection("dashboard");
    else if (activeView === "colaboradores" || activeView === "equipas")
      setActiveSection("employees");
    else if (activeView === "academias" || activeView === "programas")
      setActiveSection("academies");
    else if (activeView === "competencias") setActiveSection("skills");
    else if (activeView === "compliance" || activeView === "certificacoes")
      setActiveSection("compliance");
    else if (activeView === "analytics-corp") setActiveSection("analytics");
    else if (activeView === "financeiro-corp") setActiveSection("financial");
    else if (activeView === "command-center-corp")
      setActiveSection("command-center");
    else if (activeView === "glap")
      setActiveSection("glap");
  }, [activeView]);

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* CEP Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800">
                  Corporate Enterprise Platform
                </h1>
                <p className="text-slate-500 font-medium">
                  LingoLIVE IA - CEP v1.0 (Enterprise)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-xl border border-indigo-100">
              <Globe className="w-4 h-4 text-indigo-500" />
              <span className="font-bold text-indigo-700">
                12 Regiões (CLPI: B2)
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <Users className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-emerald-700">
                12,450 Colaboradores
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex overflow-x-auto pb-4 mb-4 gap-2 scrollbar-hide">
          {[
            {
              id: "dashboard",
              label: "Dashboard Executivo",
              icon: LayoutDashboard,
            },
            {
              id: "command-center",
              label: "AI Command Center",
              icon: BrainCircuit,
            },
            { id: "employees", label: "Talento &amp; quipas", icon: Users },
            { id: "skills", label: "Matriz de Competências", icon: Target },
            {
              id: "academies",
              label: "Academias Corporativas",
              icon: Building,
            },
            {
              id: "compliance",
              label: "Compliance &amp; ertificação",
              icon: Shield,
            },
            { id: "financial", label: "Gestão de Licenças", icon: CreditCard },
            { id: "analytics", label: "Analytics &amp; OI", icon: BarChart3 },
            { id: "glap", label: "Ambassadors (GLAP)", icon: Sparkles },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as CEPSection)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                activeSection === item.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
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
            {activeSection === "dashboard" && <CEPDashboard />}
            {activeSection === "command-center" && <CEPCommandCenter />}
            {activeSection === "employees" && <CEPEmployees />}
            {activeSection === "skills" && <CEPSkills />}
            {activeSection === "academies" && <CEPAcademies />}
            {activeSection === "compliance" && <CEPCompliance />}
            {activeSection === "financial" && <CEPFinancial />}
            {activeSection === "analytics" && <CEPAnalytics />}
            {activeSection === "glap" && <GlapModule />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- SUBCOMPONENTS ---

const CEPDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        {
          title: "Colaboradores Ativos",
          value: "12,450",
          trend: "98% Engagement",
          icon: Users,
          color: "indigo",
        },
        {
          title: "Horas de Formação",
          value: "34,200",
          trend: "+15% vs Último Trimestre",
          icon: Clock,
          color: "emerald",
        },
        {
          title: "Certificações (Q3)",
          value: "1,240",
          trend: "Compliance em Dia",
          icon: Shield,
          color: "blue",
        },
        {
          title: "Índice CLPI Global",
          value: "B2.1",
          trend: "+0.4 Evolução Anual",
          icon: Globe,
          color: "amber",
        },
      ].map((kpi, i) => (
        <div
          key={i}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"
        >
          <div
            className={`absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-${kpi.color}-500`}
          >
            <kpi.icon className="w-24 h-24" />
          </div>
          <h3 className="text-sm font-bold text-slate-500 mb-2">{kpi.title}</h3>
          <span className="text-4xl font-black text-slate-800 mb-2 block">
            {kpi.value}
          </span>
          <span
            className={`text-xs font-bold text-${kpi.color}-600 bg-${kpi.color}-50 px-2 py-1 rounded-md`}
          >
            {kpi.trend}
          </span>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Corporate Language Proficiency Index (CLPI)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Evolução da proficiência linguística global da organização
            </p>
          </div>
          <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-600 outline-none">
            <option>Últimos 12 Meses</option>
            <option>Ano Anterior</option>
          </select>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={[
                { month: "Jan", index: 65, target: 70 },
                { month: "Fev", index: 66, target: 70 },
                { month: "Mar", index: 68, target: 70 },
                { month: "Abr", index: 69, target: 72 },
                { month: "Mai", index: 71, target: 72 },
                { month: "Jun", index: 72, target: 72 },
                { month: "Jul", index: 74, target: 75 },
              ]}
            >
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                domain={[50, 100]}
              />
              <RechartsTooltip
                cursor={{
                  stroke: "#cbd5e1",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Legend iconType="circle" />
              <Line
                type="monotone"
                dataKey="index"
                name="Índice CLPI Atual"
                stroke="#4f46e5"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="target"
                name="Meta Institucional"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-indigo-500" />
          Alertas de Compliance
        </h3>
        <div className="flex-1 space-y-4">
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-800 text-sm">
                Certificação de Segurança IT a Expirar
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                142 colaboradores com certificação a expirar nos próximos 30
                dias.{" "}
                <a
                  href="#"
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Notificar Equipa
                </a>
                .
              </p>
            </div>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
            <Target className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-800 text-sm">
                Skill Gap: Liderança Intercultural
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Departamento de Operações (EMEA) apresenta lacuna crítica.
                Sugestão: Ativar trilho ALPE.
              </p>
            </div>
          </div>
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-800 text-sm">
                Onboarding Q3 Concluído
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                100% dos novos hires completaram o percurso de integração
                corporativa.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const CEPCommandCenter = () => {
  return (
    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 py-16 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <BrainCircuit className="w-64 h-64 text-indigo-400" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/30">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">
              Corporate AI Command Center
            </h2>
            <p className="text-indigo-400 font-medium text-sm mt-1">
              Centro Inteligente de Gestão de Aprendizagem &amp; Workforce
              Intelligence
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-4">
              <Crosshair className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-white font-bold mb-3">
              Previsão de Risco Operacional
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              A expansão para a LATAM requer Nível B2 em Espanhol. Atualmente, a
              equipa alocada regista um nível médio A2.{" "}
              <span className="text-rose-400 font-bold">Risco Crítico</span>.
            </p>
            <button className="text-xs font-bold text-indigo-400 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 w-full text-center">
              Gerar Plano de Resgate Rápido
            </button>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-white font-bold mb-3">ROI da Aprendizagem</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              A "Academia de Vendas Internacionais" correlaciona-se com um
              aumento de{" "}
              <span className="text-emerald-400 font-bold">+12%</span> nas
              conversões Q2.
            </p>
            <button className="text-xs font-bold text-emerald-400 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 w-full text-center">
              Ver Relatório Executivo
            </button>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4">
              <Network className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-white font-bold mb-3">Planos de Sucessão</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              4 quadros superiores próximos da reforma (2027). A IA identificou
              12 talentos internos (High Performers) prontos para upskilling.
            </p>
            <button className="text-xs font-bold text-amber-400 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 w-full text-center">
              Ver Mapa de Sucessão
            </button>
          </div>
        </div>

        <ROICalculator />
      </div>
    </div>
  );
};

const CEPEmployees = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20 shadow-sm">
    <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <Users className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">
      Gestão de Talento &amp; quipas
    </h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Integrado via SCIM/API com Workday e SAP SuccessFactors. Acompanhe a
      evolução, o histórico e os objetivos individuais de desenvolvimento (IDP)
      de cada colaborador.
    </p>
  </div>
);

const CEPSkills = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20 shadow-sm">
    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <Target className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">
      Matriz de Competências &amp; ap Analysis
    </h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Mapeamento visual de Soft, Hard e Language Skills por função. A IA sugere
      automaticamente os trilhos formativos necessários para suprir lacunas
      detetadas.
    </p>
  </div>
);

const CEPAcademies = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20 shadow-sm">
    <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <Building className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">
      Academias Corporativas &amp; rogramas
    </h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Estruture academias internas (Ex: Sales Academy, Leadership Hub). Construa
      bootcamps, trilhos obrigatórios e campanhas de upskilling com gamificação
      integrada.
    </p>
  </div>
);

const CEPCompliance = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20 shadow-sm">
    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <Shield className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">
      Compliance &amp; ertificações Internas
    </h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Garanta a conformidade global. Automatize as formações de Segurança,
      Proteção de Dados (GDPR) e Ética. Emissão de badges e credenciais digitais
      auditáveis.
    </p>
  </div>
);

const CEPFinancial = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20 shadow-sm">
    <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <CreditCard className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">
      Gestão de Licenças &amp; entros de Custo
    </h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Controlo de orçamento para T&D. Faturação consolidada ou segmentada por
      unidade de negócio (Centro de Custo), monitorização de consumo e
      renovações.
    </p>
  </div>
);

const CEPAnalytics = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center py-20 shadow-sm">
    <div className="w-20 h-20 bg-fuchsia-50 text-fuchsia-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <BarChart3 className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-black text-slate-800 mb-4">
      Analytics &amp; Workforce Intelligence
    </h2>
    <p className="text-slate-500 max-w-lg mx-auto mb-8">
      Dashboards executivos para o C-Level. Relatórios de ROI, engagement, custo
      por hora de formação e cruzamento de dados com a performance do negócio.
    </p>
  </div>
);

const ROICalculator = () => {
  const [showCalculator, setShowCalculator] = useState(false);
  const [trainingCosts, setTrainingCosts] = useState(50000);
  const [turnoverReduction, setTurnoverReduction] = useState(5);
  const [productivityGain, setProductivityGain] = useState(10);
  const [projectionYears, setProjectionYears] = useState(1);

  const averageSalary = 50000;
  const numEmployees = 100;
  const turnoverCostPerEmployee = averageSalary * 0.5;
  const savingsFromTurnover =
    numEmployees * (turnoverReduction / 100) * turnoverCostPerEmployee;
  const savingsFromProductivity =
    numEmployees * averageSalary * (productivityGain / 100);
  const totalSavings = (savingsFromTurnover + savingsFromProductivity) * projectionYears;
  const totalCosts = trainingCosts * projectionYears;
  const netROI = totalSavings - totalCosts;
  const roiPercentage =
    totalCosts > 0 ? ((netROI / totalCosts) * 100).toFixed(1) : 0;

  return (
    <div className="mt-8 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <Calculator className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-white font-bold text-lg">
            Calculadora de ROI de Formação
          </h3>
        </div>
        <button
          onClick={() => setShowCalculator(!showCalculator)}
          className="text-xs font-bold text-slate-300 hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-lg border border-white/10"
        >
          {showCalculator ? "Ocultar Calculadora" : "Abrir Calculadora"}
        </button>
      </div>

      {showCalculator && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-white/10 pt-6 mt-2">
          <div className="space-y-6">
            <div className="flex gap-2">
              {[1, 3, 5].map((years) => (
                <button
                  key={years}
                  onClick={() => setProjectionYears(years)}
                  className={`flex-1 text-xs font-bold py-2 rounded-lg border transition-colors ${
                    projectionYears === years
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-white/5 text-slate-300 border-white/10 hover:border-white/20"
                  }`}
                >
                  {years} {years === 1 ? "Ano" : "Anos"}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-2">
                Custos de Formação (Estimativa Anual €)
              </label>
              <input
                type="range"
                min="5000"
                max="250000"
                step="5000"
                value={trainingCosts}
                onChange={(e) => setTrainingCosts(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="text-right text-white font-mono mt-1">
                € {trainingCosts.toLocaleString()}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-2">
                Redução Esperada de Evasão (Turnover) (%)
              </label>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={turnoverReduction}
                onChange={(e) => setTurnoverReduction(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <div className="text-right text-white font-mono mt-1">
                {turnoverReduction}%
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-2">
                Ganho de Produtividade Esperado (%)
              </label>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={productivityGain}
                onChange={(e) => setProductivityGain(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="text-right text-white font-mono mt-1">
                {productivityGain}%
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 flex flex-col justify-center">
            <div className="h-40 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Custos de Formação", value: totalCosts },
                      { name: "Poupança Total", value: totalSavings },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#6366f1" />
                    <Cell fill="#10b981" />
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <h4 className="text-sm font-bold text-slate-300 mb-6 text-center">
              Resultados Projetados (Base: 100 Colaboradores)
            </h4>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">
                  Poupança em Retenção:
                </span>
                <span className="text-emerald-400 font-mono font-bold">
                  €{" "}
                  {savingsFromTurnover.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">
                  Aumento de Valor Produzido:
                </span>
                <span className="text-amber-400 font-mono font-bold">
                  €{" "}
                  {savingsFromProductivity.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                <span className="text-slate-300 font-bold">
                  Poupança Bruta Total:
                </span>
                <span className="text-white font-mono font-bold">
                  €{" "}
                  {totalSavings.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            </div>

            <div className="bg-indigo-500/20 p-4 rounded-xl border border-indigo-500/30 text-center">
              <span className="text-indigo-300 text-xs font-bold uppercase tracking-wider block mb-1">
                ROI Líquido Estimado
              </span>
              <span className="text-3xl font-black text-white">
                €{" "}
                {netROI.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-emerald-400 text-sm font-bold ml-2">
                ({roiPercentage}%)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
