import React, { useState } from 'react';
import { Check, Sparkles, ArrowLeft, ChevronRight } from 'lucide-react';
import { useLocalization } from "../../../context/LocalizationContext";
import { navigateToExternalCheckout } from "../../../utils/navigationUtils";

interface Plan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  priceId: string;
  isBestOffer?: boolean;
}

export default function SubscriptionCheckout({ setView, user }: { setView: (v: string) => void, user?: any }) {
  const [loading, setLoading] = useState<string | null>(null);
  const { ot } = useLocalization();

  const plans = [
    { 
      id: 'free', 
      name: ot('planFree', 'Plano Gratuito'), 
      price: ot('priceZero', 'AOA 0'), 
      description: ot('descFree', 'Acesso básico de teste'),
      features: [ot('featFree1', 'Acesso limitado 2 min por sala'), ot('featFree2', 'Recursos essenciais de diálogo'), ot('featFree3', 'Ideal para conhecer a plataforma')],
      priceId: 'free_id' 
    },
    { 
      id: 'monthly', 
      name: ot('planMonthly', 'Plano Mensal'), 
      price: 'AOA 3.500', 
      description: ot('descMonthly', 'Acesso contínuo mês a mês'),
      features: [ot('featMonthly1', 'Acesso a todos os cenários práticos'), ot('featMonthly2', 'Suporte especializado 12h'), ot('featMonthly3', 'Suporte Prioritário')],
      priceId: 'price_monthly_id',
      isBestOffer: true
    },
    { 
      id: 'quarterly', 
      name: ot('planQuarterly', 'Plano Trimestral'), 
      price: 'AOA 10.000', 
      description: ot('descQuarterly', 'Economia e consistência'),
      features: [ot('featQuarterly1', 'Acesso a todos os cenários práticos'), ot('featQuarterly2', 'Suporte especializado 24h'), ot('featQuarterly3', 'Acesso prioritário a atualizações'), ot('featQuarterly4', 'Suporte Prioritário VIP')],
      priceId: 'price_quarterly_id' 
    },
    { 
      id: 'yearly', 
      name: ot('planYearly', 'Plano Anual'), 
      price: 'AOA 40.000', 
      description: ot('descYearly', 'O melhor custo-benefício de aprendizado'),
      features: [ot('featYearly1', 'Acesso total e ilimitado a tudo'), ot('featYearly2', 'Suporte especializado 24h VIP'), ot('featYearly3', 'Garantia de novos módulos'), ot('featYearly4', 'Suporte prioritário vitalício')],
      priceId: 'price_annual_id' 
    },
  ];

  const handleCheckout = async (plan: any) => {
    if (plan.id === 'free') {
      setView('dashboard');
      return;
    }
    if (!user) {
      alert('Você precisa estar autenticado para realizar uma assinatura.');
      return;
    }
    setLoading(plan.id);
    
    try {
        const token = await user.getIdToken();
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            planId: plan.id,
            priceId: plan.priceId 
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create checkout session');
        }

        const session = await response.json();
        
        if (session.url) {
          navigateToExternalCheckout(session.url);
        } else {
          throw new Error('Checkout session URL missing');
        }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.message || 'Erro ao iniciar pagamento');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex flex-col items-center justify-start overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header Navigation Bar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <button 
            onClick={() => setView('dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200 shadow-xs transition-all font-semibold text-xs uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{ot("backToApp", "Voltar ao App")}</span>
          </button>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline-block">{ot("upgradePremium", "Upgrade Premium")}</span>
        </div>

        {/* Title and Subtitle */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100/60 rounded-full text-xs font-semibold text-indigo-600 mb-4 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{ot("unlockPotential", "Desbloqueie todo o seu potencial")}</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">{ot("plansAndPrices", "Planos e Preços")}</h2>
          <p className="text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {ot("plansDesc", "Adquira um plano premium e desfrute de acesso ilimitado a todos os cenários, suporte dedicado e recursos exclusivos para acelerar a fluência do seu idioma.")}
          </p>
        </div>
        
        {/* Plans Grid / Swipeable Slider */}
        <div className="w-full relative">
          {/* Mobile indicator for scrolling */}
          <div className="flex md:hidden items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400 mb-6 uppercase tracking-wider bg-slate-100 border border-slate-200/40 py-2 rounded-xl">
            <span>{ot("swipePlans", "Deslize para o lado para ver mais planos")}</span>
            <ChevronRight className="w-3.5 h-3.5 animate-bounce-horizontal" />
          </div>

          <div className="flex overflow-x-auto pb-8 gap-6 snap-x snap-mandatory px-4 -mx-4 md:px-0 md:mx-0 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible">
            {plans.map((plan) => (
              <div 
                key={plan.id} 
                className={`relative p-8 rounded-3xl border transition-all duration-300 flex flex-col shrink-0 snap-center justify-between
                  min-w-[285px] xs:min-w-[310px] sm:min-w-[330px] md:min-w-0
                  ${plan.isBestOffer 
                    ? 'bg-white border-indigo-500 shadow-xl md:scale-105 z-10 ring-4 ring-indigo-50' 
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }`}
              >
                {/* Highlight Ribbon */}
                {plan.isBestOffer && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-indigo-600 text-white text-[10px] uppercase tracking-widest font-extrabold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                    {ot("bestOffer", "Melhor oferta ⭐")}
                  </div>
                )}
                
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-2 text-left">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mb-6 text-left leading-relaxed min-h-[32px]">{plan.description}</p>
                  
                  {/* Pricing Info */}
                  <div className="mb-8 text-left border-b border-slate-100 pb-6">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-baseline gap-1 flex-wrap">
                      {plan.price}
                    </span>
                    {plan.id !== 'free' && (
                      <span className="text-xs text-slate-400 font-bold block mt-1 uppercase tracking-wider">
                        {ot("stripeSecure", "Pagamento Seguro via Stripe")}
                      </span>
                    )}
                  </div>
                  
                  {/* Feature Checklist */}
                  <ul className="space-y-4 mb-8 flex-grow">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-slate-600 text-sm text-left">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="leading-tight font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Buy Button */}
                <button
                  onClick={() => handleCheckout(plan)}
                  disabled={loading === plan.id}
                  className={`w-full py-4 px-6 rounded-2xl font-bold transition-all text-sm tracking-wide cursor-pointer flex items-center justify-center gap-2 ${
                    plan.isBestOffer 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg hover:shadow-indigo-200 active:scale-95' 
                      : plan.id === 'free'
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300/40 hover:border-slate-300'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100/60 active:scale-95'
                  }`}
                >
                  {loading === plan.id ? (
                    <span className="flex items-center gap-2 justify-center">
                      <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>{ot("starting", "Iniciando...")}</span>
                    </span>
                  ) : (
                    <>
                      <span>{plan.id === 'free' ? ot("startFree", "Começar Grátis") : ot("buyNow", "Comprar Agora")}</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
