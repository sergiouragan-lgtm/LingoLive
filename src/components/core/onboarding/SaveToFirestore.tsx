import React, { useEffect } from 'react';
import { useOnboardingFlow } from '../../../context/OnboardingFlowContext';
import { auth } from '../../../firebase';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useMonitoring } from '../../../hooks/useMonitoring';

const SaveToFirestore = () => {
  const { setStep } = useOnboardingFlow();
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  useEffect(() => {
    if (userId) {
      trackEvent('onboarding_save_to_firestore_viewed', {
        onboardingStep: 'data_persistence'
      });
    }
  }, [userId, trackEvent]);

  const handleSave = () => {
    if (userId) {
      trackEvent('onboarding_firestore_save_started', {
        onboardingStep: 'data_persistence'
      });
    }
    // Simulate API call to Firestore
    console.log("Saving to Firestore...");
    if (userId) {
      trackEvent('onboarding_firestore_save_completed', {
        onboardingStep: 'data_persistence',
        success: true
      });
    }
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

export default SaveToFirestore;
