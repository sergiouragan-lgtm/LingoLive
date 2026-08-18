import React from 'react';
import { useOnboardingFlow } from '../../../context/OnboardingFlowContext';
import { db } from '../../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface ActivateAccountProps {
  user: User | null;
}

const ActivateAccount = ({ user }: ActivateAccountProps) => {
  const { setStep } = useOnboardingFlow();

  const handleActivate = async () => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        status: 'ACTIVE',
        'accountStatus.paymentStatus': 'PAID',
        updatedAt: new Date()
      });
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
