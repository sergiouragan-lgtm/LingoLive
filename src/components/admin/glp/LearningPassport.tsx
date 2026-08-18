import React from "react";
import { motion } from "motion/react";
import { Award, Languages, Brain } from "lucide-react";

export const LearningPassport = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-8"
    >
      <h1 className="text-3xl font-black text-slate-900">Global Learning Passport</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm col-span-2">
            <h2 className="font-bold text-xl mb-4 flex items-center gap-2"><Languages className="text-indigo-500" /> Perfil Linguístico</h2>
            <div className="space-y-4">
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="font-medium">Inglês</span>
                    <span className="text-indigo-600 font-bold">C1 - Avançado</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="font-medium">Português</span>
                    <span className="text-emerald-600 font-bold">C2 - Nativo</span>
                </div>
            </div>
        </div>
        
        <div className="bg-slate-950 p-6 rounded-3xl text-white shadow-xl">
            <h2 className="font-bold text-xl mb-4 flex items-center gap-2"><Award className="text-amber-400" /> Credenciais</h2>
            <p className="text-slate-400 text-sm">Carteira digital verificável</p>
            <div className="mt-4 p-4 bg-slate-900 rounded-xl border border-slate-800">
                <p className="font-bold text-sm">English Professional B2</p>
                <p className="text-xs text-slate-500">Emitido por LingoLIVE IA</p>
            </div>
        </div>
      </div>
    </motion.div>
  );
};
