import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  AlertCircle,
  DollarSign,
  Award,
  Clock,
  CheckCircle,
  Settings,
} from "lucide-react";
import { useToast } from "../../../context/ToastContext";
import { auth } from "@/firebase";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useMonitoring } from "@/hooks/useMonitoring";

interface BusinessDashboardProps {
  onNavigate?: (view: string) => void;
}

export const BusinessDashboard: React.FC<BusinessDashboardProps> = ({
  onNavigate,
}) => {
  const [metrics, setMetrics] = useState({
    totalEmployees: 2450,
    activeUsers: 1823,
    completionRate: 87,
    averageProgress: 72,
    monthlySpend: 4250,
    remainingBudget: 1750,
  });

  const { showToast } = useToast();
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  useEffect(() => {
    if (userId) {
      trackEvent('business_dashboard_viewed', {
        dashboardType: 'corporate',
        totalEmployees: metrics.totalEmployees,
        activeUsers: metrics.activeUsers,
        completionRate: metrics.completionRate,
        monthlySpend: metrics.monthlySpend
      });
    }
  }, [userId, trackEvent, metrics.totalEmployees, metrics.activeUsers, metrics.completionRate, metrics.monthlySpend]);

  const departments = [
    { name: "Vendas", users: 450, completionRate: 92 },
    { name: "Suporte", users: 320, completionRate: 85 },
    { name: "Recursos Humanos", users: 180, completionRate: 95 },
    { name: "Tecnologia", users: 280, completionRate: 78 },
    { name: "Marketing", users: 240, completionRate: 88 },
  ];

  const recentActivity = [
    { date: "Hoje", action: "45 utilizadores completaram uma aula", count: 45 },
    { date: "Ontem", action: "62 utilizadores praticaram speaking", count: 62 },
    { date: "Última semana", action: "340 horas de aprendizagem registadas", count: 340 },
  ];

  const handleViewReports = () => {
    if (userId) {
      trackEvent('business_dashboard_view_reports_clicked', {
        dashboardType: 'corporate',
        navigationTarget: 'analytics-corp'
      });
    }
    onNavigate?.("analytics-corp");
    showToast("Abrindo relatórios detalhados...", "success");
  };

  const handleConfigureTeam = () => {
    if (userId) {
      trackEvent('business_dashboard_configure_teams_clicked', {
        dashboardType: 'corporate',
        navigationTarget: 'equipas'
      });
    }
    onNavigate?.("equipas");
    showToast("Abrindo configurações de equipas...", "success");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Dashboard Corporativo
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Gerencia a aprendizagem de línguas da sua organização
          </p>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              if (userId) {
                trackEvent('business_dashboard_kpi_viewed', {
                  kpiType: 'total_employees',
                  value: metrics.totalEmployees,
                  dashboardType: 'corporate'
                });
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total de Colaboradores</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {metrics.totalEmployees.toLocaleString()}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              if (userId) {
                trackEvent('business_dashboard_kpi_viewed', {
                  kpiType: 'active_users',
                  value: metrics.activeUsers,
                  dashboardType: 'corporate'
                });
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Utilizadores Ativos</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {metrics.activeUsers}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              if (userId) {
                trackEvent('business_dashboard_kpi_viewed', {
                  kpiType: 'completion_rate',
                  value: metrics.completionRate,
                  dashboardType: 'corporate'
                });
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Taxa de Conclusão</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {metrics.completionRate}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              if (userId) {
                trackEvent('business_dashboard_kpi_viewed', {
                  kpiType: 'remaining_budget',
                  value: metrics.remainingBudget,
                  dashboardType: 'corporate'
                });
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Orçamento Restante</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  ${metrics.remainingBudget.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-amber-600" />
            </div>
          </motion.div>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Department Performance */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Desempenho por Departamento
            </h2>

            <div className="space-y-4">
              {departments.map((dept, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => {
                    if (userId) {
                      trackEvent('business_dashboard_department_viewed', {
                        departmentName: dept.name,
                        users: dept.users,
                        completionRate: dept.completionRate,
                        dashboardType: 'corporate'
                      });
                    }
                  }}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">{dept.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {dept.users} utilizadores
                    </p>
                  </div>
                  <div className="w-32">
                    <div className="w-full bg-slate-300 dark:bg-slate-600 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dept.completionRate}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                        className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                      />
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white w-12">
                    {dept.completionRate}%
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Budget Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Orçamento
            </h2>

            <div className="space-y-6">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Gasto Este Mês</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  ${metrics.monthlySpend.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Limite Mensal</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  ${(metrics.monthlySpend + metrics.remainingBudget).toLocaleString()}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">% Utilizado</p>
                <div className="w-full bg-slate-300 dark:bg-slate-600 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(metrics.monthlySpend / (metrics.monthlySpend + metrics.remainingBudget)) * 100}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
        >
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Atividade Recente
          </h2>

          <div className="space-y-3">
            {recentActivity.map((activity, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg cursor-pointer hover:shadow-sm transition-shadow"
                onClick={() => {
                  if (userId) {
                    trackEvent('business_dashboard_activity_viewed', {
                      activityDate: activity.date,
                      activityType: activity.action.toLowerCase().includes('aula') ? 'course_completion' :
                                   activity.action.toLowerCase().includes('speaking') ? 'speaking_practice' :
                                   'learning_hours',
                      activityCount: activity.count,
                      dashboardType: 'corporate'
                    });
                  }
                }}
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    {activity.date}
                  </p>
                  <p className="text-slate-900 dark:text-white">{activity.action}</p>
                </div>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {activity.count}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleViewReports}
            className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
          >
            <BarChart3 className="w-5 h-5" />
            <span>Ver Relatórios Detalhados</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConfigureTeam}
            className="bg-gradient-to-r from-slate-600 to-slate-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
          >
            <Settings className="w-5 h-5" />
            <span>Configurar Equipas</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
