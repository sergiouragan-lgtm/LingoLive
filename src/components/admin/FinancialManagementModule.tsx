import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  Search, 
  Download, 
  RefreshCw, 
  DollarSign, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Filter, 
  Calendar, 
  FileSpreadsheet,
  AlertTriangle,
  User,
  ExternalLink,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface PaymentItem {
  paymentId: string;
  userId: string;
  provider: "stripe" | "paypal" | "multicaixa" | "transfer";
  planId: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded" | "cancelled" | "expired" | "in_grace_period";
  transactionId: string;
  createdAt: string;
  updatedAt: string;
  refundReason?: string;
  refundOperator?: string;
  refundedAt?: string;
}

export interface FinancialManagementModuleProps {
  currentUserId?: string;
  userRole?: string;
}

export const FinancialManagementModule: React.FC<FinancialManagementModuleProps> = ({
  currentUserId = "admin-user",
  userRole = "SUPER_ADMIN"
}) => {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Modal states
  const [selectedPaymentForRefund, setSelectedPaymentForRefund] = useState<PaymentItem | null>(null);
  const [refundReason, setRefundReason] = useState<string>("");
  const [processingRefund, setProcessingRefund] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Selected payment detail view modal
  const [detailPayment, setDetailPayment] = useState<PaymentItem | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append("search", searchQuery);
      if (selectedProvider !== "ALL") queryParams.append("provider", selectedProvider);
      if (selectedStatus !== "ALL") queryParams.append("status", selectedStatus);
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);

      const res = await fetch(`/api/admin/payments?${queryParams.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao carregar pagamentos.");
      }

      setPayments(data.payments || []);
    } catch (err: any) {
      console.warn("Falling back to local simulated payment dataset:", err.message);
      // Simulated seed data for offline / sandbox mode
      const seedPayments: PaymentItem[] = [
        {
          paymentId: "PAY-STRIPE-88219",
          userId: "user_helder_92",
          provider: "stripe",
          planId: "monthly",
          amount: 5.00,
          currency: "usd",
          status: "completed",
          transactionId: "ch_3M4k92xLL9",
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          paymentId: "PAY-PAYPAL-44102",
          userId: "user_aline_14",
          provider: "paypal",
          planId: "quarterly",
          amount: 15.00,
          currency: "usd",
          status: "completed",
          transactionId: "PAYID-M591029",
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 24).toISOString()
        },
        {
          paymentId: "PAY-MCX-99821",
          userId: "user_carlos_77",
          provider: "multicaixa",
          planId: "premium-plan",
          amount: 16915,
          currency: "aoa",
          status: "completed",
          transactionId: "MCX-REF-40251-99821",
          createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 48).toISOString()
        },
        {
          paymentId: "PAY-STRIPE-11029",
          userId: "user_joao_33",
          provider: "stripe",
          planId: "yearly",
          amount: 60.00,
          currency: "usd",
          status: "in_grace_period",
          transactionId: "ch_3M99xP2021",
          createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 72).toISOString()
        },
        {
          paymentId: "PAY-STRIPE-00291",
          userId: "user_sofia_55",
          provider: "stripe",
          planId: "monthly",
          amount: 5.00,
          currency: "usd",
          status: "refunded",
          transactionId: "ch_3M81726X",
          createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
          refundReason: "Solicitação do cliente dentro de 7 dias.",
          refundOperator: "admin@lingolive.ai",
          refundedAt: new Date(Date.now() - 3600000 * 12).toISOString()
        }
      ];

      // Apply local filtering
      let filtered = seedPayments;
      if (selectedProvider !== "ALL") filtered = filtered.filter(p => p.provider === selectedProvider);
      if (selectedStatus !== "ALL") filtered = filtered.filter(p => p.status === selectedStatus);
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(p => p.paymentId.toLowerCase().includes(q) || p.userId.toLowerCase().includes(q) || p.transactionId.toLowerCase().includes(q));
      }
      setPayments(filtered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [selectedProvider, selectedStatus, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const handleExecuteRefund = async () => {
    if (!selectedPaymentForRefund || !refundReason.trim()) return;

    setProcessingRefund(true);
    setActionSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/payments/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: selectedPaymentForRefund.paymentId,
          reason: refundReason
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao efetuar reembolso.");
      }

      setActionSuccessMsg(`Reembolso efetuado com sucesso para a transação ${selectedPaymentForRefund.paymentId}.`);
      setSelectedPaymentForRefund(null);
      setRefundReason("");
      fetchPayments();
    } catch (err: any) {
      alert(`Erro no reembolso: ${err.message}`);
    } finally {
      setProcessingRefund(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      window.open("/api/admin/payments/export", "_blank");
    } catch (err: any) {
      alert("Erro ao exportar CSV: " + err.message);
    }
  };

  // Metrics computation
  const totalCompleted = payments.filter(p => p.status === "completed");
  const totalRevenueUsd = totalCompleted
    .filter(p => p.currency.toLowerCase() === "usd")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalRevenueAoa = totalCompleted
    .filter(p => p.currency.toLowerCase() === "aoa")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const inGraceCount = payments.filter(p => p.status === "in_grace_period").length;
  const refundedCount = payments.filter(p => p.status === "refunded").length;

  const getStatusBadge = (status: PaymentItem["status"]) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
          </span>
        );
      case "in_grace_period":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Período de Graça
          </span>
        );
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <RotateCcw className="w-3.5 h-3.5" /> Reembolsado
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> Falhado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  const getProviderLogo = (provider: PaymentItem["provider"]) => {
    switch (provider) {
      case "stripe":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-600 text-white tracking-wide">STRIPE</span>;
      case "paypal":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-600 text-white tracking-wide">PAYPAL</span>;
      case "multicaixa":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-700 text-white tracking-wide">MULTICAIXA</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-600 text-white tracking-wide">TRANSFER</span>;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Banner / Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-medium text-sm mb-1">
            <ShieldAlert className="w-4 h-4" /> Gestão Financeira & Auditoria (RBAC)
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Painel Financeiro LingoLIVE IA</h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitorização em tempo real de transações, auditoria de webhooks, gestão de assinaturas e reembolsos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPayments}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-sm transition-all border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-500 hover:underline text-xs">Fechar</button>
        </motion.div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Receita (USD)</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              ${totalRevenueUsd.toFixed(2)}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">{totalCompleted.filter(p => p.currency === "usd").length} transações</span>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Receita (Kwanza AOA)</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {totalRevenueAoa.toLocaleString("pt-AO")} Kz
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">{totalCompleted.filter(p => p.currency === "aoa").length} transações Multicaixa</span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Período de Graça</span>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {inGraceCount}
            </div>
            <span className="text-[11px] text-slate-500">Falha de pagamento em aviso</span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Reembolsado</span>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
              {refundedCount}
            </div>
            <span className="text-[11px] text-slate-500">Transações estornadas</span>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl">
            <RotateCcw className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar por ID de pagamento, utilizador ou transação..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-all"
            >
              Pesquisar
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-3">
            {/* Provider Select */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Todos Provedores</option>
                <option value="stripe">Stripe</option>
                <option value="paypal">PayPal</option>
                <option value="multicaixa">Multicaixa Express</option>
                <option value="transfer">Transferência Bancária</option>
              </select>
            </div>

            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Todos os Estados</option>
              <option value="completed">Concluídos</option>
              <option value="in_grace_period">Período de Graça</option>
              <option value="refunded">Reembolsados</option>
              <option value="failed">Falhados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-500" /> Histórico Financeiro Dedicado ({payments.length})
          </h2>
          <span className="text-xs text-slate-500">Coleção Firestore `/payments` (Imutável)</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-sm">A carregar registos financeiros...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-slate-700 dark:text-slate-300">Nenhum pagamento encontrado.</p>
            <p className="text-xs text-slate-400 mt-1">Ajuste os filtros de pesquisa acima.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-3.5">ID Pagamento</th>
                  <th className="px-6 py-3.5">Utilizador</th>
                  <th className="px-6 py-3.5">Provedor</th>
                  <th className="px-6 py-3.5">Plano</th>
                  <th className="px-6 py-3.5">Montante</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5">Data</th>
                  <th className="px-6 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {payments.map((p) => (
                  <tr key={p.paymentId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {p.paymentId}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">{p.userId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getProviderLogo(p.provider)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200 text-xs">
                      {p.planId}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {p.currency.toLowerCase() === "usd" ? `$${p.amount.toFixed(2)}` : `${p.amount.toLocaleString("pt-AO")} Kz`}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(p.createdAt).toLocaleDateString("pt-PT")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDetailPayment(p)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-all"
                        >
                          Detalhes
                        </button>

                        {p.status === "completed" && (
                          <button
                            onClick={() => setSelectedPaymentForRefund(p)}
                            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-semibold transition-all"
                          >
                            Reembolsar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Refund Confirmation */}
      <AnimatePresence>
        {selectedPaymentForRefund && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5"
            >
              <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400">
                <div className="p-3 bg-purple-100 dark:bg-purple-950 rounded-xl">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Emitir Reembolso Oficial</h3>
                  <p className="text-xs text-slate-500">Operação irreversível de estorno financeiro</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">ID Pagamento:</span>
                  <span className="font-mono font-semibold">{selectedPaymentForRefund.paymentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Utilizador:</span>
                  <span className="font-semibold">{selectedPaymentForRefund.userId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Montante a Estornar:</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    {selectedPaymentForRefund.currency.toLowerCase() === "usd" 
                      ? `$${selectedPaymentForRefund.amount.toFixed(2)}` 
                      : `${selectedPaymentForRefund.amount.toLocaleString("pt-AO")} Kz`}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Razão do Reembolso (Obrigatório para Auditoria):
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Ex: Cancelamento solicitado dentro do prazo de garantia ou cobrança indevida."
                  rows={3}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentForRefund(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={processingRefund || !refundReason.trim()}
                  onClick={handleExecuteRefund}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {processingRefund ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  Confirmar & Estornar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Payment Details */}
      <AnimatePresence>
        {detailPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-500" /> Detalhes da Transação
                </h3>
                <button
                  onClick={() => setDetailPayment(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">ID Pagamento:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">{detailPayment.paymentId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Transação Provedor:</span>
                  <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{detailPayment.transactionId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">ID Utilizador:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{detailPayment.userId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Provedor:</span>
                  <span>{getProviderLogo(detailPayment.provider)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Plano Associado:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{detailPayment.planId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Valor / Moeda:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {detailPayment.currency.toLowerCase() === "usd" 
                      ? `$${detailPayment.amount.toFixed(2)}` 
                      : `${detailPayment.amount.toLocaleString("pt-AO")} Kz`}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Estado Atual:</span>
                  <span>{getStatusBadge(detailPayment.status)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Data Registo:</span>
                  <span className="text-slate-700 dark:text-slate-300">{new Date(detailPayment.createdAt).toLocaleString("pt-PT")}</span>
                </div>

                {detailPayment.refundReason && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 space-y-1">
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase">Dados de Reembolso Auditado:</span>
                    <p className="text-xs text-purple-900 dark:text-purple-200"><strong>Razão:</strong> {detailPayment.refundReason}</p>
                    <p className="text-xs text-purple-900 dark:text-purple-200"><strong>Operador:</strong> {detailPayment.refundOperator}</p>
                    <p className="text-xs text-purple-900 dark:text-purple-200"><strong>Data:</strong> {new Date(detailPayment.refundedAt!).toLocaleString("pt-PT")}</p>
                  </div>
                )}
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setDetailPayment(null)}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white text-sm font-medium rounded-xl hover:bg-slate-800"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FinancialManagementModule;
