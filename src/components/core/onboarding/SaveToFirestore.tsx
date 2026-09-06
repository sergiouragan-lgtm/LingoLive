import React from 'react';
import { useOnboardingFlow } from '../../../context/OnboardingFlowContext';

export const SaveToFirestore = () => {
  const { setStep } = useOnboardingFlow();

  const handleSave = () => {
    // Simulate API call to Firestore
    console.log("Saving to Firestore...");
    setStep("CONFIRM_CREATION");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Guardar no Firestore</h1>
      <p className="mb-6">Estamos a guardar os seus dados de forma segura.</p>
      <button 
        onClick={handleSave}
        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
      >
        Guardar
      </button>
    </div>
  );
};

