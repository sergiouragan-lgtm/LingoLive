import React from "react";
import { motion } from "motion/react";
import { Building2, UserPlus, BarChart, ShieldCheck } from "lucide-react";

export const PartnerDashboard = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-8"
    >
      <h1 className="text-3xl font-black text-slate-900">Global Partnership Network (GPN)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><Building2 className="text-indigo-500" /> Parceiros Ativos</h3>
            <p className="text-slate-600 text-sm">Gestão da rede global de instituições.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><UserPlus className="text-emerald-500" /> Onboarding</h3>
            <p className="text-slate-600 text-sm">Aprovação e integração de novos membros.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><BarChart className="text-amber-500" /> Performance</h3>
            <p className="text-slate-600 text-sm">Monitorização de métricas e receita.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><ShieldCheck className="text-sky-500" /> Certificação</h3>
            <p className="text-slate-600 text-sm">Níveis de parceria e conformidade.</p>
        </div>
      </div>
    </motion.div>
  );
};
