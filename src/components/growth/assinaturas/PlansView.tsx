import React from 'react';
import { CreditCard, Check } from 'lucide-react';

const PLANS = [
  { name: 'Free', price: '0', features: ['Core Features', 'Limited Access'] },
  { name: 'Starter', price: '9.99', features: ['All Free features', 'Full Learning Path'] },
  { name: 'Premium', price: '19.99', features: ['All Starter features', 'AI Tutor Access'] },
  { name: 'Family', price: '29.99', features: ['Up to 5 profiles', 'All Premium features'] },
  { name: 'School Basic', price: '99.00', features: ['For Schools', 'Management Dashboard'] },
  { name: 'School Pro', price: '199.00', features: ['All School Basic', 'Advanced Analytics'] },
  { name: 'Enterprise', price: 'Custom', features: ['Custom Implementation', 'Dedicated Support'] },
];

export const PlansView: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Planos e Assinaturas</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div key={plan.name} className="bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-xl font-bold">{plan.name}</h2>
            <p className="text-3xl font-bold">${plan.price}<span className="text-sm font-normal text-gray-500">/mo</span></p>
            <ul className="space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-green-500" /> {feature}
                </li>
              ))}
            </ul>
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700">
              Escolher Plano
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
