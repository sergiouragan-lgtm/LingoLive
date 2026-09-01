import React, { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

interface PaymentSuccessScreenProps {
  onComplete: () => void;
}

export const PaymentSuccessScreen: React.FC<PaymentSuccessScreenProps> = ({ onComplete }) => {
  const isMobileReturn = new URLSearchParams(window.location.search).get("client") === "mobile";
  useEffect(() => {
    if (isMobileReturn) {
      const timer = setTimeout(() => { window.location.href = "lingolive://billing/success"; }, 1200);
      return () => clearTimeout(timer);
    }
    // Automatically redirect after a short delay
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [isMobileReturn, onComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 max-w-sm"
      >
        <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Pagamento Confirmado!</h2>
          <p className="text-slate-400">A sua assinatura está ativa. Redirecionando para o seu dashboard...</p>
        </div>
        {isMobileReturn && <a href="lingolive://billing/success" className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 font-bold text-slate-950">Voltar ao LingoLIVE</a>}
      </motion.div>
    </div>
  );
};
