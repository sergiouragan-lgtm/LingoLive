import React from "react";
import { Sparkles, Users, Shield, Globe, Target } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { CouncilPortal } from "./CouncilPortal";

export const GlapModule = () => {
  const [showCouncil, setShowCouncil] = useState(false);

  if (showCouncil) {
    return <CouncilPortal onBack={() => setShowCouncil(false)} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="bg-indigo-900 p-8 rounded-3xl border border-indigo-800 shadow-2xl text-white">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-indigo-300" />
          </div>
          <div>
            <h2 className="text-3xl font-black">Global Language Ambassadors Platform (GLAP)</h2>
            <p className="text-indigo-200 font-medium">Programa Global de Embaixadores Linguísticos - Enterprise v1.0</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-indigo-800/50 p-6 rounded-2xl">
            <h3 className="font-bold mb-2 flex items-center gap-2"><Target className="w-5 h-5" /> Objetivo</h3>
            <p className="text-sm text-indigo-200">Definir e implementar o pilar humano de validação linguística e cultural da LingoLIVE IA.</p>
          </div>
          <div className="bg-indigo-800/50 p-6 rounded-2xl">
            <h3 className="font-bold mb-2 flex items-center gap-2"><Users className="w-5 h-5" /> Missão</h3>
            <p className="text-sm text-indigo-200">Recrutar, verificar e certificar falantes nativos para garantir autenticidade global.</p>
          </div>
          <div className="bg-indigo-800/50 p-6 rounded-2xl">
            <h3 className="font-bold mb-2 flex items-center gap-2"><Shield className="w-5 h-5" /> Princípios</h3>
            <p className="text-sm text-indigo-200">Community by Design, Native First, Cultural Authenticity, e Segurança by Design.</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Processo de Candidatura</h3>
              <p className="text-slate-500 text-sm">O GLAP simplifica a entrada de novos talentos linguísticos com verificação de identidade automatizada, testes linguísticos e culturais validados por IA.</p>
          </div>
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Certificação Oficial</h3>
              <p className="text-slate-500 text-sm">Emissão de certificados digitais rastreáveis com identificador único, garantindo a qualificação técnica dos nossos embaixadores.</p>
          </div>
          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 shadow-sm md:col-span-2 cursor-pointer hover:bg-indigo-100 transition-colors" onClick={() => setShowCouncil(true)}>
            <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5" /> Council Portal (Restrito)
            </h3>
            <p className="text-indigo-700 text-sm">Gerir políticas linguísticas, resolver conflitos e aprovar novos conteúdos para Embaixadores Sénior.</p>
          </div>
      </div>
    </motion.div>
  );
};
