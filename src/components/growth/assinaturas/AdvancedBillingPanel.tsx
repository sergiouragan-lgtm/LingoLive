import React, { useState, useEffect } from "react";
import {
  CreditCard, DollarSign, Calendar, CheckCircle, AlertCircle,
  Lock, Shield, RefreshCw, Download, Trash2, Pause, Play,
  TrendingUp, ChevronRight, Plus, Clock, Zap, Award, Settings
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../../../firebase";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { useToast } from "../../../context/ToastContext";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { useMonitoring } from "../../../hooks/useMonitoring";

interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  dependentsIncluded: number;
  billingCycle: "monthly" | "yearly";
}

interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: "active" | "paused" | "cancelled" | "past_due" | "incomplete";
  billingCycle: "monthly" | "yearly";
  currentPeriodStart: number;
  currentPeriodEnd: number;
  nextBillingDate: number;
  pausedAt?: number;
  cancelledAt?: number;
  stripeSubscriptionId: string;
  createdAt: number;
  updatedAt: number;
}

interface PaymentMethod {
  id: string;
  type: "card" | "bank";
  last4: string;
  brand: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export const AdvancedBillingPanel: React.FC<{
  setView?: (v: string) => void;
}> = ({ setView }) => {
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();
  const { addToast } = useToast();
  const user = auth.currentUser;

  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"subscriptions" | "payment-methods" | "upgrade">("subscriptions");
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<UserSubscription | null>(null);

  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: "starter",
      name: "Starter",
      monthlyPrice: 49,
      yearlyPrice: 490,
      dependentsIncluded: 1,
      features: ["1 dependente", "Aulas gravadas básicas", "Comunidade de alunos", "Suporte por email"],
      billingCycle: "monthly"
    },
    {
      id: "professional",
      name: "Professional",
      monthlyPrice: 149,
      yearlyPrice: 1490,
      dependentsIncluded: 3,
      features: ["Até 3 dependentes", "Aulas gravadas + ao vivo", "Fórum privado", "Suporte prioritário", "Relatórios avançados"],
      billingCycle: "monthly"
    },
    {
      id: "enterprise",
      name: "Enterprise",
      monthlyPrice: 299,
      yearlyPrice: 2990,
      dependentsIncluded: 10,
      features: ["Até 10 dependentes", "Aulas personalizadas", "Gestor dedicado", "Suporte 24/7", "Integração com LMS"],
      billingCycle: "monthly"
    }
  ];

  // Fetch user subscriptions and payment methods
  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // Subscribe to user's subscriptions
    const subQuery = query(
      collection(db, "subscriptions"),
      where("userId", "==", user.uid)
    );

    const unsubScriptions = onSnapshot(subQuery, (snapshot) => {
      const subs: UserSubscription[] = [];
      snapshot.forEach((doc) => {
        subs.push(doc.data() as UserSubscription);
      });
      setUserSubscriptions(subs);
    });

    // Fetch payment methods
    const fetchPaymentMethods = async () => {
      try {
        // In production, this would be fetched from backend via API
        const mockPaymentMethods: PaymentMethod[] = [
          {
            id: "card-1",
            type: "card",
            last4: "4092",
            brand: "Visa",
            expiryMonth: 8,
            expiryYear: 2026,
            isDefault: true
          },
          {
            id: "bank-1",
            type: "bank",
            last4: "1234",
            brand: "BPI",
            isDefault: false
          }
        ];
        setPaymentMethods(mockPaymentMethods);
      } catch (error) {
        console.error("Failed to fetch payment methods:", error);
      }
    };

    fetchPaymentMethods();
    setLoading(false);

    return () => {
      unsubScriptions();
    };
  }, [user]);

  const handlePauseSubscription = (subscription: UserSubscription) => {
    if (userId) {
      trackEvent('billing_subscription_pause_initiated', {
        planId: subscription.planId,
        billingCycle: subscription.billingCycle
      });
    }
    setSelectedSubscription(subscription);
    setShowPauseModal(true);
  };

  const confirmPauseSubscription = () => {
    if (!selectedSubscription) return;

    if (userId) {
      trackEvent('billing_subscription_paused', {
        planId: selectedSubscription.planId
      });
    }
    addToast("Processando pausa da assinatura...", "info");
    setTimeout(() => {
      addToast(`Assinatura pausada. Você pode retomar a qualquer momento.`, "success");
      setShowPauseModal(false);
      // In production, this would call subscriptionManager.pauseSubscription()
    }, 1000);
  };

  const handleResumeSubscription = (subscription: UserSubscription) => {
    if (userId) {
      trackEvent('billing_subscription_resumed', {
        planId: subscription.planId
      });
    }
    addToast("Processando retomada da assinatura...", "info");
    setTimeout(() => {
      addToast("Assinatura retomada com sucesso!", "success");
      // In production, this would call subscriptionManager.resumeSubscription()
    }, 1000);
  };

  const handleCancelSubscription = (subscription: UserSubscription) => {
    if (!window.confirm("Tem certeza que deseja cancelar esta assinatura? Esta ação não pode ser desfeita.")) {
      if (userId) {
        trackEvent('billing_subscription_cancel_dismissed', {
          planId: subscription.planId
        });
      }
      return;
    }

    if (userId) {
      trackEvent('billing_subscription_cancelled', {
        planId: subscription.planId
      });
    }
    addToast("Processando cancelamento...", "info");
    setTimeout(() => {
      addToast("Assinatura cancelada.", "success");
      // In production, this would call subscriptionManager.cancelSubscription()
    }, 1000);
  };

  const handleUpgradePlan = (planId: string) => {
    if (userId) {
      trackEvent('billing_upgrade_initiated', {
        targetPlan: planId
      });
    }
    addToast(`Iniciando upgrade para plano ${planId}...`, "info");
    setTimeout(() => {
      if (userId) {
        trackEvent('billing_upgrade_completed', {
          targetPlan: planId
        });
      }
      addToast("Upgrade realizado com sucesso!", "success");
      // In production, this would create a new Stripe subscription
    }, 1500);
  };

  const handleTabChange = (tab: 'subscriptions' | 'payment-methods' | 'upgrade') => {
    if (userId) {
      trackEvent('billing_tab_switched', {
        fromTab: selectedTab,
        toTab: tab
      });
    }
    setSelectedTab(tab);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const getStatusBadgeColor = (status: UserSubscription["status"]) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-700";
      case "paused":
        return "bg-yellow-100 text-yellow-700";
      case "past_due":
        return "bg-rose-100 text-rose-700";
      case "cancelled":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900">
          Gerenciamento de Assinatura
        </h1>
        <p className="text-slate-600 text-sm md:text-base mt-2">
          Gerencie seus planos, métodos de pagamento e histórico de faturas
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 border-b border-slate-200">
        {(["subscriptions", "payment-methods", "upgrade"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-3 font-bold text-sm border-b-2 transition-all ${
              selectedTab === tab
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab === "subscriptions" && "Minhas Assinaturas"}
            {tab === "payment-methods" && "Métodos de Pagamento"}
            {tab === "upgrade" && "Planos Disponíveis"}
          </button>
        ))}
      </div>

      {/* Content Sections */}
      {selectedTab === "subscriptions" && (
        <div className="space-y-6">
          {userSubscriptions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white p-8 rounded-2xl border border-slate-200 text-center"
            >
              <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 text-lg">Nenhuma assinatura ativa</h3>
              <p className="text-slate-600 text-sm mt-2">
                Selecione um plano para começar sua jornada de aprendizagem
              </p>
              <button
                onClick={() => setSelectedTab("upgrade")}
                className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-lg transition-colors"
              >
                Ver Planos
              </button>
            </motion.div>
          ) : (
            userSubscriptions.map((subscription, idx) => {
              const plan = subscriptionPlans.find(p => p.id === subscription.planId);
              return (
                <motion.div
                  key={subscription.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{plan?.name || "Plano Desconhecido"}</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {subscription.billingCycle === "monthly" ? "Faturamento Mensal" : "Faturamento Anual"}
                      </p>
                    </div>
                    <div className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold ${getStatusBadgeColor(subscription.status)}`}>
                      {subscription.status === "active" && "Ativo"}
                      {subscription.status === "paused" && "Pausado"}
                      {subscription.status === "cancelled" && "Cancelado"}
                      {subscription.status === "past_due" && "Vencido"}
                      {subscription.status === "incomplete" && "Incompleto"}
                    </div>
                  </div>

                  {/* Subscription Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-slate-100">
                    <div>
                      <span className="text-xs text-slate-500 font-bold uppercase">Período Atual</span>
                      <p className="text-sm text-slate-900 font-bold mt-1">
                        {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-bold uppercase">Próxima Fatura</span>
                      <p className="text-sm text-slate-900 font-bold mt-1">
                        {formatDate(subscription.nextBillingDate)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-bold uppercase">Dependentes Inclusos</span>
                      <p className="text-sm text-slate-900 font-bold mt-1">
                        {plan?.dependentsIncluded || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {subscription.status === "active" && (
                      <>
                        <button
                          onClick={() => handlePauseSubscription(subscription)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-xs font-bold rounded-lg transition-colors"
                        >
                          <Pause className="w-3.5 h-3.5" /> Pausar
                        </button>
                        <button
                          onClick={() => handleCancelSubscription(subscription)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Cancelar
                        </button>
                      </>
                    )}
                    {subscription.status === "paused" && (
                      <button
                        onClick={() => handleResumeSubscription(subscription)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" /> Retomar
                      </button>
                    )}
                    <button
                      onClick={() => addToast("Fatura descarregada!", "success")}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Faturas
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {selectedTab === "payment-methods" && (
        <div className="space-y-6">
          {/* Payment Methods List */}
          <div className="space-y-4">
            {paymentMethods.map((method, idx) => (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-6 rounded-2xl border border-slate-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                      {method.type === "card" ? (
                        <CreditCard className="w-6 h-6 text-slate-600" />
                      ) : (
                        <Building className="w-6 h-6 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {method.type === "card" ? `${method.brand} ****${method.last4}` : `Conta ${method.brand} - ****${method.last4}`}
                      </h4>
                      {method.type === "card" && method.expiryMonth && (
                        <p className="text-sm text-slate-500">
                          Expira em {String(method.expiryMonth).padStart(2, "0")}/{method.expiryYear}
                        </p>
                      )}
                      {method.isDefault && (
                        <span className="text-xs font-bold text-emerald-600">Padrão</span>
                      )}
                    </div>
                  </div>
                  {!method.isDefault && (
                    <button
                      onClick={() => addToast("Método atualizado como padrão", "success")}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      Definir como Padrão
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Add New Payment Method */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: paymentMethods.length * 0.1 }}
            onClick={() => addToast("Abrindo formulário de adição de método de pagamento", "info")}
            className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
          >
            <div className="flex items-center justify-center gap-2 font-bold text-slate-700">
              <Plus className="w-5 h-5" />
              Adicionar Método de Pagamento
            </div>
          </motion.button>
        </div>
      )}

      {selectedTab === "upgrade" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subscriptionPlans.map((plan, idx) => {
              const isCurrentPlan = userSubscriptions.some(sub => sub.planId === plan.id);
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative p-6 rounded-2xl border-2 transition-all ${
                    isCurrentPlan
                      ? "border-indigo-600 bg-indigo-50/20 shadow-lg"
                      : "border-slate-200 bg-white hover:border-indigo-300"
                  }`}
                >
                  {isCurrentPlan && (
                    <div className="absolute top-4 right-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Plano Atual
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-900">{plan.monthlyPrice}</span>
                      <span className="text-slate-600">Kz/mês</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      ou {plan.yearlyPrice} Kz/ano (2 meses grátis)
                    </p>
                  </div>

                  <div className="mb-6 pb-6 border-b border-slate-100 space-y-2">
                    {plan.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => !isCurrentPlan && handleUpgradePlan(plan.id)}
                    disabled={isCurrentPlan}
                    className={`w-full py-3 rounded-lg font-bold text-sm transition-colors ${
                      isCurrentPlan
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white"
                    }`}
                  >
                    {isCurrentPlan ? "Plano Atual" : `Upgrade para ${plan.name}`}
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* FAQ Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-lg mb-4">Dúvidas Frequentes</h3>
            <div className="space-y-4 text-sm text-slate-700">
              <div>
                <p className="font-bold text-slate-900 mb-1">Posso mudar de plano a qualquer momento?</p>
                <p>Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer hora. As mudanças refletirão na próxima data de faturamento.</p>
              </div>
              <div>
                <p className="font-bold text-slate-900 mb-1">O que acontece se eu cancelar?</p>
                <p>Seu acesso continua até o final do período de faturamento atual. Você pode reativar a assinatura a qualquer momento.</p>
              </div>
              <div>
                <p className="font-bold text-slate-900 mb-1">Há período de teste gratuito?</p>
                <p>Sim! Os planos Starter e Professional incluem 7 dias de teste gratuito. O plano Enterprise tem 14 dias.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pause Subscription Modal */}
      <AnimatePresence>
        {showPauseModal && selectedSubscription && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-md w-full space-y-4"
            >
              <div className="flex items-center gap-3">
                <Pause className="w-6 h-6 text-yellow-600" />
                <h3 className="text-lg font-bold text-slate-900">Pausar Assinatura?</h3>
              </div>

              <p className="text-sm text-slate-600">
                Você poderá retomar sua assinatura a qualquer momento. Seu acesso continuará ativo até o final do período atual.
              </p>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowPauseModal(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmPauseSubscription}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Placeholder for missing Building icon
const Building = ({ className }: { className: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
