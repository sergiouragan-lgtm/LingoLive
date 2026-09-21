import React, { useEffect } from 'react';
import { useOnboardingFlow } from '../../../context/OnboardingFlowContext';
import { auth } from '../../../firebase';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useMonitoring } from '../../../hooks/useMonitoring';

const ConfirmCreation = () => {
  const { setStep } = useOnboardingFlow();
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  useEffect(() => {
    if (userId) {
      trackEvent('onboarding_confirm_creation_viewed', {
        onboardingStep: 'profile_confirmation'
      });
    }
  }, [userId, trackEvent]);

  const handleProceedToPayment = () => {
    if (userId) {
      trackEvent('onboarding_confirmed_to_payment', {
        onboardingStep: 'profile_confirmation_to_payment'
      });
    }
    setStep("PAYMENT");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Confirmar Criação</h1>
      <p className="mb-6">O seu perfil foi criado com sucesso.</p>
      <button
        onClick={handleProceedToPayment}
        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
      >
        Ir para Pagamento
      </button>
    </div>
  );
};

export default ConfirmCreation;
