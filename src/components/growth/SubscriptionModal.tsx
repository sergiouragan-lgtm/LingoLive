import React, { useEffect } from 'react';
import { auth } from '../../firebase';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useMonitoring } from '../../hooks/useMonitoring';
import SubscriptionCheckout from './assinaturas/SubscriptionCheckout';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  setView: (v: string) => void;
}

export default function SubscriptionModal({ isOpen, onClose, setView }: SubscriptionModalProps) {
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  useEffect(() => {
    if (isOpen && userId) {
      trackEvent('subscription_modal_opened', {});
    }
  }, [isOpen, userId, trackEvent]);

  const handleClose = () => {
    if (userId) {
      trackEvent('subscription_modal_closed', {});
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          Fechar
        </button>
        <SubscriptionCheckout setView={setView} />
      </div>
    </div>
  );
}
