import React, { useState } from "react";
import { motion } from "motion/react";
import { Shield, Lock, Eye, AlertTriangle } from "lucide-react";
import { SOCDashboard } from "./SOCDashboard";
import { TrustCenter } from "./TrustCenter";

export const SecurityDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'soc' | 'trust'>('overview');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-8"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900">Security, Identity & Compliance</h1>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeTab === 'overview' ? 'bg-white shadow-sm' : ''}`}>Overview</button>
            <button onClick={() => setActiveTab('soc')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeTab === 'soc' ? 'bg-white shadow-sm' : ''}`}>SOC</button>
            <button onClick={() => setActiveTab('trust')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeTab === 'trust' ? 'bg-white shadow-sm' : ''}`}>Trust Center</button>
        </div>
      </div>
      
      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard title="Incidentes Ativos" value="0" icon={AlertTriangle} color="text-red-600" />
            <StatCard title="Compliance Score" value="98%" icon={Shield} color="text-emerald-600" />
            <StatCard title="Sessões Ativas" value="45.2K" icon={Lock} color="text-indigo-600" />
            <StatCard title="Logs de Auditoria" value="1.2M/d" icon={Eye} color="text-slate-600" />
        </div>
      ) : activeTab === 'soc' ? (
        <SOCDashboard />
      ) : (
        <TrustCenter />
      )}
    </motion.div>
  );
};

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
