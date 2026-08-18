import React from "react";
import { Briefcase, UserCheck, Star } from "lucide-react";

export interface JobOpportunity {
    id: string;
    title: string;
    company: string;
    skills: string[];
}

export const TalentMarketplace = () => {
    return (
        <div className="p-8 space-y-6">
            <h1 className="text-3xl font-black text-slate-900">Talent Marketplace</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold mb-4">Vagas Recomendadas</h3>
                    <div className="space-y-3">
                        <div className="p-3 bg-slate-50 rounded-lg">
                            <p className="font-bold text-sm">Senior AI Engineer</p>
                            <p className="text-xs text-slate-500">Tech Corp</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
