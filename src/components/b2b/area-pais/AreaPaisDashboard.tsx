import React, { useEffect } from 'react';
import { ParentPortal } from './ParentPortal';
import { auth } from '@/firebase';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useMonitoring } from '@/hooks/useMonitoring';

interface AreaPaisDashboardProps {
  setView: (view: any) => void;
}

export const AreaPaisDashboard: React.FC<AreaPaisDashboardProps> = ({ setView }) => {
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  useEffect(() => {
    if (userId) {
      trackEvent('area_pais_dashboard_viewed', {
        portalName: 'Portal dos Pais',
        portalType: 'parent_portal'
      });
    }
  }, [userId, trackEvent]);

  const handleBackToOnboarding = () => {
    if (userId) {
      trackEvent('area_pais_back_to_onboarding_clicked', {
        portalType: 'parent_portal',
        navigationTarget: 'dashboard'
      });
    }
    setView('dashboard');
  };

  return (
    <div className="w-full">
      <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Portal dos Pais LingoLIVE</h1>
        <button
          onClick={handleBackToOnboarding}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Voltar ao Onboarding
        </button>
      </div>
      <ParentPortal setView={setView} />
    </div>
  );
};
