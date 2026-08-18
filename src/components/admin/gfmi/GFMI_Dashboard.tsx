import React from "react";
import { motion } from "motion/react";
import { DollarSign, CreditCard, TrendingUp, Settings } from "lucide-react";

export const GFMI_Dashboard = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-8">
      <h1 className="text-3xl font-black text-slate-900">Global Financial & Monetization Infrastructure (GFMI)</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><DollarSign className="text-emerald-500" /> Pagamentos</h3>
          <p className="text-slate-600 text-sm">Gestão de gateways e moedas globais.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><CreditCard className="text-indigo-500" /> Assinaturas</h3>
          <p className="text-slate-600 text-sm">Gestão de planos e ciclos de faturação.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><TrendingUp className="text-amber-500" /> Receitas</h3>
          <p className="text-slate-600 text-sm">Divisão de receitas e comissões automáticas.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><Settings className="text-sky-500" /> Inteligência</h3>
          <p className="text-slate-600 text-sm">Dashboards e otimização de preços por IA.</p>
        </div>
      </div>
    </motion.div>
  );
};
