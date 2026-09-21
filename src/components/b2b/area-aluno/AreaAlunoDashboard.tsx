import React, { useEffect } from 'react';
import { StudentPortal } from '../../learning/StudentPortal';
import { auth } from '../../../firebase';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useMonitoring } from '../../../hooks/useMonitoring';

interface AreaAlunoDashboardProps {
  setView: (view: any) => void;
}

export const AreaAlunoDashboard: React.FC<AreaAlunoDashboardProps> = ({ setView }) => {
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  // Lifecycle tracking
  useEffect(() => {
    if (userId) {
      trackEvent('area_aluno_dashboard_accessed', {
        userEmail: auth.currentUser?.email || '',
      });
    }
  }, [userId, trackEvent]);

  const handleNavigateBack = () => {
    if (userId) {
      trackEvent('area_aluno_navigate_back', {
        targetView: 'dashboard',
      });
    }
    setView('dashboard');
  };

  return (
    <div className="w-full">
      <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Portal do Aluno LingoLIVE</h1>
        <button
          onClick={handleNavigateBack}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Voltar ao Onboarding
        </button>
      </div>
      <StudentPortal setView={setView} />
    </div>
  );
};
