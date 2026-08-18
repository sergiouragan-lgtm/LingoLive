import React, { useState, useEffect } from "react";
import { ArrowLeft, BookOpen, AlertTriangle, CheckCircle, Save } from "lucide-react";
import { motion } from "motion/react";
import { LanguagePolicy, ReviewConflict, ApprovalRequest } from "../../../types/glap";
import { fetchActiveDialectReviews, updateLanguagePolicy, resolveConflict } from "../../../services/glapService";

interface CouncilPortalProps {
  onBack: () => void;
}

export const CouncilPortal: React.FC<CouncilPortalProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'policies' | 'conflicts' | 'approvals'>('policies');
  const [policies, setPolicies] = useState<LanguagePolicy[]>([]);
  const [conflicts, setConflicts] = useState<ReviewConflict[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (activeTab === 'approvals') {
        const data = await fetchActiveDialectReviews();
        setApprovals(data);
      }
    };
    fetchData();
  }, [activeTab]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para GLAP
      </button>

      <div className="bg-slate-900 p-8 rounded-3xl border border-slate-700 shadow-2xl text-white">
        <h2 className="text-2xl font-black mb-6">Council Portal - Área Administrativa</h2>
        
        <div className="flex gap-4 mb-8">
          {[
            { id: 'policies', label: 'Language Policy Management', icon: BookOpen },
            { id: 'conflicts', label: 'Conflict Resolution Queue', icon: AlertTriangle },
            { id: 'approvals', label: 'Dialect/Cultural Review', icon: CheckCircle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
          {activeTab === 'policies' && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg mb-4">Language Policy Management</h3>
              <p className="text-slate-400 text-sm">Atualize as diretrizes oficiais de validação e normas de qualidade.</p>
              <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold">
                <Save className="w-4 h-4" /> Guardar Alterações
              </button>
            </div>
          )}
          {activeTab === 'conflicts' && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg mb-4">Conflict Resolution Queue</h3>
              <p className="text-slate-400 text-sm">Audite e resolva disputas entre revisores sobre conteúdos específicos.</p>
            </div>
          )}
          {activeTab === 'approvals' && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg mb-4">Dialect/Cultural Review</h3>
              <p className="text-slate-400 text-sm">Valide propostas de novos dialetos e atualizações culturais.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
