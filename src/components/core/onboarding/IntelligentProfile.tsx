import React from 'react';
import { useOnboardingFlow } from '../../../context/OnboardingFlowContext';

const IntelligentProfile = () => {
  const { setStep, setProfileData } = useOnboardingFlow();

  const handleCreateProfile = () => {
    // Simulating profile data creation
    setProfileData({
      uid: "user123",
      profile: {
        name: "João",
        age: 12,
        level: "beginner",
        learningGoals: ["conversation", "school"]
      },
      intelligentProfile: {
        learningStyle: "visual",
        recommendedLevel: "A1",
        dailyGoal: 15,
        aiTutorMode: "child",
        preferredActivities: ["games", "conversation"]
      },
      status: {
        profileCreated: true,
        paymentStatus: "pending"
      }
    });
    setStep("PAYMENT_REQUIRED");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Criar Perfil Inteligente</h1>
      <p className="mb-6">Vamos personalizar a sua jornada LingoLIVE IA.</p>
      <button 
        onClick={handleCreateProfile}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Prosseguir
      </button>
    </div>
  );
};

export default IntelligentProfile;
