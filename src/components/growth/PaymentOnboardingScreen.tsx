import React, { useState } from "react";
import { User } from "firebase/auth";
import { db, handleFirestoreError, OperationType } from "../../firebase";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { Check, CreditCard, Smartphone, Landmark, Sparkles, ShieldCheck, Loader2, Zap, ArrowRight, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLocalization, useLanguageChanged } from "../../context/LocalizationContext";
import { navigateToExternalCheckout } from "../../utils/navigationUtils";



interface PaymentOnboardingScreenProps {
  user: User;
  onComplete: () => void;
  onBack?: () => void;
}


export const PaymentOnboardingScreen: React.FC<PaymentOnboardingScreenProps> = ({ user, onComplete, onBack }) => {
  const { ot } = useLocalization();
  const [, setDummy] = useState({});
  
  // Force re-render on language change
  useLanguageChanged(() => setDummy({}));

  const PREMIUM_PLANS = [
    {
      id: "trial-starter",
      name: ot("starterTrial", "Starter Trial"),
      price: ot("free", "Grátis"),
      period: ot("starterPeriod", "por 7 dias, depois $9.90/mês"),
      badge: ot("mostPopular", "Mais Popular"),
      desc: ot("starterDesc", "Ideal para iniciar os estudos do dia a dia."),
      features: [
        ot("feat1_1", "Prática básica de conversação com IA"),
        ot("feat1_2", "Acesso a 1 idioma alvo"),
        ot("feat1_3", "Estatísticas diárias básicas"),
        ot("feat1_4", "Cancelamento a qualquer momento")
      ],
      cta: ot("activateFreeTrial", "Ativar Teste Grátis")
    },
    {
      id: "premium-plan",
      name: ot("premiumVip", "Premium VIP"),
      price: "$19.90",
      period: ot("perMonth", "por mês"),
      badge: ot("bestValue", "Melhor Valor"),
      desc: ot("premiumDesc", "Acesso total à inteligência artificial avançada."),
      features: [
        ot("feat2_1", "Conversas ilimitadas com múltiplos tutores"),
        ot("feat2_2", "Acesso a todos os idiomas e sotaques"),
        ot("feat2_3", "Relatórios pedagógicos detalhados"),
        ot("feat2_4", "Exercícios personalizados por IA"),
        ot("feat2_5", "Acesso prioritário a novas funcionalidades")
      ],
      cta: ot("activatePremium", "Ativar Premium")
    },
    {
      id: "family-plan",
      name: ot("familyPlan", "Plano Familiar"),
      price: "$34.90",
      period: ot("perMonth", "por mês"),
      desc: ot("familyDesc", "Partilhe a aprendizagem com a sua família."),
      features: [
        ot("feat3_1", "Até 5 perfis de utilizador independentes"),
        ot("feat3_2", "Todas as funcionalidades Premium VIP"),
        ot("feat3_3", "Controlo parental de progresso"),
        ot("feat3_4", "Suporte dedicado 24/7")
      ],
      cta: ot("activateFamily", "Ativar Plano Familiar")
    }
  ];

  const [selectedPlan, setSelectedPlan] = useState<typeof PREMIUM_PLANS[0] | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "multicaixa" | "transfer" | "paypal">("card");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [phoneForMulticaixa, setPhoneForMulticaixa] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSelectPlan = (plan: typeof PREMIUM_PLANS[0]) => {
    setSelectedPlan(plan);
    setError("");
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    // Form validation
    if (paymentMethod === "multicaixa") {
      if (!phoneForMulticaixa) {
        setError("Por favor, introduza o número de telemóvel associado ao Multicaixa Express.");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const baseUrl = window.location.origin;
      if (paymentMethod === "card") {
        const token = await user.getIdToken();
        let planId = "trial_starter";
        let priceId = "price_trial_starter_id";
        if (selectedPlan.id === "premium-plan") {
          planId = "monthly";
          priceId = "price_monthly_id";
        } else if (selectedPlan.id === "family-plan") {
          planId = "quarterly";
          priceId = "price_quarterly_id";
        }

        const response = await fetch(`${baseUrl}/api/create-checkout-session`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ planId, priceId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create checkout session');
        }

        const session = await response.json();
        
        if (session.url) {
          navigateToExternalCheckout(session.url);
          return;
        } else {
          throw new Error('Checkout session URL missing');
        }
      } else if (paymentMethod === "paypal") {
        const token = await user.getIdToken();
        
        // 1. Create order on secure backend
        const createResponse = await fetch(`${baseUrl}/api/paypal/create-order`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ planId: selectedPlan.id }),
        });

        if (!createResponse.ok) {
          const errData = await createResponse.json();
          throw new Error(errData.error || 'Falha ao criar ordem de pagamento PayPal.');
        }

        const orderData = await createResponse.json();
        const orderId = orderData.orderId;

        // Simulate secure transaction checkout simulation step
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // 2. Capture and validate order securely on backend
        const captureResponse = await fetch(`${baseUrl}/api/paypal/capture-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ orderId }),
        });

        if (!captureResponse.ok) {
          const errData = await captureResponse.json();
          throw new Error(errData.error || 'Falha ao capturar e validar pagamento PayPal.');
        }

        // Update local storage cache
        const isTrial = selectedPlan.id === "trial-starter";
        const cacheKey = `lingolive_user_sub_${user.uid}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            parsed.paymentCompleted = true;
            parsed.subscriptionStatus = isTrial ? "trial" : "active";
            parsed.subscriptionActive = true;
            localStorage.setItem(cacheKey, JSON.stringify(parsed));
          } catch (e) {}
        }

        setSuccess(true);
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else if (paymentMethod === "multicaixa") {
        const token = await user.getIdToken();
        const response = await fetch(`${baseUrl}/api/create-multicaixa-reference-v2`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            planId: selectedPlan.id,
            phone: phoneForMulticaixa
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Falha ao gerar referência Multicaixa V2.');
        }

        const data = await response.json();
        console.log("Multicaixa V2 reference generated:", data);

        const isTrial = selectedPlan.id === "trial-starter";
        const userRef = doc(db, "users", user.uid);

        const updatePayload = {
          paymentCompleted: true,
          subscriptionStatus: isTrial ? "trial" : "active",
          subscriptionPlanId: selectedPlan.id,
          subscriptionActive: true,
          status: "ACTIVE",
          updatedAt: new Date()
        };

        await setDoc(userRef, updatePayload, { merge: true });

        // Create transaction logs record in database for security compliance
        const subRef = doc(db, "subscriptions", `${user.uid}_sub`);
        await setDoc(subRef, {
          id: `${user.uid}_sub`,
          userId: user.uid,
          ownerId: user.uid,
          planId: selectedPlan.id,
          status: isTrial ? "trial" : "active",
          createdAt: new Date().toISOString(),
          paymentMethod: paymentMethod,
          amount: data.amount,
          reference: data.reference,
          entity: data.entity,
          currency: data.currency
        });

        // Update local storage cache
        const cacheKey = `lingolive_user_sub_${user.uid}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            parsed.paymentCompleted = true;
            parsed.subscriptionStatus = isTrial ? "trial" : "active";
            parsed.subscriptionActive = true;
            localStorage.setItem(cacheKey, JSON.stringify(parsed));
          } catch (e) {}
        }

        setSuccess(true);
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        // Fallback simulation for Bank transfer
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const isTrial = selectedPlan.id === "trial-starter";
        const userRef = doc(db, "users", user.uid);

        const updatePayload = {
          paymentCompleted: true,
          subscriptionStatus: isTrial ? "trial" : "active",
          subscriptionPlanId: selectedPlan.id,
          subscriptionActive: true,
          status: "ACTIVE",
          updatedAt: new Date()
        };

        await setDoc(userRef, updatePayload, { merge: true });

        // Create transaction logs record in database for security compliance
        const subRef = doc(db, "subscriptions", `${user.uid}_sub`);
        await setDoc(subRef, {
          id: `${user.uid}_sub`,
          userId: user.uid,
          ownerId: user.uid,
          planId: selectedPlan.id,
          status: isTrial ? "trial" : "active",
          createdAt: new Date().toISOString(),
          paymentMethod: paymentMethod,
          amount: selectedPlan.price
        });

        // Update local storage cache
        const cacheKey = `lingolive_user_sub_${user.uid}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            parsed.paymentCompleted = true;
            parsed.subscriptionStatus = isTrial ? "trial" : "active";
            parsed.subscriptionActive = true;
            localStorage.setItem(cacheKey, JSON.stringify(parsed));
          } catch (e) {}
        }

        setSuccess(true);
        setTimeout(() => {
          onComplete();
        }, 1500);
      }

    } catch (err: any) {
      console.error("Error confirming payment:", err);
      setError(err.message || "Erro ao processar o pagamento no servidor. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-start items-center p-4 md:p-8 relative overflow-hidden" id="payments-onboarding-screen">
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[130px]" />
      </div>

      <div className="max-w-6xl w-full relative z-10 space-y-8 py-6">
        {onBack && (
          <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
            <button
              type="button"
              onClick={onBack}
              className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
            >
              ← {ot("backToDashboard", "Voltar ao Dashboard")}
            </button>
            <span className="text-xs font-mono text-slate-500">{ot("manageSubscription", "Gestão de Planos & Pagamentos")}</span>
          </div>
        )}
        
        {/* Header section */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-mono font-bold text-violet-300">
            <Zap className="w-3.5 h-3.5 animate-pulse" /> {ot("accessActivation", "Ativação de Acesso")}
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">{ot("activateSubscriptionTitle", "Ative a Sua Subscrição")}</h1>
          <p className="text-slate-400 text-xs md:text-sm max-w-lg mx-auto">
            {ot("selectPlanDesc", "Por favor, selecione e ative um dos planos para desbloquear o Dashboard e iniciar a sua prática ilimitada com Inteligência Artificial.")}
          </p>
        </div>

        {/* Dynamic checkout layout or Plans Selection */}
        <AnimatePresence mode="wait">
          {!selectedPlan ? (
            <motion.div
              key="plans-selector"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {PREMIUM_PLANS.map((plan) => (
                <div 
                  key={plan.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl hover:shadow-2xl relative"
                >
                  {plan.badge && (
                    <span className="absolute -top-3 right-6 bg-gradient-to-r from-indigo-500 to-violet-500 text-[10px] font-bold px-3 py-1 rounded-full border border-indigo-400/20 shadow-md">
                      {plan.badge}
                    </span>
                  )}

                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold text-slate-100">{plan.name}</h3>
                      <p className="text-xs text-slate-400 leading-normal">{plan.desc}</p>
                    </div>

                    <div className="py-2 border-y border-slate-800">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white">{plan.price}</span>
                        <span className="text-xs text-slate-500">{plan.period}</span>
                      </div>
                    </div>

                    <ul className="space-y-3">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-normal">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-800/60">
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      className="w-full py-3 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-300 hover:text-white border border-indigo-500/20 hover:border-indigo-500 rounded-2xl text-xs font-bold transition-all cursor-pointer text-center"
                    >
                      {plan.cta}
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="checkout-module"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-2xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl"
            >
              {/* Back button */}
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-xs text-slate-500 hover:text-slate-300 font-bold mb-6 flex items-center gap-1 transition-colors cursor-pointer"
              >
                {ot("backToPlans", "← Voltar aos Planos")}
              </button>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                
                {/* Plan brief summary */}
                <div className="md:col-span-2 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 h-fit space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">{ot("selectedPlan", "Plano Selecionado")}</span>
                    <h4 className="text-base font-bold text-slate-100">{selectedPlan.name}</h4>
                  </div>
                  <div className="border-t border-slate-800 pt-3">
                    <span className="text-lg font-black text-white">{selectedPlan.price}</span>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{selectedPlan.period}</p>
                  </div>
                </div>

                {/* Secure Checkout Form */}
                <form onSubmit={handleCheckoutSubmit} className="md:col-span-3 space-y-5">
                  <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1.5 pb-2 border-b border-slate-800">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" /> {ot("secureCheckout", "Checkout Seguro")}
                  </h3>

                  {/* Payment method selector */}
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`py-2.5 px-1 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === "card"
                          ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                          : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span className="text-[8px] sm:text-[9px] font-bold uppercase">{ot("card", "Cartão")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("multicaixa")}
                      className={`py-2.5 px-1 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === "multicaixa"
                          ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                          : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span className="text-[8px] sm:text-[9px] font-bold uppercase">{ot("express", "Express")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("paypal")}
                      className={`py-2.5 px-1 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === "paypal"
                          ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                          : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      <Wallet className="w-4 h-4" />
                      <span className="text-[8px] sm:text-[9px] font-bold uppercase">{ot("paypal", "PayPal")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("transfer")}
                      className={`py-2.5 px-1 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === "transfer"
                          ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                          : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      <Landmark className="w-4 h-4" />
                      <span className="text-[8px] sm:text-[9px] font-bold uppercase">{ot("iban", "IBAN")}</span>
                    </button>
                  </div>

                  {/* Card fields */}
                  {paymentMethod === "card" && (
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[12px] text-slate-300 leading-relaxed text-center space-y-3">
                      <div className="mx-auto w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <p>
                        {ot("stripeRedirect", "Será redirecionado com total segurança para o portal do {stripe} para efetuar o pagamento do plano {plan}.")
                          .replace("{stripe}", "Stripe")
                          .replace("{plan}", selectedPlan?.name || "")}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {ot("noCardStored", "Nenhum detalhe de cartão é armazenado nos nossos servidores.")}
                      </p>
                    </div>
                  )}

                  {/* PayPal fields */}
                  {paymentMethod === "paypal" && (
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[12px] text-slate-300 leading-relaxed text-center space-y-3">
                      <div className="mx-auto w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <p>
                        {ot("paypalOrder", "Será criada uma ordem segura de pagamento via {paypal}. Ao prosseguir, um registo pendente será criado para validação imediata da subscrição do plano {plan}.")
                          .replace("{paypal}", "PayPal")
                          .replace("{plan}", selectedPlan?.name || "")}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {ot("paypalWarranty", "Garantia de transação segura integrada e conformidade regulamentar.")}
                      </p>
                    </div>
                  )}

                  {/* Multicaixa Angola fields */}
                  {paymentMethod === "multicaixa" && (
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] text-slate-400 leading-relaxed">
                        <strong>{ot("multicaixaInfo", "Pagamento via Multicaixa Express (Angola): Insira o seu número de telemóvel associado e receberá uma notificação no seu telemóvel para confirmar o pagamento.")}</strong>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400 font-mono">{ot("phoneExpress", "Telemóvel Express")}</label>
                        <input
                          type="tel"
                          required
                          value={phoneForMulticaixa}
                          onChange={(e) => setPhoneForMulticaixa(e.target.value)}
                          placeholder="Ex: +244 9XX XXX XXX"
                          className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-semibold outline-none text-slate-100 transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {/* Bank Transfer info */}
                  {paymentMethod === "transfer" && (
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3.5">
                      <div className="text-[11px] text-slate-400 leading-normal">
                        {ot("transferInfo", "Para ativar via transferência bancária, por favor efetue a transferência para o seguinte IBAN e clique em {button}.").replace("{button}", ot("activateSubscription", "Ativar Subscrição"))}
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between border-b border-slate-900 pb-1.5">
                          <span className="text-slate-500">{ot("bank", "Banco:")}</span>
                          <span className="font-semibold text-slate-200">Banco de Fomento Angola (BFA)</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900 pb-1.5">
                          <span className="text-slate-500">{ot("beneficiary", "Beneficiário:")}</span>
                          <span className="font-semibold text-slate-200">LingoLIVE IA, Lda</span>
                        </div>
                        <div className="flex flex-col gap-1 pt-1">
                          <span className="text-slate-500">{ot("ibanLabel", "IBAN:")}</span>
                          <span className="font-mono text-[10px] font-bold text-indigo-300 select-all p-1.5 bg-slate-900/60 rounded border border-slate-800">
                            AO06 0006 0000 1234 5678 9012 3
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submission and errors */}
                  <div className="space-y-3.5 pt-2">
                    {error && (
                      <p className="text-sm font-bold text-rose-500 text-center bg-rose-100 border-2 border-rose-500 py-3 px-6 rounded-2xl my-4">
                        {error}
                      </p>
                    )}

                    {success ? (
                      <div className="py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center font-bold rounded-2xl text-xs flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" /> {ot("paymentSuccess", "Pagamento Processado com Sucesso! Redirecionando...")}
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{ot("processing", "Processando...")}</span>
                          </>
                        ) : (
                          <>
                            <span>{ot("activateSubscription", "Ativar Subscrição")}</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
