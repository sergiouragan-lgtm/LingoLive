import React from "react";
import { motion } from "motion/react";
import { Brain, TrendingUp, AlertCircle } from "lucide-react";

export const AIProfileDashboard = () => {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-black text-slate-900">AI Learning Intelligence Graph</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><Brain className="text-indigo-500" /> Perfil de Aprendizagem</h3>
            <p className="text-slate-600 text-sm">Modelo cognitivo: <span className="font-bold text-slate-900">Visual/Analítico</span></p>
            <div className="flex gap-2">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">Retenção Alta</span>
                <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full">Desafios Complexos</span>
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><TrendingUp className="text-emerald-500" /> Previsão de Evolução</h3>
            <p className="text-slate-600 text-sm">O aluno está pronto para progredir 15% mais rápido no módulo de Negócios.</p>
        </div>
      </div>
    </div>
  );
};
