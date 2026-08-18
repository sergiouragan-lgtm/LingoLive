import React from "react";
import { motion } from "motion/react";
import { Sparkles, BookOpen } from "lucide-react";

export const LearningRecommendations = () => {
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><Sparkles className="text-amber-500" /> Recomendações da IA</h3>
            <div className="space-y-3">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <BookOpen className="text-slate-400" />
                    <div>
                        <p className="font-bold text-sm">Prática de Negociação</p>
                        <p className="text-xs text-slate-500">Baseado no seu progresso recente.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
