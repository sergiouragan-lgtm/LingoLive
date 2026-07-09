import React from 'react';

export default function LandingPage({ onSelectPlan }: { onSelectPlan: (plan: string) => void }) {
  const plans = [
    { id: 'test', name: 'Plano de Teste', price: 0 },
    { id: 'individual', name: 'Professor Individual', price: 10000 },
    { id: 'school', name: 'Escola', price: 100000 }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-slate-50">
      <h1 className="text-4xl font-bold mb-8">Escolha seu plano</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map(plan => (
          <div key={plan.id} className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
            <h2 className="text-2xl font-bold mb-4">{plan.name}</h2>
            <p className="text-xl font-semibold mb-6">
              {plan.price === 0 ? 'Grátis' : `${plan.price.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}/mês`}
            </p>
            <button 
              onClick={() => onSelectPlan(plan.id)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
            >
              Selecionar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
