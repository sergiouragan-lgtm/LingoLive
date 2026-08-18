import React from "react";
import { Mic } from "lucide-react";

export const SpeechIntelligenceMonitor = () => {
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><Mic className="text-indigo-500" /> Speech Intelligence</h3>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                <Mic className="text-slate-400" />
                <div>
                    <p className="font-bold text-sm">Monitorização de Voz</p>
                    <p className="text-xs text-slate-500">Analise de pronúncia e fluência em tempo real ativa.</p>
                </div>
            </div>
        </div>
    );
};
