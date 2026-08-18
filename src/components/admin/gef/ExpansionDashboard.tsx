import React from "react";
import { motion } from "motion/react";
import { Globe, Map, Languages } from "lucide-react";

export const ExpansionDashboard = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-8"
    >
      <h1 className="text-3xl font-black text-slate-900">Global Expansion Framework (GEF)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><Globe className="text-indigo-500" /> Regiões Ativas</h3>
            <p className="text-slate-600 text-sm">Gestão estratégica de expansão global.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><Map className="text-emerald-500" /> Inteligência de Mercado</h3>
            <p className="text-slate-600 text-sm">Análise de dados para novos mercados.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><Languages className="text-amber-500" /> Engine de Localização</h3>
            <p className="text-slate-600 text-sm">Adaptação automática de conteúdos e cultura.</p>
        </div>
      </div>
    </motion.div>
  );
};
