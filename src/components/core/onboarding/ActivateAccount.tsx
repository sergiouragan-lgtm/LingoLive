import React, { useEffect } from 'react';
import { useOnboardingFlow } from '../../../context/OnboardingFlowContext';
import { auth, db } from '../../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useMonitoring } from '../../../hooks/useMonitoring';

interface ActivateAccountProps {
  user: User | null;
}

const ActivateAccount = ({ user }: ActivateAccountProps) => {
  const { setStep } = useOnboardingFlow();
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  useEffect(() => {
    if (userId) {
      trackEvent('onboarding_activate_account_viewed', {
        onboardingStep: 'account_activation',
        hasUser: !!user
      });
    }
  }, [userId, user, trackEvent]);

  const handleActivate = async () => {
    if (userId) {
      trackEvent('onboarding_account_activation_started', {
        userId: user?.uid,
        onboardingStep: 'account_activation'
      });
    }
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          status: 'ACTIVE',
          'accountStatus.paymentStatus': 'PAID',
          updatedAt: new Date()
        });
        if (userId) {
          trackEvent('onboarding_account_activated', {
            userId: user.uid,
            success: true
          });
        }
      } catch (error) {
        if (userId) {
          trackEvent('onboarding_account_activation_failed', {
            userId: user.uid,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }
    setStep("DASHBOARD");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Ativar Conta</h1>
      <p className="mb-6">A sua conta foi ativada com sucesso!</p>
      <button 
        onClick={handleActivate}
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
      >
        Ir para Dashboard
      </button>
    </div>
  );
};

export default ActivateAccount;
