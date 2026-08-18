import React from "react";
import { motion } from "motion/react";
import { ShieldCheck, Lock, FileText, Scale } from "lucide-react";

export const ComplianceDashboard = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-8">
      <h1 className="text-3xl font-black text-slate-900">Global Compliance & Trust Framework (GCTF)</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><ShieldCheck className="text-indigo-500" /> Compliance</h3>
          <p className="text-slate-600 text-sm">Conformidade regulamentar e auditoria.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><Lock className="text-emerald-500" /> Privacidade</h3>
          <p className="text-slate-600 text-sm">Gestão de consentimentos e proteção de dados.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><FileText className="text-amber-500" /> Auditoria</h3>
          <p className="text-slate-600 text-sm">Registo e monitorização de eventos.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><Scale className="text-sky-500" /> Governança IA</h3>
          <p className="text-slate-600 text-sm">Transparência e ética na IA.</p>
        </div>
      </div>
    </motion.div>
  );
};
