import React from "react";
import { motion } from "motion/react";
import { Compass, MessageSquare, Rocket, Award } from "lucide-react";

export const ExperienceDashboard = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-8">
      <h1 className="text-3xl font-black text-slate-900">Global Customer Experience Intelligence (GCXI)</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><Compass className="text-indigo-500" /> Jornada</h3>
          <p className="text-slate-600 text-sm">Monitorização de progresso e engajamento.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><MessageSquare className="text-emerald-500" /> Suporte IA</h3>
          <p className="text-slate-600 text-sm">Assistência inteligente e multilingue 24/7.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><Rocket className="text-amber-500" /> Onboarding</h3>
          <p className="text-slate-600 text-sm">Entrada personalizada para sucesso imediato.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><Award className="text-sky-500" /> Fidelização</h3>
          <p className="text-slate-600 text-sm">Programas de lealdade e reconhecimento.</p>
        </div>
      </div>
    </motion.div>
  );
};
