import React from 'react';
import { CreditCard, CheckCircle } from 'lucide-react';

export const B2BPayment: React.FC<{onPaymentConfirmed: () => void}> = ({ onPaymentConfirmed }) => {
  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mt-10 text-center">
      <h2 className="text-2xl font-bold mb-6 flex items-center justify-center gap-2 text-slate-900">
        <CreditCard className="text-indigo-600" /> Pagamento B2B
      </h2>
      <p className="mb-6 text-slate-600">Complete o pagamento para ativar a sua conta escolar.</p>
      <button onClick={onPaymentConfirmed} className="w-full bg-green-600 text-white p-3 rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2">
        <CheckCircle /> Confirmar Pagamento
      </button>
    </div>
  );
};
