import React, { useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { ExecutiveAIChat } from "./ExecutiveAIChat";
import { auth } from "../../../firebase";
import { useAnalytics } from "../../../hooks/useAnalytics";
import { useMonitoring } from "../../../hooks/useMonitoring";

export const ExecutiveAICommandCenter = () => {
  const userId = auth.currentUser?.uid || "";
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  useEffect(() => {
    if (userId) {
      trackEvent("executive_ai_command_center_viewed", {
        componentType: "ai_command_center",
        adminSection: "gap"
      });
    }
  }, [userId, trackEvent]);

  return (
    <div className="bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-700">
      <h3 className="text-white font-bold flex items-center gap-2 mb-4">
        <MessageSquare className="text-indigo-400" /> Executive AI Command Center
      </h3>
      <ExecutiveAIChat />
    </div>
  );
};
