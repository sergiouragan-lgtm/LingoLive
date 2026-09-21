import React, { useEffect } from 'react';
import { auth } from '../../../firebase';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useMonitoring } from '../../../hooks/useMonitoring';

interface CreateDashboardProps {
  setView?: (view: any) => void;
}

const CreateDashboard: React.FC<CreateDashboardProps> = ({ setView }) => {
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  useEffect(() => {
    if (userId) {
      trackEvent('onboarding_create_dashboard_started', {
        onboardingStep: 'dashboard_initialization'
      });
    }
    if (setView) {
      setView("dashboard");
    }
  }, [setView, userId, trackEvent]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">A carregar o seu Dashboard...</h1>
      <p className="text-slate-500 dark:text-slate-400">A preparar a sua experiência de aprendizagem personalizada LingoLIVE IA.</p>
    </div>
  );
};

export default CreateDashboard;

