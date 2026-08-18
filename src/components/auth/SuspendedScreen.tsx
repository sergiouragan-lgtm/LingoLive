import React, { useState } from "react";
import { db, auth } from "../../firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { signOut, User } from "firebase/auth";
import { 
  ShieldAlert, 
  LogOut, 
  Unlock, 
  HelpCircle,
  RefreshCw 
} from "lucide-react";
import { motion } from "motion/react";

interface SuspendedScreenProps {
  user: User;
  userProfile: any;
  onUnlocked: (updatedProfile: any) => void;
}

export const SuspendedScreen: React.FC<SuspendedScreenProps> = ({ 
  user, 
  userProfile, 
  onUnlocked 
}) => {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [supportMessage, setSupportMessage] = useState(false);

  const handleSimulateUnlock = async () => {
    setIsUnlocking(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const userRef = doc(db, "users", user.uid);
      const updatedProfile = {
        ...userProfile,
        status: "ACTIVE",
        unlockedAt: new Date().toISOString(),
        updatedAt: serverTimestamp()
      };

      await updateDoc(userRef, {
        status: "ACTIVE",
        unlockedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update localStorage cache
      const cacheKey = `lingolive_user_sub_${user.uid}`;
      localStorage.setItem(cacheKey, JSON.stringify(updatedProfile));

      // Callback
      onUnlocked(updatedProfile);
    } catch (err) {
      console.error("Error unlocking account:", err);
    } finally {
      setIsUnlocking(false);
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
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6 md:p-8" id="suspended-screen">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md bg-white border border-rose-100 rounded-2xl shadow-xl shadow-rose-50/50 p-6 sm:p-8 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-rose-100">
          <div className="h-full w-full bg-rose-500" />
        </div>

        <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-50 border border-rose-100 text-rose-500">
          <ShieldAlert className="w-6 h-6 animate-pulse" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          Acesso Suspenso
        </h1>
        <p className="text-xs text-rose-600 font-semibold tracking-wider uppercase mb-4">
          Conta Bloqueada
        </p>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Esta conta foi temporariamente suspensa por violar as regras de integridade institucional ou políticas de uso aceitável da plataforma LingoLIVE IA.
        </p>

        {supportMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl mb-6 font-medium text-left leading-relaxed"
          >
            Para solicitar a revisão da sua suspensão, envie uma mensagem para o administrador escolar ou contacte o nosso suporte institucional através do email: 
            <span className="block mt-1 font-semibold text-indigo-600">suporte@lingolive.edu</span>
          </motion.div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => setSupportMessage(prev => !prev)}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
            id="btn-contact-support"
          >
            <HelpCircle className="w-4 h-4" />
            Contactar Suporte Escolar
          </button>

          <button
            onClick={handleSimulateUnlock}
            disabled={isUnlocking}
            className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 hover:border-emerald-300 font-semibold text-xs rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            id="btn-simulate-unlock"
          >
            {isUnlocking ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Desbloqueando conta...
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5" />
                Desbloquear Conta (Simulação Admin)
              </>
            )}
          </button>
        </div>

        <div className="border-t border-slate-100 my-6 pt-5 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-mono">
            ID: {user.uid.slice(0, 8)}...
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1.5 hover:underline cursor-pointer"
            id="btn-suspended-signout"
          >
            <LogOut className="w-3.5 h-3.5" />
            Terminar Sessão
          </button>
        </div>
      </motion.div>
    </div>
  );
};
