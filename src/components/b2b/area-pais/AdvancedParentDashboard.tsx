import React, { useState, useMemo } from "react";
import {
  TrendingUp, TrendingDown, DollarSign, Calendar, AlertCircle,
  BarChart3, PieChart, Activity, Target, Zap, Download, RefreshCw,
  Filter, ChevronDown, ArrowUpRight, ArrowDownRight, Milestone,
  Users, Clock, Award, Flame, BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart as RechartsPie,
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, AreaChart
} from "recharts";
import { useRealtimeSync } from "../../../hooks/useRealtimeSync";
import { where } from "firebase/firestore";
import { auth } from "../../../firebase";
import { useToast } from "../../../context/ToastContext";

interface FinancialReport {
  month: string;
  spent: number;
  forecast: number;
  dependents: number;
}

interface ChildPerformance {
  id: string;
  name: string;
  progress: number;
  xp: number;
  weeklyMinutes: number;
  attendanceRate: number;
  trend: number; // % change
  level: number;
  language: string;
}

interface BillingMetrics {
  activeSubscriptions: number;
  monthlySpend: number;
  yearlyProjection: number;
  billingStatus: "on-time" | "past-due" | "upcoming";
  nextBillingDate: string;
  dependentsPerPlan: Record<string, number>;
}

