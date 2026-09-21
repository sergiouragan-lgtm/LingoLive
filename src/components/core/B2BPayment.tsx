import React, { useEffect } from 'react';
import { CreditCard, CheckCircle } from 'lucide-react';
import { auth } from '../../firebase';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useMonitoring } from '../../hooks/useMonitoring';

export const B2BPayment: React.FC<{onPaymentConfirmed: () => void}> = ({ onPaymentConfirmed }) => {
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  useEffect(() => {
    if (userId) {
      trackEvent('b2b_payment_viewed', {
        paymentType: 'school_activation'
      });
    }
  }, [userId, trackEvent]);

  const handlePaymentConfirm = () => {
    if (userId) {
      trackEvent('b2b_payment_confirmed', {
        paymentType: 'school_activation',
        status: 'initiated'
      });
    }
    onPaymentConfirmed();
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mt-10 text-center">
      <h2 className="text-2xl font-bold mb-6 flex items-center justify-center gap-2 text-slate-900">
        <CreditCard className="text-indigo-600" /> Pagamento B2B
      </h2>
      <p className="mb-6 text-slate-600">Complete o pagamento para ativar a sua conta escolar.</p>
      <button onClick={handlePaymentConfirm} className="w-full bg-green-600 text-white p-3 rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2">
        <CheckCircle /> Confirmar Pagamento
      </button>
    </div>
  );
};
