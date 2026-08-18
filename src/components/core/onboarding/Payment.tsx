import React from 'react';
import { useOnboardingFlow } from '../../../context/OnboardingFlowContext';

const Payment = () => {
  const { setStep } = useOnboardingFlow();

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Pagamento</h1>
      <p className="mb-6">Escolha o seu plano para ativar a conta.</p>
      <button 
        onClick={() => setStep("PAYMENT_SUCCESS")}
        className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
      >
        Confirmar Pagamento
      </button>
    </div>
  );
};

export default Payment;
