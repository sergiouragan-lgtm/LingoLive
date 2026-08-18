import React, { useState, useEffect } from "react";
import { usePWAInstall } from "../../hooks/usePWAInstall";
import { Download, X, Sparkles, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function InstallBanner() {
  const { isInstallable, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState<boolean>(true);

  useEffect(() => {
    // Check if user previously dismissed the install banner in this session or locally
    const dismissed = localStorage.getItem("lingolive_pwa_banner_dismissed");
    if (dismissed !== "true") {
      setIsDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("lingolive_pwa_banner_dismissed", "true");
  };

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setIsDismissed(true);
    }
  };

  // Only display if the PWA is installable and the banner has not been dismissed
  if (!isInstallable || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-indigo-950 border-b border-indigo-500/20 text-white py-3 px-4 sm:px-6 relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-lg z-50"
        id="pwa-install-banner"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-transparent to-transparent pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Smartphone className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-indigo-400 tracking-wider uppercase">Plataforma PWA</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>
            <p className="text-xs sm:text-sm text-slate-200 font-medium">
              Instale a aplicação <span className="text-indigo-300 font-bold">LingoLIVE IA</span> no seu telemóvel ou computador para acesso offline e melhor desempenho!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10 self-end sm:self-auto">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800/30 rounded-lg transition-all cursor-pointer border border-transparent hover:border-slate-850"
            title="Ignorar sugestão"
          >
            Mais tarde
          </button>
          
          <button
            onClick={handleInstall}
            className="bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-indigo-950/20 hover:scale-[1.02] transition-all flex items-center gap-1.5 cursor-pointer border border-indigo-400/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar Agora</span>
          </button>

          <button
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/30 rounded-lg transition-all cursor-pointer ml-1"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
