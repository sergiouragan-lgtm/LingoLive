import React from "react";
import { motion } from "motion/react";
import { Megaphone, Users, Target, TrendingUp } from "lucide-react";

export const GrowthDashboard = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-8">
      <h1 className="text-3xl font-black text-slate-900">Global Marketing & Growth Intelligence (GMGI)</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><Megaphone className="text-indigo-500" /> Campanhas</h3>
          <p className="text-slate-600 text-sm">Gestão e otimização de campanhas por IA.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><Users className="text-emerald-500" /> Segmentação</h3>
          <p className="text-slate-600 text-sm">Análise de comportamento e preferências.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><Target className="text-amber-500" /> Experiências</h3>
          <p className="text-slate-600 text-sm">Testes de crescimento e otimização.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><TrendingUp className="text-sky-500" /> Analytics</h3>
          <p className="text-slate-600 text-sm">Inteligência de mercado e ROI.</p>
        </div>
      </div>
    </motion.div>
  );
};
