import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { auth } from "../../../firebase";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { useMonitoring } from "../../../hooks/useMonitoring";
import { Users, Building, Shield, Activity, DollarSign, Brain, Server, Briefcase, Sparkles, Globe, Store, Code, Key, Zap, Settings, Megaphone, Target, TrendingUp } from "lucide-react";
import { ExecutiveAICommandCenter } from "./ExecutiveAICommandCenter";
import { SecurityDashboard } from "../sicp/SecurityDashboard";
import { DevOpsDashboard } from "../dipr/DevOpsDashboard";
import { TalentMarketplace } from "../ltm/TalentMarketplace";
import { LearningPassport } from "../glp/LearningPassport";
import { AIProfileDashboard } from "../alig/AIProfileDashboard";
import { LanguageIntelligenceDashboard } from "../glic/LanguageIntelligenceDashboard";
import { GEOSDashboard } from "../geos/GEOSDashboard";
import { MarketplaceDashboard } from "../gem/MarketplaceDashboard";
import { ExpansionDashboard } from "../gef/ExpansionDashboard";
import { PartnerDashboard } from "../gpn/PartnerDashboard";
import { ComplianceDashboard } from "../gctf/ComplianceDashboard";
import { GDIE_Dashboard } from "../gdie/GDIE_Dashboard";
import { GrowthDashboard } from "../gmgi/GrowthDashboard";
import { GFMI_Dashboard } from "../gfmi/GFMI_Dashboard";
import { ExperienceDashboard } from "../gcxi/ExperienceDashboard";

const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className={`p-3 bg-slate-100 rounded-2xl ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-slate-500 text-sm font-medium">{title}</p>
            <p className="text-2xl font-black text-slate-900">{value}</p>
        </div>
    </div>
);

export const GlobalAdminDashboard = () => {
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  const [activeView, setActiveView] = useState<'dashboard' | 'security' | 'devops' | 'ltm' | 'glp' | 'alig' | 'glic' | 'geos' | 'gem' | 'gef' | 'gpn' | 'gctf' | 'gdie' | 'gfmi' | 'gmgi' | 'gcxi'>('dashboard');

  useEffect(() => {
    if (userId) {
      trackEvent('global_admin_dashboard_viewed', {
        dashboardName: 'Control Center Enterprise',
        dashboardType: 'global_admin_system'
      });
    }
  }, [userId, trackEvent]);

  const handleViewChange = (view: typeof activeView) => {
    setActiveView(view);
    if (userId) {
      trackEvent('admin_view_changed', {
        viewId: view,
        dashboardType: 'global_admin_system',
        viewNames: {
          dashboard: 'Dashboard',
          security: 'Segurança',
          devops: 'DevOps',
          ltm: 'Marketplace',
          glp: 'Passaporte',
          alig: 'ALIG',
          glic: 'GLIC',
          geos: 'GEOS',
          gem: 'GEM',
          gef: 'GEF',
          gpn: 'GPN',
          gctf: 'GCTF',
          gdie: 'GDIE',
          gfmi: 'GFMI',
          gmgi: 'GMGI',
          gcxi: 'GCXI'
        }
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-8"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-black text-slate-900">Control Center Enterprise</h1>
        <div className="flex gap-2">
            <button onClick={() => handleViewChange('dashboard')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeView === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>Dashboard</button>
            <button onClick={() => handleViewChange('security')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeView === 'security' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>Segurança</button>
            <button onClick={() => handleViewChange('devops')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeView === 'devops' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>DevOps</button>
            <button onClick={() => handleViewChange('ltm')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeView === 'ltm' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>Marketplace</button>
            <button onClick={() => handleViewChange('glp')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeView === 'glp' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>Passaporte</button>
            <button onClick={() => handleViewChange('alig')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeView === 'alig' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>ALIG</button>
            <button onClick={() => handleViewChange('glic')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeView === 'glic' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>GLIC</button>
            <button onClick={() => handleViewChange('geos')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeView === 'geos' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>GEOS</button>
            <button onClick={() => handleViewChange('gem')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeView === 'gem' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>GEM</button>
            <button onClick={() => handleViewChange('gef')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeView === 'gef' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>GEF</button>
            <button onClick={() => handleViewChange('gpn')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeView === 'gpn' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>GPN</button>
            <button onClick={() => handleViewChange('gctf')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeView === 'gctf' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>GCTF</button>
            <button onClick={() => handleViewChange('gdie')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeView === 'gdie' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>GDIE</button>
            <button onClick={() => handleViewChange('gfmi')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeView === 'gfmi' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>GFMI</button>
            <button onClick={() => handleViewChange('gmgi')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeView === 'gmgi' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>GMGI</button>
            <button onClick={() => handleViewChange('gcxi')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeView === 'gcxi' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>GCXI</button>
        </div>
        <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Sistema Operacional Online
        </div>
      </div>
      {activeView === 'dashboard' ? (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Utilizadores Ativos" value="1.2M" icon={Users} color="text-blue-600" />
                <StatCard title="Receita Mensal" value="€450K" icon={DollarSign} color="text-emerald-600" />
                <StatCard title="Escolas Ativas" value="1,240" icon={Building} color="text-amber-600" />
                <StatCard title="Estado da IA" value="99.9%" icon={Brain} color="text-indigo-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h2 className="font-bold text-xl mb-6">Monitorização Global</h2>
                </div>
                <ExecutiveAICommandCenter />
            </div>
        </>
      ) : activeView === 'security' ? (
        <SecurityDashboard />
      ) : activeView === 'devops' ? (
        <DevOpsDashboard />
      ) : activeView === 'ltm' ? (
        <TalentMarketplace />
      ) : activeView === 'glp' ? (
        <LearningPassport />
      ) : activeView === 'alig' ? (
        <AIProfileDashboard />
      ) : activeView === 'glic' ? (
        <LanguageIntelligenceDashboard />
      ) : activeView === 'geos' ? (
        <GEOSDashboard />
      ) : activeView === 'gem' ? (
        <MarketplaceDashboard />
      ) : activeView === 'gef' ? (
        <ExpansionDashboard />
      ) : activeView === 'gctf' ? (
        <ComplianceDashboard />
      ) : activeView === 'gdie' ? (
        <GDIE_Dashboard />
      ) : activeView === 'gfmi' ? (
        <GFMI_Dashboard />
      ) : activeView === 'gmgi' ? (
        <GrowthDashboard />
      ) : (
        <ExperienceDashboard />
      )}
    </motion.div>
  );
};
