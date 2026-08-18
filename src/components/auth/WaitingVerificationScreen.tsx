import React, { useState } from "react";
import { db, auth } from "../../firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { signOut, User } from "firebase/auth";
import { 
  Mail, 
  CheckCircle2, 
  RefreshCw, 
  LogOut, 
  Sparkles, 
  ShieldAlert 
} from "lucide-react";
import { motion } from "motion/react";

interface WaitingVerificationScreenProps {
  user: User;
  userProfile: any;
  onVerified: (updatedProfile: any) => void;
}

export const WaitingVerificationScreen: React.FC<WaitingVerificationScreenProps> = ({ 
  user, 
  userProfile, 
  onVerified 
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSimulateVerification = async () => {
    setIsVerifying(true);
    setMessage(null);
    try {
      // 1. Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 2. Update status to EMAIL_VERIFIED in Firestore
      const userRef = doc(db, "users", user.uid);
      const updatedProfile = {
        ...userProfile,
        status: "EMAIL_VERIFIED",
        emailVerifiedAt: new Date().toISOString(),
        updatedAt: serverTimestamp()
      };

      await updateDoc(userRef, {
        status: "EMAIL_VERIFIED",
        emailVerifiedAt: new Date(),
        updatedAt: serverTimestamp()
      });

      // 3. Update localStorage cache
      const cacheKey = `lingolive_user_sub_${user.uid}`;
      localStorage.setItem(cacheKey, JSON.stringify(updatedProfile));

      // 4. Fire callback to reload app state
      onVerified(updatedProfile);
    } catch (err: any) {
      console.error("Verification error:", err);
      setMessage({ type: 'error', text: "Erro ao verificar e-mail. Por favor, tente novamente." });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    setMessage(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      setMessage({ type: 'success', text: "E-mail de verificação reenviado com sucesso para " + user.email });
    } catch (err) {
      setMessage({ type: 'error', text: "Não foi possível reenviar o e-mail no momento." });
    } finally {
      setIsResending(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6 md:p-8" id="waiting-verification-screen">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-100 p-6 sm:p-8 text-center relative overflow-hidden"
      >
        {/* Step Badge */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100">
          <div className="h-full w-1/4 bg-gradient-to-r from-indigo-500 to-cyan-500" />
        </div>

        <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 relative">
          <Mail className="w-6 h-6 animate-pulse" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">!</div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          Verificação de E-mail
        </h1>
        <p className="text-xs text-indigo-600 font-semibold tracking-wider uppercase mb-4">
          Estado: Registro Pendente
        </p>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Enviamos um e-mail de confirmação para <strong className="text-slate-900 font-semibold">{user.email}</strong>. 
          Por favor, verifique a sua caixa de entrada para ativar a sua conta e prosseguir.
        </p>

        {message && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-3.5 rounded-xl text-xs mb-6 font-medium ${
              message.type === 'success' 
                ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' 
                : 'bg-rose-50 border border-rose-100 text-rose-700'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleSimulateVerification}
            disabled={isVerifying}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white font-medium text-sm rounded-xl shadow-md shadow-indigo-100 hover:shadow-lg hover:shadow-indigo-200 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            id="btn-simulate-verify"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Confirmando código...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirmar Verificação (Simulado)
              </>
            )}
          </button>

          <button
            onClick={handleResendEmail}
            disabled={isResending || isVerifying}
            className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            id="btn-resend-verification"
          >
            {isResending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Reenviar E-mail de Verificação
          </button>
        </div>

        <div className="border-t border-slate-100 my-6 pt-5 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-500" />
            Ambiente Seguro LingoLIVE IA
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1.5 hover:underline cursor-pointer"
            id="btn-waiting-signout"
          >
            <LogOut className="w-3.5 h-3.5" />
            Terminar Sessão
          </button>
        </div>
      </motion.div>
    </div>
  );
};
