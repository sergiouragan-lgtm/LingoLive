import React, { useEffect } from 'react';
import { useOnboardingFlow } from '../../../context/OnboardingFlowContext';
import { auth } from '../../../firebase';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useMonitoring } from '../../../hooks/useMonitoring';

const Payment = () => {
  const { setStep } = useOnboardingFlow();
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  useEffect(() => {
    if (userId) {
      trackEvent('onboarding_payment_viewed', {
        onboardingStep: 'payment_selection'
      });
    }
  }, [userId, trackEvent]);

  const handlePaymentConfirm = () => {
    if (userId) {
      trackEvent('onboarding_payment_confirmed', {
        onboardingStep: 'payment_selection_to_success'
      });
    }
    setStep("PAYMENT_SUCCESS");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Pagamento</h1>
      <p className="mb-6">Escolha o seu plano para ativar a conta.</p>
      <button
        onClick={handlePaymentConfirm}
        className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
      >
        Confirmar Pagamento
      </button>
    </div>
  );
};

export default Payment;
