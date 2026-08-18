import React from "react";
import { MessageSquare } from "lucide-react";
import { ExecutiveAIChat } from "./ExecutiveAIChat";

export const ExecutiveAICommandCenter = () => {
  return (
    <div className="bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-700">
      <h3 className="text-white font-bold flex items-center gap-2 mb-4">
        <MessageSquare className="text-indigo-400" /> Executive AI Command Center
      </h3>
      <ExecutiveAIChat />
    </div>
  );
};
