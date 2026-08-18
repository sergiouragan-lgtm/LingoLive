import React from "react";
import { motion } from "motion/react";
import { Code, Key, Zap, Settings } from "lucide-react";

export const GDIE_Dashboard = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-8">
      <h1 className="text-3xl font-black text-slate-900">Global Developer & Innovation Ecosystem (GDIE)</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><Code className="text-indigo-500" /> Developer Portal</h3>
          <p className="text-slate-600 text-sm">Documentação, SDKs e console de gestão.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><Key className="text-emerald-500" /> APIs & Keys</h3>
          <p className="text-slate-600 text-sm">Gestão de acesso, chaves de API e permissões.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><Zap className="text-amber-500" /> Integrações</h3>
          <p className="text-slate-600 text-sm">Hub de integração com sistemas educacionais.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><Settings className="text-sky-500" /> Inovação</h3>
          <p className="text-slate-600 text-sm">Labs, parcerias e certificação de apps.</p>
        </div>
      </div>
    </motion.div>
  );
};
