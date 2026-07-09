import React, { useState } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../../firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, query, collection, where } from 'firebase/firestore';
import { Lock, User, Eye, EyeOff, Sparkles, Languages, MessageSquare, Mic } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetMessage('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message === "Firebase: Error (auth/invalid-credential)." ? "E-mail ou senha incorretos." : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setResetMessage('');
    if (!email) {
      setError('Por favor, digite seu e-mail no campo acima para redefinir sua senha.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetMessage('E-mail de redefinição de senha enviado com sucesso! Verifique sua caixa de entrada.');
    } catch (err: any) {
      console.error('Password reset error:', err);
      let friendlyError = err.message;
      if (err.code === 'auth/user-not-found' || err.message?.includes('user-not-found')) {
        friendlyError = 'Nenhum usuário cadastrado com este e-mail.';
      } else if (err.code === 'auth/invalid-email' || err.message?.includes('invalid-email')) {
        friendlyError = 'E-mail inválido.';
      }
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setResetMessage('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      const userEmail = userCredential.user.email || "";
      const isSystemAdmin = userEmail.toLowerCase().includes('sergio.uragan@gmail.com');
      let userRole = isSystemAdmin ? 'Admin' : 'Student';

      // 1. Check custom email permissions
      try {
        const permSnap = await getDoc(doc(db, 'email_permissions', userEmail.toLowerCase().trim()));
        if (permSnap.exists()) {
          userRole = permSnap.data().role;
        } else {
          // 2. Fallback check: is this user registered as a teacher?
          const tQuery = query(collection(db, 'teachers'), where('email', '==', userEmail.toLowerCase().trim()));
          const tSnap = await getDocs(tQuery);
          if (!tSnap.empty) {
            userRole = 'Educator';
          } else {
            // 3. Fallback check: is this user registered as a student?
            const sQuery = query(collection(db, 'students'), where('uid', '==', userCredential.user.uid));
            const sSnap = await getDocs(sQuery);
            if (!sSnap.empty) {
              userRole = 'Student';
            }
          }
        }
      } catch (err) {
        console.warn("Could not retrieve custom email permissions, defaulting:", err);
      }

      // Create user profile in Firestore if it doesn't exist or merge role
      try {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            role: userRole,
            displayName: userCredential.user.displayName || "Usuário",
            photoURL: userCredential.user.photoURL || "",
            createdAt: new Date(),
            subscriptionActive: true // Keep active so they can access the platform
        }, { merge: true });
      } catch (dbErr: any) {
        handleFirestoreError(dbErr, OperationType.WRITE, `users/${userCredential.user.uid}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 md:bg-white md:grid md:grid-cols-12 overflow-hidden" id="auth-screen">
      
      {/* LEFT COLUMN: Institutional Copy (Real-Time AI Voice Conversations) */}
      <div className="hidden md:flex md:col-span-7 bg-[#1e0a45] text-white p-16 flex-col justify-between relative overflow-hidden h-full">
        {/* Abstract Glowing Lights */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-600 blur-[150px]"></div>
          <div className="absolute -bottom-40 right-0 w-[500px] h-[500px] rounded-full bg-cyan-500 blur-[120px]"></div>
        </div>

        {/* Brand / Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
            <Languages className="w-5 h-5 text-cyan-300" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-clip-text bg-gradient-to-r from-white to-slate-200">
            LingoLive AI
          </span>
        </div>

        {/* Core Marketing Pitch */}
        <div className="relative z-10 max-w-xl space-y-8 my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-white text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Conversação por Voz por IA de Ultra-baixa Latência</span>
          </div>

          <div className="space-y-4">
            <h1 className="font-extrabold text-4xl sm:text-5xl leading-[1.15] tracking-tight text-white">
              Fale qualquer idioma com <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-300">
                Fluência e Confiança
              </span>
            </h1>
            <p className="text-slate-300 text-base leading-relaxed">
              O LingoLive conecta você instantaneamente com tutores inteligentes de inteligência artificial. Escolha um cenário do mundo real, converse naturalmente e receba relatórios imediatos de gramática e feedback de voz.
            </p>
          </div>

          {/* Interactive Feature Points */}
          <div className="grid grid-cols-2 gap-6 pt-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-cyan-300">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Voz em Tempo Real</h4>
                <p className="text-xs text-slate-400 mt-0.5">Sem digitação, fale como se fosse humano.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-cyan-300">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Relatório Inteligente</h4>
                <p className="text-xs text-slate-400 mt-0.5">Gramática analisada palavra por palavra.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-slate-400">
          © {new Date().getFullYear()} LingoLive AI Corp. Todos os direitos reservados.
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Login Form & Google Authenticator */}
      <div className="col-span-12 md:col-span-5 bg-slate-950 md:bg-slate-50 flex items-center justify-center p-6 sm:p-12 min-h-screen md:h-screen py-10 md:py-0 relative overflow-y-auto">
        <div className="w-full max-w-sm space-y-8 my-auto">
          
          {/* Header on mobile */}
          <div className="text-center md:text-left space-y-2">
            <div className="md:hidden flex items-center justify-center gap-2 mb-6">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center">
                <Languages className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">LingoLive AI</span>
            </div>
            <h2 className="text-2xl font-bold text-white md:text-slate-900 tracking-tight">Fazer login na plataforma</h2>
            <p className="text-sm text-slate-400 md:text-slate-500">Comece a falar em poucos minutos.</p>
          </div>

          {/* Social Authenticator Button */}
          <div>
            <button 
              onClick={handleGoogleSignIn} 
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl transition duration-200 shadow-sm hover:shadow-md cursor-pointer text-sm"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              Continuar com o Google
            </button>
          </div>

          <div className="relative flex items-center justify-center my-6">
            <div className="w-full border-t border-slate-800 md:border-slate-200"></div>
            <span className="absolute bg-slate-950 md:bg-slate-50 px-3 text-[10px] uppercase tracking-wider font-bold text-slate-500">ou usar e-mail</span>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 md:text-slate-600 uppercase tracking-wider mb-1.5">Endereço de e-mail</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 md:bg-white border border-slate-800 md:border-slate-200 rounded-xl py-3 pl-11 pr-4 text-white md:text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm transition"
                  placeholder="seu@email.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-400 md:text-slate-600 uppercase tracking-wider">Sua senha</label>
                <button 
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-xs text-indigo-400 md:text-indigo-600 hover:underline font-bold transition-colors focus:outline-none cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 md:bg-white border border-slate-800 md:border-slate-200 rounded-xl py-3 pl-11 pr-11 text-white md:text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm transition"
                  placeholder="••••••••••••••••"
                  required
                  disabled={loading}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            {resetMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-medium">
                {resetMessage}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/10 cursor-pointer text-sm"
            >
              {loading ? "Entrando..." : "Entrar com E-mail"}
            </button>
          </form>

        </div>
      </div>

    </div>
  );
};
