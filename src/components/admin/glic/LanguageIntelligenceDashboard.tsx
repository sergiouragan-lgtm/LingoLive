import React, { useEffect } from "react";
import { motion } from "motion/react";
import { Languages, Mic, Globe } from "lucide-react";
import { SpeechIntelligenceMonitor } from "./SpeechIntelligenceMonitor";
import { auth } from "../../../firebase";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { useMonitoring } from "../../../hooks/useMonitoring";

export const LanguageIntelligenceDashboard = () => {
  const userId = auth.currentUser?.uid || "";
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  useEffect(() => {
    if (userId) {
      trackEvent("language_intelligence_dashboard_viewed", {
        dashboardType: "language_intelligence_cloud",
        adminSection: "glic"
      });
    }
  }, [userId, trackEvent]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-8"
    >
      <h1 className="text-3xl font-black text-slate-900">Global Language Intelligence Cloud</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><Languages className="text-indigo-500" /> Language Models</h3>
            <p className="text-slate-600 text-sm">Status: <span className="font-bold text-emerald-600">Operational</span></p>
        </div>
        <SpeechIntelligenceMonitor />
      </div>
    </motion.div>
  );
};
