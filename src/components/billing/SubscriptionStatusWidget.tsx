import React, { useMemo } from 'react';
import { CreditCard, AlertTriangle, Clock, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useLocalization } from '../../context/LocalizationContext';
import { PLANOS_DE_SERVIDOR } from '../../constants/plans';

export type SubscriptionViewState = 
  | 'loading' | 'error' | 'review_required' | 'trial' | 'pending_payment' 
  | 'active' | 'grace_period' | 'cancel_at_period_end' | 'expired' | 'cancelled' 
  | 'suspended' | 'unknown';

export interface SubscriptionStatus {
  planId?: string | null;
  subscriptionStatus?: string | null;
  subscriptionActive?: boolean | null;
  paymentCompleted?: boolean | null;
  paidUntil?: Date | string | number | null;
  gracePeriodEndsAt?: Date | string | number | null;
  cancelAtPeriodEnd?: boolean | null;
  reviewRequired?: boolean | null;
  isLoading?: boolean;
  isError?: boolean;
}

type SubscriptionStatusWidgetProps = SubscriptionStatus & {
  onManagePlan?: () => void;
};

const resolveSubscriptionViewState = (status: SubscriptionStatus): SubscriptionViewState => {
  if (status.isLoading) return 'loading';
  if (status.isError) return 'error';
  if (!status.planId) return 'unknown';
  if (!PLANOS_DE_SERVIDOR[status.planId]) return 'review_required';
  
  const now = Date.now();
  const paidUntil = status.paidUntil ? new Date(status.paidUntil).getTime() : 0;
  const gracePeriodEndsAt = status.gracePeriodEndsAt ? new Date(status.gracePeriodEndsAt).getTime() : 0;

  if (gracePeriodEndsAt > now) return 'grace_period';
  if (status.cancelAtPeriodEnd && paidUntil > now) return 'cancel_at_period_end';
  if (status.subscriptionStatus === 'trial') return 'trial';
  if (status.subscriptionActive && paidUntil > now) return 'active';
  if (status.subscriptionStatus === 'pending_payment') return 'pending_payment';
  if (status.subscriptionStatus === 'expired' || (paidUntil > 0 && paidUntil < now)) return 'expired';
  if (status.subscriptionStatus === 'cancelled') return 'cancelled';
  if (status.subscriptionStatus === 'suspended') return 'suspended';
  
  return 'unknown';
};

export const SubscriptionStatusWidget: React.FC<SubscriptionStatusWidgetProps> = (props) => {
  const viewState = useMemo(() => resolveSubscriptionViewState(props), [props]);
  const { translateMessage, formatDate: formatLocalizedDate } = useLocalization();

  if (viewState === 'loading') {
    return <div className="animate-pulse bg-slate-200 h-24 w-full rounded-2xl" aria-hidden="true" />;
  }

  if (viewState === 'error') {
    return (
      <div className="bg-white p-4 rounded-2xl border border-rose-100 flex items-center gap-3 text-rose-600">
        <AlertTriangle size={20} />
        <span className="text-sm font-semibold">{translateMessage('erroAoCarregarAssinatura', 'Erro ao carregar assinatura')}</span>
      </div>
    );
  }

  const planName = props.planId && PLANOS_DE_SERVIDOR[props.planId] 
    ? PLANOS_DE_SERVIDOR[props.planId].name 
    : translateMessage('planoDesconhecido', 'Plano Desconhecido');

  const getIcon = () => {
    switch(viewState) {
        case 'active': return <CheckCircle className="text-emerald-600" size={18} />;
        case 'expired': return <XCircle className="text-rose-600" size={18} />;
        default: return <CreditCard className="text-amber-600" size={18} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`p-2 rounded-lg ${viewState === 'active' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
            {getIcon()}
          </span>
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            {translateMessage('assinatura', 'Assinatura')}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-bold text-slate-800">{planName}</h3>
        <p className="text-xs text-slate-500">
          {translateMessage('estado', 'Estado')}: <span className="font-semibold capitalize" data-testid="subscription-status-text">{viewState}</span>
        </p>
        {props.paidUntil && (
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Clock size={14} className="text-slate-400" />
            <span data-testid="paid-until-text">{translateMessage('validoAte', 'Válido até')} {formatLocalizedDate(new Date(props.paidUntil))}</span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={props.onManagePlan}
        data-testid="manage-plan-button"
        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all"
      >
        {translateMessage('gerirAssinatura', 'Gerir Assinatura')}
      </button>
    </motion.div>
  );
};
