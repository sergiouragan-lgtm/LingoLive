import React, { useState } from "react";
import { User } from "firebase/auth";
import { db, handleFirestoreError, OperationType } from "../../firebase";
import { doc, updateDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { Sparkles, CheckCircle2, ArrowRight, Brain, Cpu, MessageSquare, Volume2, Trophy, Globe, Download } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLocalization } from "../../context/LocalizationContext";
import { COUNTRY_DETAILS } from "../../data/localizationData";
import { usePWAInstall } from "../../hooks/usePWAInstall";

interface WelcomeScreenProps {
  user: User;
  onComplete: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ user, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { setLocalization, localization } = useLocalization();
  const { isInstallable, install } = usePWAInstall();

  const userName = user.displayName || user.email?.split("@")[0] || "Estudante";

  const handleContinue = async () => {
    setLoading(true);
    setError("");
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        welcomeCompleted: true,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update local storage cache to keep synced
      const cacheKey = `lingolive_user_sub_${user.uid}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          parsed.welcomeCompleted = true;
          localStorage.setItem(cacheKey, JSON.stringify(parsed));
        } catch (e) {}
      }

      onComplete();
    } catch (err: any) {
      console.error("Error completing welcome step:", err);
      setError("Erro ao guardar o progresso no servidor. Por favor, tente novamente.");
      try {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      } catch (handled) {}
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden" id="welcome-onboarding-screen">
      
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <div className="max-w-2xl w-full bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-xl relative z-10 space-y-8">
        
        {/* Brand / Title */}
        <div className="text-center space-y-3 relative">
          <div className="absolute top-0 right-0 z-50">
            <button 
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 transition shadow-lg border border-indigo-400 flex items-center gap-2 px-3 cursor-pointer"
            >
              <span className="text-xl">{(COUNTRY_DETAILS[localization?.country] || COUNTRY_DETAILS.US).flag}</span>
              <Globe className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto"
                >
                  {Object.entries(COUNTRY_DETAILS).map(([code, country]) => {
                    let lang = "pt";
                    let cur = "USD";
                    if (code === 'US' || code === 'ZA') lang = "en";
                    if (code === 'BR') cur = 'BRL';
                    else if (code === 'PT') cur = 'EUR';
                    else if (code === 'AO') cur = 'AOA';
                    else if (code === 'MZ') cur = 'MZN';
                    else if (code === 'ZA') cur = 'ZAR';

                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => {
                          setLocalization({ country: code, language: lang, currency: cur });
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 text-sm text-slate-200 transition text-left cursor-pointer"
                      >
                        <span className="text-xl">{country.flag}</span>
                        <span>{country.name}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="inline-flex p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 mb-2">
            <Sparkles className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 via-indigo-400 to-cyan-300 bg-clip-text text-transparent">
            Olá, {userName}!
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Seja muito bem-vindo ao <span className="font-semibold text-slate-200">LingoLIVE IA</span>. O seu novo ecossistema inteligente de aprendizagem de idiomas.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="space-y-4">
          <h2 className="text-xs font-mono tracking-wider uppercase text-slate-500 font-bold border-b border-slate-800 pb-2">
            O que o espera no LingoLIVE IA:
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="flex gap-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
              <div className="p-2 h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-xs text-slate-200">Conversação Real</h3>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Fale de forma natural com um tutor inteligente que compreende e corrige instantaneamente.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
              <div className="p-2 h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-xs text-slate-200">Plano Sob Medida</h3>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Exercícios dinâmicos ajustados especificamente ao seu nível e objetivos profissionais.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
              <div className="p-2 h-10 w-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0">
                <Volume2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-xs text-slate-200">Treino Auditivo & Fala</h3>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Interaja por voz com múltiplos sotaques e velocidades de dicção configuráveis.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
              <div className="p-2 h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-xs text-slate-200">Acompanhamento B2B</h3>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Métricas de progresso, relatórios pedagógicos e suporte total de áreas escolares.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* PWA Install Promo */}
        {isInstallable && (
          <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-4" id="welcome-pwa-banner">
            <div className="flex items-start gap-3">
              <Download className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs text-slate-200">Instalar LingoLIVE IA</h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Aceda de forma rápida, em ecrã inteiro e offline como uma aplicação nativa.
                </p>
              </div>
            </div>
            <button
              onClick={install}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shrink-0 transition shadow-lg shadow-emerald-600/10 active:scale-95 cursor-pointer"
            >
              Instalar
            </button>
          </div>
        )}

        {/* Steps info */}
        <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-xs text-slate-200">Próximo Passo: Ativação do Plano</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Para desbloquear acesso ao Dashboard Principal e às simulações, escolha o plano ideal ou ative o seu período experimental na próxima etapa.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-4 pt-2">
          {error && (
            <p className="text-xs font-semibold text-rose-400 text-center bg-rose-500/10 border border-rose-500/20 py-2.5 px-4 rounded-xl">
              {error}
            </p>
          )}

          <button
            onClick={handleContinue}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>A guardar...</span>
            ) : (
              <>
                <span>Continuar para Pagamentos</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
