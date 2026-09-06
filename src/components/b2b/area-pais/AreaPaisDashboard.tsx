import React from 'react';
import { ParentPortal } from './ParentPortal';

interface AreaPaisDashboardProps {
  setView: (view: string) => void;
}

export const AreaPaisDashboard: React.FC<AreaPaisDashboardProps> = ({ setView }) => {
  return (
    <div className="w-full">
      <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Portal dos Pais LingoLIVE</h1>
        <button 
          onClick={() => setView('dashboard')}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Voltar ao Onboarding
        </button>
      </div>
      <ParentPortal setView={setView} />
    </div>
  );
};
