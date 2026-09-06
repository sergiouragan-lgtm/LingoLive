import React from 'react';
import { StudentPortal } from '../../learning/StudentPortal';

interface AreaAlunoDashboardProps {
  setView: (view: string) => void;
}

export const AreaAlunoDashboard: React.FC<AreaAlunoDashboardProps> = ({ setView }) => {
  return (
    <div className="w-full">
      <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Portal do Aluno LingoLIVE</h1>
        <button 
          onClick={() => setView('dashboard')}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Voltar ao Onboarding
        </button>
      </div>
      <StudentPortal setView={setView} />
    </div>
  );
};
