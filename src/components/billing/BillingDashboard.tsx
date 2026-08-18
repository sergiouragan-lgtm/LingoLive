import React, { useState } from 'react';
import { navigateToExternalCheckout } from '../../utils/navigationUtils';

export const BillingDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (planId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const session = await response.json();
      
      if (session.url) {
        navigateToExternalCheckout(session.url);
      } else {
        throw new Error('Checkout session URL missing');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    { id: 'basic', name: 'Basic', price: '$10/mo' },
    { id: 'premium', name: 'Premium', price: '$20/mo' },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Subscription Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold">{plan.name}</h3>
            <p className="text-gray-600 mb-4">{plan.price}</p>
            <button
              onClick={() => handleCheckout(plan.id)}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Subscribe'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
