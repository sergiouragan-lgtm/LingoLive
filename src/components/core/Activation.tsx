import React, { useEffect } from 'react';
import { AppView } from '../../types';
import { auth } from '../../firebase';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useMonitoring } from '../../hooks/useMonitoring';

export const Activation: React.FC<{ setView: (view: AppView) => void }> = ({ setView }) => {
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  useEffect(() => {
    if (userId) {
      trackEvent('activation_screen_viewed', {
        step: 'initial_activation'
      });
    }
  }, [userId, trackEvent]);

  const handleStartClick = () => {
    if (userId) {
      trackEvent('activation_start_clicked', {
        step: 'initial_activation'
      });
    }
    setView('dashboard');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
        <h2 className="text-3xl font-bold mb-6">Bem-vindo!</h2>
        <p className="mb-8">Vamos aprender sua primeira frase em inglês.</p>
        <button onClick={handleStartClick} className="bg-primary text-white px-8 py-3 rounded-full font-semibold">Iniciar Agora</button>
    </div>
  );
};
