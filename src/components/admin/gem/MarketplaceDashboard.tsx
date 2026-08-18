import React from "react";
import { motion } from "motion/react";
import { Store, ShoppingBag, Users, TrendingUp } from "lucide-react";

export const MarketplaceDashboard = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-8"
    >
      <h1 className="text-3xl font-black text-slate-900">Global Education Marketplace (GEM)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><Store className="text-indigo-500" /> Marketplace</h3>
            <p className="text-slate-600 text-sm">Gestão de cursos e experiências educacionais.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><Users className="text-emerald-500" /> Parceiros</h3>
            <p className="text-slate-600 text-sm">Rede global de escolas e criadores certificados.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><TrendingUp className="text-amber-500" /> Transações</h3>
            <p className="text-slate-600 text-sm">Ecossistema financeiro e divisão de receitas.</p>
        </div>
      </div>
    </motion.div>
  );
};
