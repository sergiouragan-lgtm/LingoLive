import React from "react";
import { motion } from "motion/react";
import { LayoutDashboard, Users, BookOpen, Settings } from "lucide-react";

export const GEOSDashboard = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-8"
    >
      <h1 className="text-3xl font-black text-slate-900">Global Education Operating System (GEOS)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><LayoutDashboard className="text-indigo-500" /> LMS Core</h3>
            <p className="text-slate-600 text-sm">Gestão centralizada de cursos e progresso de aprendizagem.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><Users className="text-emerald-500" /> Gestão de Organizações</h3>
            <p className="text-slate-600 text-sm">Administração multi-tenant para escolas e empresas.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><BookOpen className="text-amber-500" /> Gestão de Conteúdos</h3>
            <p className="text-slate-600 text-sm">Criação e distribuição de materiais educativos.</p>
        </div>
      </div>
    </motion.div>
  );
};
