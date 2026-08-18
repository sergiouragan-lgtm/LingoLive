import React from "react";
import { motion } from "motion/react";
import { CheckCircle, Clock, XCircle } from "lucide-react";

export const DevOpsPipeline = () => {
  const pipelines = [
    { name: "Frontend CI", status: "success" },
    { name: "Backend CI", status: "success" },
    { name: "E2E Tests", status: "running" },
    { name: "Production Deploy", status: "pending" },
  ];

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
      <h3 className="font-bold text-lg">Pipeline CI/CD</h3>
      {pipelines.map(p => (
        <div key={p.name} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="font-medium text-slate-700">{p.name}</span>
            {p.status === 'success' && <CheckCircle className="text-emerald-500 w-5 h-5" />}
            {p.status === 'running' && <Clock className="text-amber-500 w-5 h-5 animate-spin" />}
            {p.status === 'pending' && <div className="w-5 h-5 rounded-full bg-slate-200"></div>}
        </div>
      ))}
    </div>
  );
};
