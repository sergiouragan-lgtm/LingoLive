import React from 'react';
import { useOnboardingFlow } from '../../../context/OnboardingFlowContext';

const ConfirmCreation = () => {
  const { setStep } = useOnboardingFlow();

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Confirmar Criação</h1>
      <p className="mb-6">O seu perfil foi criado com sucesso.</p>
      <button 
        onClick={() => setStep("PAYMENT")}
        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
      >
        Ir para Pagamento
      </button>
    </div>
  );
};

export default ConfirmCreation;
