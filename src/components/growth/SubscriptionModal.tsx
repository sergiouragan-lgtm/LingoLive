import React from 'react';
import { SubscriptionCheckout } from './assinaturas/SubscriptionCheckout';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  setView: (v: string) => void;
}

export function SubscriptionModal({ isOpen, onClose, setView }: SubscriptionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          Fechar
        </button>
        <SubscriptionCheckout setView={setView} />
      </div>
    </div>
  );
}
