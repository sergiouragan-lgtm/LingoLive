import React from 'react';
import { useLocalization } from '../../context/LocalizationContext';

export function LandingPage({ onSelectPlan }: { onSelectPlan: (plan: string) => void }) {
  const { setLocalization, localization, t } = useLocalization();
  const plans = [
    { id: 'test', name: 'Plano de Teste', price: 0 },
    { id: 'individual', name: 'Professor Individual', price: 10000 },
    { id: 'school', name: 'Escola', price: 100000 }
  ];

  const toggleLanguage = () => {
    const newLang = localization.language === 'en' ? 'pt' : 'en';
    setLocalization({ ...localization, language: newLang });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-slate-50">
      <div className="absolute top-4 right-4">
        <button 
          onClick={toggleLanguage}
          className="px-4 py-2 bg-slate-200 rounded-lg text-sm font-medium hover:bg-slate-300"
        >
          {localization.language === 'en' ? 'PT' : 'EN'}
        </button>
      </div>
      <h1 className="text-4xl font-bold mb-8">{localization.language === 'en' ? 'Choose your plan' : 'Escolha seu plano'}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map(plan => (
          <div key={plan.id} className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
            <h2 className="text-2xl font-bold mb-4">{plan.name}</h2>
            <p className="text-xl font-semibold mb-6">
              {plan.price === 0 ? (localization.language === 'en' ? 'Free' : 'Grátis') : `${plan.price.toLocaleString(localization.language === 'en' ? 'en-US' : 'pt-AO', { style: 'currency', currency: localization.currency })}/mês`}
            </p>
            <button 
              onClick={() => onSelectPlan(plan.id)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
            >
              {localization.language === 'en' ? 'Select' : 'Selecionar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
