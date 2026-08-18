import React from "react";
import { motion } from "motion/react";
import { Server, Activity, GitCommit, AlertTriangle } from "lucide-react";
import { DevOpsPipeline } from "./DevOpsPipeline";

export const DevOpsDashboard = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-8"
    >
      <h1 className="text-3xl font-black text-slate-900">DevOps, Infrastructure & Reliability</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Deployments (24h)" value="12" icon={GitCommit} color="text-blue-600" />
        <StatCard title="Uptime (Production)" value="99.99%" icon={Server} color="text-emerald-600" />
        <StatCard title="Latência Média" value="45ms" icon={Activity} color="text-indigo-600" />
        <StatCard title="Incidentes SRE" value="0" icon={AlertTriangle} color="text-amber-600" />
      </div>
      <DevOpsPipeline />
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
