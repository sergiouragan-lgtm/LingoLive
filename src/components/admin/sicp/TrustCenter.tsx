import React, { useEffect } from "react";
import { motion } from "motion/react";
import { CheckCircle, ShieldCheck } from "lucide-react";
import { auth } from "../../../firebase";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { useMonitoring } from "../../../hooks/useMonitoring";

export const TrustCenter = () => {
  const userId = auth.currentUser?.uid || "";
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  useEffect(() => {
    if (userId) {
      trackEvent("trust_center_viewed", {
        dashboardType: "platform_trust",
        adminSection: "sicp"
      });
    }
  }, [userId, trackEvent]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6"
    >
      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
        <ShieldCheck className="text-emerald-500" /> LingoLIVE Trust Center
      </h2>
      <div className="space-y-4">
        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="font-medium text-slate-700">Estado Global da Plataforma</span>
            <span className="text-emerald-600 font-bold flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Operacional</span>
        </div>
      </div>
    </motion.div>
  );
};
