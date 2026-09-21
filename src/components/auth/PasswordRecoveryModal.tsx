import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { auth } from '../../firebase';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useMonitoring } from '../../hooks/useMonitoring';

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecover: () => void;
  email: string;
  setEmail: (email: string) => void;
  loading: boolean;
  error: string;
  successMessage: string;
}

export const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({
  isOpen,
  onClose,
  onRecover,
  email,
  setEmail,
  loading,
  error,
  successMessage,
}) => {
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  useEffect(() => {
    if (isOpen) {
      trackEvent('password_recovery_modal_opened', {
        modalType: 'password_reset'
      });
    }
  }, [isOpen, trackEvent]);

  useEffect(() => {
    if (successMessage) {
      trackEvent('password_recovery_successful', {
        email: email,
        modalType: 'password_reset'
      });
    }
  }, [successMessage, email, trackEvent]);

  useEffect(() => {
    if (error) {
      trackEvent('password_recovery_error', {
        errorOccurred: true,
        email: email,
        modalType: 'password_reset'
      });
    }
  }, [error, email, trackEvent]);

  const handleRecover = () => {
    if (email) {
      trackEvent('password_recovery_submitted', {
        email: email,
        modalType: 'password_reset'
      });
    }
    onRecover();
  };

  const handleClose = () => {
    trackEvent('password_recovery_modal_closed', {
      hasEmail: !!email,
      modalType: 'password_reset'
    });
    onClose();
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Recuperar Palavra-Passe</h2>
              <button onClick={handleClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMessage ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 text-emerald-400">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <p className="text-sm">{successMessage}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-slate-400 text-sm">
                  Introduza o seu e-mail abaixo e enviaremos instruções para redefinir a sua palavra-passe.
                </p>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      placeholder="exemplo@email.com"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-xs bg-red-950/30 p-3 rounded-lg border border-red-900/50">
                    <AlertCircle className="w-4 h-4" />
                    <p>{error}</p>
                  </div>
                )}

                <button
                  onClick={handleRecover}
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar e-mail de recuperação'}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
