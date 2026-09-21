import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  AlertCircle,
  Check,
  ChevronRight,
  Lock,
  CreditCard,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { recordCoppaConsentWithVerification } from "../../services/coppaEnforcement.service";
import { auth } from "../../firebase";
import { useAnalytics } from "../../hooks/useAnalytics";
import { useMonitoring } from "../../hooks/useMonitoring";

interface CoppaConsentFlowProps {
  studentName: string;
  studentAge: number;
  studentId: string;
  parentEmail: string;
  parentName: string;
  onConsentConfirmed?: () => void;
  onCancel?: () => void;
}

export const CoppaConsentFlow: React.FC<CoppaConsentFlowProps> = ({
  studentName,
  studentAge,
  studentId,
  parentEmail,
  parentName,
  onConsentConfirmed,
  onCancel,
}) => {
  const [step, setStep] = useState<"intro" | "verification" | "confirmation">(
    "intro"
  );
  const [creditCardVerified, setCreditCardVerified] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { showToast } = useToast();
  const userId = auth.currentUser?.uid || "";
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  useEffect(() => {
    if (userId) {
      trackEvent("coppa_consent_flow_started", {
        studentAge: studentAge,
        studentId: studentId,
        flowType: "parental_consent"
      });
    }
  }, [userId, studentId, studentAge, trackEvent]);

  const handleVerifyCreditCard = async () => {
    if (userId) {
      trackEvent("coppa_credit_card_verification_started", {
        studentId: studentId,
        parentEmail: parentEmail
      });
    }
    setIsProcessing(true);
    try {
      // Simulação - em produção, integrar com Stripe ou similar
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setCreditCardVerified(true);
      setStep("confirmation");
      if (userId) {
        trackEvent("coppa_credit_card_verified", {
          studentId: studentId,
          success: true
        });
      }
      showToast(
        "Cartão de crédito verificado com sucesso",
        "success"
      );
    } catch (error) {
      if (userId) {
        trackEvent("coppa_credit_card_verification_failed", {
          studentId: studentId,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
      showToast(
        "Erro ao verificar cartão de crédito. Tente novamente.",
        "error"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmConsent = async () => {
    if (!creditCardVerified) {
      showToast(
        "Por favor, verifique seu cartão de crédito primeiro.",
        "warning"
      );
      return;
    }

    if (userId) {
      trackEvent("coppa_consent_submission_started", {
        studentId: studentId,
        parentEmail: parentEmail
      });
    }

    setIsProcessing(true);
    try {
      const result = await recordCoppaConsentWithVerification(
        studentId,
        parentEmail,
        parentEmail,
        parentName,
        true
      );

      if (result.success) {
        if (userId) {
          trackEvent("coppa_consent_recorded", {
            studentId: studentId,
            success: true,
            parentName: parentName
          });
        }
        showToast(result.message, "success");
        onConsentConfirmed?.();
      } else {
        if (userId) {
          trackEvent("coppa_consent_failed", {
            studentId: studentId,
            message: result.message
          });
        }
        showToast(result.message, "error");
      }
    } catch (error) {
      if (userId) {
        trackEvent("coppa_consent_error", {
          studentId: studentId,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
      showToast(
        "Erro ao processar consentimento. Tente novamente.",
        "error"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {step === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8"
          >
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Shield className="w-16 h-16 text-indigo-600" />
                  <Lock className="w-6 h-6 text-emerald-600 absolute bottom-0 right-0" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Consentimento Parental COPPA
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Lei de Proteção de Privacidade Online das Crianças (COPPA)
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-600 p-4 mb-6 rounded">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                    Por que isto é necessário?
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {studentName} tem {studentAge} anos. Como é menor de 13 anos, a lei
                    federal COPPA (EUA) e GDPR (UE) exigem consentimento parental verificado
                    antes de qualquer recolha de dados pessoais.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Conta protegida
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Apenas o pai/mãe pode autorizar atividades sensíveis
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Dados privados
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Nenhuma informação pessoal será partilhada sem consentimento
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Controlo parental
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Acesso total ao portal parental para monitorizar progresso
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep("verification")}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <span>Prosseguir com Verificação</span>
                <ChevronRight className="w-4 h-4" />
              </motion.button>

              {onCancel && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onCancel}
                  className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                >
                  Cancelar
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {step === "verification" && (
          <motion.div
            key="verification"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Verificação do Cartão de Crédito
            </h2>

            <div className="bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-600 p-4 mb-6 rounded">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Para cumprir com COPPA, precisamos verificar que é um adulto usando um
                cartão de crédito válido. Esta verificação é segura e não resultará em
                qualquer cobrança.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                <p className="font-semibold text-slate-900 dark:text-white mb-2">
                  Dados do Titular
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {parentName}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {parentEmail}
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                <p className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Cartão de Crédito
                </p>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white mb-3"
                  disabled={isProcessing}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    disabled={isProcessing}
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    disabled={isProcessing}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleVerifyCreditCard}
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition disabled:opacity-50"
              >
                {isProcessing ? "A Verificar..." : "Verificar Cartão"}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep("intro")}
                disabled={isProcessing}
                className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition disabled:opacity-50"
              >
                Voltar
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === "confirmation" && (
          <motion.div
            key="confirmation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center"
          >
            <div className="mb-6">
              <div className="flex justify-center mb-4">
                <Check className="w-16 h-16 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Cartão Verificado!
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Agora pode confirmar o consentimento parental
              </p>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-900/30 border-l-4 border-emerald-600 p-4 mb-6 rounded text-left">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Ao confirmar, você concorda que é um responsável legal de{" "}
                <strong>{studentName}</strong> (idade {studentAge}) e que autoriza a sua
                participação no LingoLive sob conformidade com COPPA.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConfirmConsent}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                "A Processar..."
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Confirmar Consentimento
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