export const AdvancedParentDashboard: React.FC<{
  setView?: (v: string) => void;
}> = ({ setView }) => {
  const { addToast } = useToast();
  const user = auth.currentUser;
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [selectedMetric, setSelectedMetric] = useState<"progress" | "spending" | "attendance">("progress");

  const financialData: FinancialReport[] = [
    { month: "Mai", spent: 149, forecast: 160, dependents: 2 },
    { month: "Jun", spent: 149, forecast: 160, dependents: 2 },
    { month: "Jul", spent: 149, forecast: 160, dependents: 3 },
    { month: "Ago", spent: 223, forecast: 160, dependents: 3 },
    { month: "Set", spent: 223, forecast: 240, dependents: 3 },
    { month: "Out", spent: 223, forecast: 240, dependents: 3 }
  ];

  const childPerformanceData: ChildPerformance[] = [
    {
      id: "dep-1",
      name: "Gabriel Uragan",
      progress: 78,
      xp: 2450,
      weeklyMinutes: 180,
      attendanceRate: 95,
      trend: 12,
      level: 6,
      language: "Kimbundu (B1)"
    },
    {
      id: "dep-2",
      name: "Beatriz Uragan",
      progress: 45,
      xp: 1200,
      weeklyMinutes: 120,
      attendanceRate: 100,
      trend: 8,
      level: 3,
      language: "Kimbundu (A1)"
    },
    {
      id: "dep-3",
      name: "Clara Uragan",
      progress: 12,
      xp: 350,
      weeklyMinutes: 60,
      attendanceRate: 85,
      trend: -3,
      level: 1,
      language: "Kimbundu (Iniciante)"
    }
  ];

  const billingMetrics: BillingMetrics = {
    activeSubscriptions: 1,
    monthlySpend: 223,
    yearlyProjection: 2676,
    billingStatus: "on-time",
    nextBillingDate: "14 de Agosto, 2026",
    dependentsPerPlan: {
      "Familiar Premium": 3,
      "Individual": 0
    }
  };

  const attendanceChartData = useMemo(() => {
    return childPerformanceData.map(child => ({
      name: child.name.split(" ")[0],
      Frequência: child.attendanceRate,
      "Minutos Semanais": child.weeklyMinutes / 5 // scale for visibility
    }));
  }, []);

  const progressTrendData = useMemo(() => {
    const weeks = ["S1", "S2", "S3", "S4"];
    return weeks.map((week, idx) => ({
      week,
      Gabriel: 45 + idx * 8,
      Beatriz: 20 + idx * 6,
      Clara: 5 + idx * 2
    }));
  }, []);

  const xpDistribution = useMemo(() => {
    return childPerformanceData.map(child => ({
      name: child.name.split(" ")[0],
      value: child.xp,
      color: ["#4f46e5", "#ec4899", "#f59e0b"][childPerformanceData.indexOf(child)]
    }));
  }, []);

  const COLORS = ["#4f46e5", "#ec4899", "#f59e0b"];

  const handleExportReport = (format: "pdf" | "excel") => {
    addToast(`Exportando relatório avançado em ${format.toUpperCase()}...`, "info");
    setTimeout(() => {
      addToast(`Relatório de ${timeRange} exportado com sucesso!`, "success");
    }, 1500);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900">
              Análises Avançadas de Subscriptions
            </h1>
            <p className="text-slate-600 text-sm md:text-base mt-2">
              Visualize dados de faturamento, progresso de dependentes e projeções financeiras
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(["7d", "30d", "90d", "1y"] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  timeRange === range
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                }`}
              >
                {range === "7d" ? "7 dias" : range === "30d" ? "30 dias" : range === "90d" ? "90 dias" : "1 ano"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-600 text-sm font-bold">Gasto Mensal</span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-slate-900">
              {billingMetrics.monthlySpend.toLocaleString("pt-BR")} Kz
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Flame className="w-3 h-3 text-orange-500" />
              <span>Dependentes: {billingMetrics.dependentsPerPlan["Familiar Premium"]}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-600 text-sm font-bold">Projeção Anual</span>
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-slate-900">
              {billingMetrics.yearlyProjection.toLocaleString("pt-BR")} Kz
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <span>12 meses</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-600 text-sm font-bold">Próxima Fatura</span>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-black text-slate-900">
              {billingMetrics.nextBillingDate}
            </div>
            <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
              billingMetrics.billingStatus === "on-time"
                ? "bg-emerald-100 text-emerald-700"
                : billingMetrics.billingStatus === "past-due"
                ? "bg-rose-100 text-rose-700"
                : "bg-blue-100 text-blue-700"
            }`}>
              {billingMetrics.billingStatus === "on-time" ? "Em Dia" : "Em atraso"}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-600 text-sm font-bold">Assinaturas Ativas</span>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-slate-900">
              {billingMetrics.activeSubscriptions}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Award className="w-3 h-3" />
              <span>Familiar Premium</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Spending Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Despesa vs Previsão</h3>
            <button
              onClick={() => handleExportReport("pdf")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialData}>
                <defs>
                  <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#f1f5f9" }} />
                <Area type="monotone" dataKey="spent" stroke="#4f46e5" fill="url(#colorSpent)" strokeWidth={2} />
                <Area type="monotone" dataKey="forecast" stroke="#94a3b8" fill="url(#colorForecast)" strokeWidth={2} strokeDasharray="5 5" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Performance Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
        >
          <h3 className="text-lg font-bold text-slate-900 mb-6">Comparação de Progresso</h3>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#f1f5f9" }} />
                <Legend />
                <Line type="monotone" dataKey="Gabriel" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Beatriz" stroke="#ec4899" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Clara" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Children Performance Cards */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Desempenho Individual dos Dependentes</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {childPerformanceData.map((child, idx) => (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{child.name}</h4>
                  <p className="text-xs text-slate-500">{child.language}</p>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                  child.trend >= 0
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}>
                  {child.trend >= 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(child.trend)}%
                </div>
              </div>

              <div className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-600">Progresso do Curso</span>
                    <span className="text-sm font-black text-slate-900">{child.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${child.progress}%` }}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Nível</div>
                    <div className="text-lg font-black text-indigo-600 mt-1">{child.level}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Frequência</div>
                    <div className="text-lg font-black text-emerald-600 mt-1">{child.attendanceRate}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Min/Semana</div>
                    <div className="text-lg font-black text-blue-600 mt-1">{child.weeklyMinutes}</div>
                  </div>
                </div>

                {/* XP Badge */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-lg border border-amber-100">
                  <div className="flex items-center gap-2 justify-between">
                    <span className="text-xs font-bold text-amber-700">Experiência Acumulada</span>
                    <span className="text-sm font-black text-amber-900">{child.xp} XP</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* XP Distribution & Billing Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* XP Distribution Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
        >
          <h3 className="text-lg font-bold text-slate-900 mb-6">Distribuição de Experiência</h3>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie data={xpDistribution}>
                <Pie cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} dataKey="value">
                  {xpDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Attendance & Engagement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
        >
          <h3 className="text-lg font-bold text-slate-900 mb-6">Frequência & Engajamento</h3>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#f1f5f9" }} />
                <Legend />
                <Bar dataKey="Frequência" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Minutos Semanais" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Export Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-200"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Exportar Relatórios Completos</h3>
            <p className="text-sm text-slate-600 mt-1">Baixe análises detalhadas para compartilhar com escola ou profissionais</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExportReport("pdf")}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" /> PDF
            </button>
            <button
              onClick={() => handleExportReport("excel")}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" /> Excel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
