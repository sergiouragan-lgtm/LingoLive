import React from "react";
import { motion } from "motion/react";
import { Activity, Brain, AlertOctagon } from "lucide-react";

export const SOCDashboard = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-6"
    >
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <Activity className="text-indigo-400" /> Security Operations Center (SOC)
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <h3 className="text-slate-400 text-xs font-semibold uppercase mb-2">Threat Intelligence</h3>
            <p className="text-white text-sm">Monitorização de ameaças 24/7 ativa.</p>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <h3 className="text-slate-400 text-xs font-semibold uppercase mb-2">AI Event Correlation</h3>
            <p className="text-white text-sm">Motor de correlação autónoma operacional.</p>
        </div>
      </div>
    </motion.div>
  );
};
