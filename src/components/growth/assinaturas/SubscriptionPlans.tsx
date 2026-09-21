import React, { useEffect } from 'react';
import { auth } from '../../../firebase';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useMonitoring } from '../../../hooks/useMonitoring';

const plans = [
  { name: 'Free', price: 'Gratuito' },
  { name: 'Starter', price: 'USD 9,90/mês' },
  { name: 'Premium', price: 'USD 19,90/mês' },
  { name: 'Family', price: 'USD 34,90/mês' },
  { name: 'School Basic', price: 'USD 149/mês' },
  { name: 'School Plus', price: 'USD 399/mês' },
  { name: 'Enterprise', price: 'Sob consulta' },
];

export const SubscriptionPlans: React.FC = () => {
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  useEffect(() => {
    if (userId) {
      trackEvent('subscription_plans_displayed', {
        totalPlans: plans.length
      });
    }
  }, [userId, trackEvent]);

  const handlePlanSelect = (planName: string, price: string) => {
    if (userId) {
      trackEvent('subscription_plan_selected', {
        planName,
        price
      });
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-heading font-bold text-slate-900 mb-8">Planos de Subscrição</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div key={plan.name} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-heading font-semibold text-slate-800">{plan.name}</h3>
            <p className="text-2xl font-bold text-primary mt-4">{plan.price}</p>
            <button
              onClick={() => handlePlanSelect(plan.name, plan.price)}
              className="w-full mt-6 bg-primary text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Selecionar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
