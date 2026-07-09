import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Check, Sparkles } from 'lucide-react';

// Replace with your actual Stripe Publishable Key
const stripePromise = loadStripe((import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

interface Plan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  priceId: string;
  isBestOffer?: boolean;
}

const plans: Plan[] = [
  { 
    id: 'free', 
    name: 'Plano Gratuito', 
    price: 'AOA 0', 
    description: 'Acesso básico',
    features: ['Acesso limitado 2 min', 'Recurso Exclusivo 1'],
    priceId: 'free_id' 
  },
  { 
    id: 'monthly', 
    name: 'Plano Mensal', 
    price: 'AOA 3.500', 
    description: 'por mês',
    features: ['Acesso a todos os cenários', 'Suporte 12h', 'Suporte Prioritário'],
    priceId: 'price_monthly_id',
    isBestOffer: true
  },
  { 
    id: 'quarterly', 
    name: 'Plano Trimestral', 
    price: 'AOA 10.000', 
    description: 'por 3 meses',
    features: ['Acesso a todos os cenários', 'Recurso Exclusivo 1', 'Suporte 24h', 'Suporte Prioritário'],
    priceId: 'price_quarterly_id' 
  },
  { 
    id: 'yearly', 
    name: 'Plano Anual', 
    price: 'AOA 40.000', 
    description: 'por ano',
    features: ['Acesso a todos os cenários', 'Recurso Exclusivo 1', 'Suporte 24h', 'Suporte Prioritário'],
    priceId: 'price_annual_id' 
  },
];

export default function SubscriptionCheckout({ setView }: { setView: (v: string) => void }) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (plan: Plan) => {
    if (plan.id === 'free') {
      setView('dashboard');
      return;
    }
    setLoading(plan.id);
    
    try {
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId: plan.priceId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create checkout session');
        }

        const session = await response.json();
        const stripe = await stripePromise;
        
        if (stripe && session.id) {
          await (stripe as any).redirectToCheckout({ sessionId: session.id });
        } else {
          throw new Error('Stripe not initialized or session ID missing');
        }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.message || 'Erro ao iniciar pagamento');
      setLoading(null);
    }
  };

  return (
    <div className="h-screen bg-slate-50 p-4 flex flex-col justify-center overflow-hidden">
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Planos e Preços</h2>
          <p className="text-lg text-slate-600 mx-auto whitespace-nowrap overflow-hidden text-ellipsis">Adquira um Plano e Desbloqueie Habilidades para Dominar o Idioma</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`relative p-8 rounded-3xl border ${plan.isBestOffer ? 'bg-white border-indigo-500 shadow-xl scale-105' : 'bg-white border-slate-200'} flex flex-col`}
            >
              {plan.isBestOffer && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Melhor oferta
                </div>
              )}
              <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
              <p className="text-sm text-slate-500 mb-6">{plan.description}</p>
              <div className="text-4xl font-extrabold text-slate-900 mb-8">{plan.price}</div>
              
              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-slate-600 text-sm">
                    <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan)}
                disabled={loading === plan.id}
                className={`w-full py-3 px-6 rounded-xl font-bold transition-all ${
                  plan.isBestOffer 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                }`}
              >
                {loading === plan.id ? 'Carregando...' : plan.id === 'free' ? 'Continuar' : 'Comprar Agora'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
