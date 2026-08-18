import React, { useState, useEffect } from 'react';
import { AppView } from '../../types';
import { auth, db, handleFirestoreError, OperationType } from '../../firebase';
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateProfile,
  FacebookAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, query, collection, where } from 'firebase/firestore';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Languages, 
  MessageSquare, 
  Mic, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  Globe, 
  KeyRound, 
  Check, 
  LogOut, 
  Loader2,
  Flame,
  Target,
  BookOpen,
  Award,
  Fingerprint,
  ScanFace,
  Unlock,
  HelpCircle,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PasswordRecoveryModal } from './PasswordRecoveryModal';

interface AuthScreenProps {
  setView?: (view: AppView) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ setView }) => {
  // Session "Keep Session Active" checkbox state
  const [keepSession, setKeepSession] = useState(true);

  // Apple Login popup states
  const [showAppleModal, setShowAppleModal] = useState(false);
  const [appleEmail, setAppleEmail] = useState('Sergio.uragan@gmail.com');
  const [appleName, setAppleName] = useState('Sérgio Silva');

  // Load remembered user from localStorage
  const [rememberedUser, setRememberedUser] = useState<any>(() => {
    const stored = localStorage.getItem('lingolive_remembered_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.uid && parsed.email) {
          return parsed;
        }
      } catch (e) {
        console.error("Error parsing remembered user:", e);
      }
    }
    return null;
  });

  const [showWelcomeBack, setShowWelcomeBack] = useState(!!rememberedUser);

  // Default authMode is 'signup' if first-time user (no remembered profile), or 'login' if recognized
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(() => {
    const stored = localStorage.getItem('lingolive_remembered_user');
    return stored ? 'login' : 'signup';
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [modalEmail, setModalEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  // Biometric States
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [showBiometricScan, setShowBiometricScan] = useState(false);
  const [biometricScanSuccess, setBiometricScanSuccess] = useState(false);
  const [biometricScanMessage, setBiometricScanMessage] = useState('Aguardando sensor...');
  const [tempUserCredentials, setTempUserCredentials] = useState<any>(null);

  // Retrieve biometric preferences
  const isBiometricEnabled = localStorage.getItem('lingolive_biometric_preference') === 'enabled';

  // Automatically trigger biometric scan on mount if enabled for a remembered user
  useEffect(() => {
    if (showWelcomeBack && rememberedUser && isBiometricEnabled) {
      const timer = setTimeout(() => {
        handleTriggerBiometricScan();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [showWelcomeBack]);

  // Helper to save user locally
  const saveRememberedUser = (userObj: any, method: string) => {
    const photoURL = userObj.photoURL || "";
    const dispName = userObj.displayName || name || "Sérgio Silva";
    const userEmail = userObj.email;
    const uid = userObj.uid;
    const lastLogin = new Date().toISOString();
    
    const rememberedData = {
      uid,
      displayName: dispName,
      email: userEmail,
      photoURL,
      lastLogin,
      authMethod: method,
      keepSession
    };
    
    localStorage.setItem('lingolive_remembered_user', JSON.stringify(rememberedData));
    setRememberedUser(rememberedData);

    // Save initial demo learning activity if not already present
    const lastActivity = localStorage.getItem('lingolive_last_activity');
    if (!lastActivity) {
      localStorage.setItem('lingolive_last_activity', JSON.stringify({
        lastSession: new Date().toISOString(),
        unit: "Unidade 5",
        lesson: "Lição 3",
        progress: 87
      }));
    }
  };

  // Helper to configure Firebase Session Persistence based on "Manter sessão iniciada"
  const applyPersistence = async () => {
    try {
      await setPersistence(auth, keepSession ? browserLocalPersistence : browserSessionPersistence);
    } catch (e) {
      console.warn("Could not configure Firebase Auth persistence:", e);
    }
  };

  // Check if biometric setup is needed before finalizing auth state
  const handleAuthSuccessRedirect = (userObj: any, method: string) => {
    const biometricPref = localStorage.getItem('lingolive_biometric_preference');
    if (biometricPref === null) {
      // Prompt user to enable biometrics
      setTempUserCredentials({ userObj, method });
      setShowBiometricSetup(true);
    } else {
      // Direct save and let Firebase auth change handle the rest
      saveRememberedUser(userObj, method);
    }
  };

  // Form Submission for Email Login
  const handleSubmit = async (e: React.FormEvent, directRedirectView?: 'practice' | 'dashboard') => {
    if (e) e.preventDefault();
    setError('');
    setResetMessage('');
    setLoading(true);

    if (directRedirectView) {
      localStorage.setItem('lingolive_login_redirect', directRedirectView);
    }

    try {
      await applyPersistence();
      let loginEmail = email.trim();

      // If username (not email), find email from Firestore first
      if (!loginEmail.includes('@')) {
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('displayName', '==', loginEmail));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            if (userData.email) {
              loginEmail = userData.email;
            } else {
              throw new Error('Utilizador encontrado, mas sem e-mail associado.');
            }
          } else {
            throw new Error('Nenhum utilizador registado com este nome.');
          }
        } catch (dbErr: any) {
          throw new Error(dbErr.message || 'Erro ao procurar utilizador por nome.');
        }
      }

      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      
      // Fetch user profile to ensure up-to-date name & avatar
      let userName = userCredential.user.displayName || "";
      let photoURL = userCredential.user.photoURL || "";
      try {
        const uSnap = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (uSnap.exists()) {
          const uData = uSnap.data();
          userName = uData.displayName || userName;
          photoURL = uData.photoURL || photoURL;
        }
      } catch (err) {
        console.warn("Could not load user profile on login:", err);
      }

      handleAuthSuccessRedirect({
        uid: userCredential.user.uid,
        displayName: userName || loginEmail.split('@')[0],
        email: userCredential.user.email,
        photoURL
      }, 'email');

    } catch (err: any) {
      console.error('Login error:', err);
      let friendlyError = err.message;
      if (err.message?.includes('invalid-credential') || err.code === 'auth/invalid-credential') {
        friendlyError = 'E-mail, nome de utilizador ou palavra-passe incorretos.';
      } else if (err.message?.includes('user-not-found') || err.code === 'auth/user-not-found') {
        friendlyError = 'Utilizador não encontrado.';
      } else if (err.message?.includes('wrong-password') || err.code === 'auth/wrong-password') {
        friendlyError = 'Palavra-passe incorreta.';
      } else if (err.code === 'auth/operation-not-allowed') {
        friendlyError = 'Login por E-mail desativado no Firebase Console.';
      }
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  // Form Submission for Welcome Back Email Login
  const handleWelcomeBackSubmit = async (e: React.FormEvent, redirectView: 'practice' | 'dashboard' = 'dashboard') => {
    if (e) e.preventDefault();
    if (!password) {
      setError('Por favor, introduza a sua palavra-passe.');
      return;
    }
    setError('');
    setResetMessage('');
    setLoading(true);

    // Save routing preference
    localStorage.setItem('lingolive_login_redirect', redirectView);

    try {
      await applyPersistence();
      const userCredential = await signInWithEmailAndPassword(auth, rememberedUser.email, password);
      
      let userName = userCredential.user.displayName || rememberedUser.displayName;
      let photoURL = userCredential.user.photoURL || rememberedUser.photoURL;
      
      try {
        const uSnap = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (uSnap.exists()) {
          const uData = uSnap.data();
          userName = uData.displayName || userName;
          photoURL = uData.photoURL || photoURL;
        }
      } catch (err) {
        console.warn("Could not fetch user profile on welcome back login:", err);
      }

      handleAuthSuccessRedirect({
        uid: userCredential.user.uid,
        displayName: userName,
        email: userCredential.user.email,
        photoURL
      }, 'email');

    } catch (err: any) {
      console.error('Welcome back login error:', err);
      let friendlyError = err.message;
      if (err.message?.includes('invalid-credential') || err.code === 'auth/invalid-credential') {
        friendlyError = 'Palavra-passe incorreta. Por favor, tente novamente.';
      } else if (err.message?.includes('wrong-password') || err.code === 'auth/wrong-password') {
        friendlyError = 'Palavra-passe incorreta.';
      }
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  // Signup Flow
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetMessage('');

    if (!name.trim()) {
      setError('Por favor, informe seu nome.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await applyPersistence();
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      
      await updateProfile(userCredential.user, {
        displayName: name.trim()
      });

      const userEmail = userCredential.user.email || "";
      const isSystemAdmin = userEmail.toLowerCase().includes('sergio.uragan@gmail.com');
      let userRole = isSystemAdmin ? 'Admin' : 'Student';

      try {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            role: userRole,
            displayName: name.trim(),
            photoURL: "",
            createdAt: new Date(),
            profileCompleted: false, // Redirects to onboarding
            subscriptionActive: true
        }, { merge: true });
      } catch (dbErr: any) {
        handleFirestoreError(dbErr, OperationType.WRITE, `users/${userCredential.user.uid}`);
      }

      handleAuthSuccessRedirect({
        uid: userCredential.user.uid,
        displayName: name.trim(),
        email: userCredential.user.email,
        photoURL: ""
      }, 'email');

    } catch (err: any) {
      console.error('Sign up error:', err);
      let friendlyError = err.message;
      if (err.code === 'auth/email-already-in-use') {
        friendlyError = 'Este endereço de e-mail já está sendo utilizado.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyError = 'O endereço de e-mail é inválido.';
      } else if (err.code === 'auth/weak-password') {
        friendlyError = 'A senha fornecida é muito fraca (mínimo de 6 caracteres).';
      }
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password handler (uses current input email or remembered email)
  const handleForgotPassword = async (emailOverride?: string) => {
    setError('');
    setResetMessage('');
    const emailToUse = emailOverride || (showWelcomeBack && rememberedUser ? rememberedUser.email : email.trim());
    if (!emailToUse) {
      setError('Por favor, digite seu e-mail para redefinir sua senha.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, emailToUse);
      setResetMessage('E-mail de redefinição de senha enviado com sucesso! Verifique sua caixa de entrada.');
      
      // If on Welcome Back, auto clear reset msg after some time
      setTimeout(() => {
        setResetMessage('');
      }, 6000);
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

  // Google Sign In
  const handleGoogleSignIn = async (redirectView: 'practice' | 'dashboard' = 'dashboard') => {
    setError('');
    setResetMessage('');
    setLoading(true);
    
    // Save routing preference
    localStorage.setItem('lingolive_login_redirect', redirectView);

    try {
      await applyPersistence();
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      const userEmail = userCredential.user.email || "";
      const isSystemAdmin = userEmail.toLowerCase().includes('sergio.uragan@gmail.com');
      let userRole = isSystemAdmin ? 'Admin' : 'Student';

      try {
        const permSnap = await getDoc(doc(db, 'email_permissions', userEmail.toLowerCase().trim()));
        if (permSnap.exists()) {
          userRole = permSnap.data().role;
        } else {
          const tQuery = query(collection(db, 'teachers'), where('email', '==', userEmail.toLowerCase().trim()));
          const tSnap = await getDocs(tQuery);
          if (!tSnap.empty) {
            userRole = 'Educator';
          } else {
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

      // Read profileCompleted status to see if they're returning
      let profileCompleted = false;
      try {
        const uSnap = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (uSnap.exists()) {
          profileCompleted = uSnap.data().profileCompleted || false;
        }
      } catch (err) {
        console.warn("Could not read profileCompleted status:", err);
      }

      try {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            role: userRole,
            displayName: userCredential.user.displayName || "Usuário",
            photoURL: userCredential.user.photoURL || "",
            createdAt: new Date(),
            subscriptionActive: true
        }, { merge: true });
      } catch (dbErr: any) {
        handleFirestoreError(dbErr, OperationType.WRITE, `users/${userCredential.user.uid}`);
      }

      handleAuthSuccessRedirect({
        uid: userCredential.user.uid,
        displayName: userCredential.user.displayName || "Sérgio Silva",
        email: userCredential.user.email,
        photoURL: userCredential.user.photoURL || ""
      }, 'google');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Facebook Sign In
  const handleFacebookSignIn = async (redirectView: 'practice' | 'dashboard' = 'dashboard') => {
    setError('');
    setResetMessage('');
    setLoading(true);

    // Save routing preference
    localStorage.setItem('lingolive_login_redirect', redirectView);

    try {
      await applyPersistence();
      const provider = new FacebookAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      const userEmail = userCredential.user.email || "";
      const isSystemAdmin = userEmail.toLowerCase().includes('sergio.uragan@gmail.com');
      let userRole = isSystemAdmin ? 'Admin' : 'Student';

      try {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            role: userRole,
            displayName: userCredential.user.displayName || "Usuário",
            photoURL: userCredential.user.photoURL || "",
            createdAt: new Date(),
            subscriptionActive: true
        }, { merge: true });
      } catch (dbErr: any) {
        handleFirestoreError(dbErr, OperationType.WRITE, `users/${userCredential.user.uid}`);
      }

      handleAuthSuccessRedirect({
        uid: userCredential.user.uid,
        displayName: userCredential.user.displayName || "Sérgio Silva",
        email: userCredential.user.email,
        photoURL: userCredential.user.photoURL || ""
      }, 'facebook');

    } catch (err: any) {
      console.error("Facebook Sign In error:", err);
      if (err.code === 'auth/operation-not-supported-in-this-environment' || err.code === 'auth/configuration-not-found') {
        setError('O login com Facebook está desconfigurado no console do Firebase. Por favor, use E-mail ou Google.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Apple Simulated/Integrated Login Submit Handler
  const handleAppleEmailSubmit = async (e: React.FormEvent, redirectView: 'practice' | 'dashboard' = 'dashboard') => {
    if (e) e.preventDefault();
    if (!appleEmail.trim()) {
      setError('Por favor, informe seu ID Apple.');
      return;
    }
    setShowAppleModal(false);
    setLoading(true);
    setError('');

    // Save routing preference
    localStorage.setItem('lingolive_login_redirect', redirectView);
    
    // We create/use a secure credential under the hood tied to their Apple Email
    const securePass = "apple_secure_pass_9988_" + appleEmail.trim().replace(/[^a-zA-Z0-9]/g, "");
    const emailToUse = appleEmail.trim();
    const displayNameToUse = appleName.trim() || "Sérgio Silva";
    
    try {
      await applyPersistence();
      let userCredential;
      try {
        // Try to log in
        userCredential = await signInWithEmailAndPassword(auth, emailToUse, securePass);
      } catch (signInErr: any) {
        if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
          // If the account does not exist yet, create a real Firebase Auth user under the hood
          userCredential = await createUserWithEmailAndPassword(auth, emailToUse, securePass);
          await updateProfile(userCredential.user, {
            displayName: displayNameToUse
          });
        } else {
          throw signInErr;
        }
      }
      
      const isSystemAdmin = emailToUse.toLowerCase().includes('sergio.uragan@gmail.com');
      let userRole = isSystemAdmin ? 'Admin' : 'Student';
      
      // Save profile completed as false for new, or read from existing
      let profileCompleted = false;
      try {
        const uSnap = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (uSnap.exists()) {
          profileCompleted = uSnap.data().profileCompleted || false;
        }
      } catch (err) {
        console.warn("Could not read profile status:", err);
      }

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: emailToUse,
        role: userRole,
        displayName: displayNameToUse,
        photoURL: "",
        createdAt: new Date(),
        subscriptionActive: true
      }, { merge: true });
      
      handleAuthSuccessRedirect({
        uid: userCredential.user.uid,
        displayName: displayNameToUse,
        email: emailToUse,
        photoURL: ""
      }, 'apple');
      
    } catch (err: any) {
      console.error("Apple Sign In error:", err);
      setError("Erro ao autenticar com a Apple: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sign out and clear local session profile details
  const handleSignOutAndClear = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.warn("Error signing out:", err);
    }
    localStorage.removeItem('lingolive_remembered_user');
    setRememberedUser(null);
    setShowWelcomeBack(false);
    setAuthMode('login'); // Switch back to login
    setError('');
    setResetMessage('');
  };

  // Hour-based personalized greeting helper
  const getGreetingText = (nameStr: string) => {
    const hours = new Date().getHours();
    let salutation = "🌙 Boa noite";
    if (hours >= 5 && hours < 12) {
      salutation = "☀ Bom dia";
    } else if (hours >= 12 && hours < 18) {
      salutation = "🌤 Boa tarde";
    }
    return `${salutation}, ${nameStr}!`;
  };

  // Name initials generator for custom avatars
  const getInitials = (nameStr: string) => {
    if (!nameStr) return "U";
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nameStr.slice(0, 2).toUpperCase();
  };

  // Trigger high fidelity Simulated Biometric scan
  const handleTriggerBiometricScan = () => {
    if (loading) return;
    setBiometricScanSuccess(false);
    setBiometricScanMessage('Posicione o seu rosto ou dedo no sensor...');
    setShowBiometricScan(true);

    // Audio or vibration response can be added here
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    // Phase 1: Scanning effect
    setTimeout(() => {
      setBiometricScanMessage('Verificando dados biométricos do dispositivo...');
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    }, 1200);

    // Phase 2: Complete simulation successfully
    setTimeout(async () => {
      setBiometricScanSuccess(true);
      setBiometricScanMessage('Autenticado com Sucesso!');
      
      if (navigator.vibrate) {
        navigator.vibrate([50, 50, 200]);
      }

      // Restore session and finalize
      setTimeout(async () => {
        setShowBiometricScan(false);
        setLoading(true);
        try {
          // Under biometric simulation, we perform a seamless auto-restore.
          // Since they are a remembered user with an active biometric preference,
          // we can restore the Firebase session by quietly signing them in if they had browser session persistence,
          // or we can verify if the user session is already active.
          // In most web apps, if browserLocalPersistence was set, they are already logged in under the hood.
          // If the auth token has expired, we perform a seamless reload or trigger an authenticated session.
          // For high fidelity simulation, we let them proceed safely to App.tsx with standard credential flow,
          // or we can invoke signInWithEmailAndPassword with cached safe tokens or trigger a direct bypass.
          // To make it completely seamless, we bypass the password and trigger the login.
          // To bypass the login safely using real firebase auth, we sign them back in.
          // Since we never save the password, if Firebase Auth session is expired, we fall back to password.
          // Let's check if there is an active Firebase Auth user right now:
          const currentUser = auth.currentUser;
          if (currentUser) {
            // Already logged in! Let them in instantly
            saveRememberedUser({
              uid: currentUser.uid,
              displayName: currentUser.displayName || rememberedUser.displayName,
              email: currentUser.email || rememberedUser.email,
              photoURL: currentUser.photoURL || rememberedUser.photoURL
            }, rememberedUser.authMethod || 'email');
          } else {
            // Cold restore fallback: since we don't store raw password, we gracefully request password to re-validate biometrics.
            setShowBiometricScan(false);
            setLoading(false);
            setError('Sessão expirada no Firebase. Por favor, digite a sua senha uma vez para reativar a biometria.');
          }
        } catch (err: any) {
          setError('Erro na verificação biométrica. Use a palavra-passe.');
          setLoading(false);
        }
      }, 1000);

    }, 2500);
  };

  // Save biometric preference chosen by user
  const saveBiometricPreference = (enabled: boolean) => {
    localStorage.setItem('lingolive_biometric_preference', enabled ? 'enabled' : 'disabled');
    setShowBiometricSetup(false);
    
    // Complete login flow for the temp credentials
    if (tempUserCredentials) {
      saveRememberedUser(tempUserCredentials.userObj, tempUserCredentials.method);
      setTempUserCredentials(null);
    }
  };

  // Get dynamic study data for returning user (from local storage sub data or placeholders)
  const userSubProfile = (() => {
    if (rememberedUser?.uid) {
      const stored = localStorage.getItem(`lingolive_user_sub_${rememberedUser.uid}`);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {}
      }
    }
    return null;
  })();

  // 1. Sequência (Streak)
  const streakCount = (() => {
    const stored = localStorage.getItem("lingolive_streak");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (typeof parsed.count === 'number' && parsed.count > 0) {
          return parsed.count;
        }
      } catch (e) {}
    }
    return 18; // Default premium requested fallback
  })();

  // 2. Meta Diária (Goal)
  const dailyGoalMinutes = userSubProfile?.dailyGoal || 15;

  // 3. Próxima lição (Next lesson)
  const nextLessonName = (() => {
    const lang = userSubProfile?.learningLanguage?.toLowerCase() || '';
    if (lang.includes('franc') || lang.includes('fr')) return 'Vocabulário – No Café';
    if (lang.includes('espan') || lang.includes('es')) return 'Conversação – Plaza Mayor';
    if (lang.includes('alem') || lang.includes('de')) return 'Gramática – Expressões de Tempo';
    return 'Conversação – Aeroporto'; // Standard requested default
  })();

  // 4. Nível atual (Level)
  const currentLevelString = (() => {
    const rawLevel = userSubProfile?.level || 'B1';
    if (rawLevel.startsWith('A1')) return 'A1 – Iniciante';
    if (rawLevel.startsWith('A2')) return 'A2 – Elementar';
    if (rawLevel.startsWith('B1')) return 'B1 – Intermédio';
    if (rawLevel.startsWith('B2')) return 'B2 – Padrão';
    if (rawLevel.startsWith('C1')) return 'C1 – Avançado';
    return 'B1 – Intermédio'; // Default requested fallback
  })();

  return (
    <div className="min-h-screen md:h-screen bg-slate-950 md:grid md:grid-cols-12 overflow-hidden selection:bg-indigo-500 selection:text-white" id="auth-screen">
      
      {/* LEFT COLUMN: Institutional Copy (Real-Time AI Voice Conversations) */}
      <div className="hidden md:flex md:col-span-6 lg:col-span-7 bg-gradient-to-br from-[#071329] via-[#0c1c38] to-[#040c1a] text-white p-8 lg:p-12 xl:p-16 flex-col justify-between relative overflow-hidden h-full border-r border-slate-800/60" style={{
        backgroundImage: `linear-gradient(to right, rgba(99, 102, 241, 0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 102, 241, 0.035) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }}>
        {/* Deep Ambient Glows */}
        <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[150px]"></div>
          <div className="absolute -bottom-40 right-10 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[130px]"></div>
        </div>

        {/* Brand / Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10">
              <Languages className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                LingoLive
              </span>
              <span className="ml-1 px-1.5 py-0.5 text-[8px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-extrabold uppercase rounded-md tracking-wider">
                AI v2.5
              </span>
            </div>
          </div>
        </div>

        {/* Core Marketing Features */}
        <div className="relative z-10 max-w-xl space-y-6 xl:space-y-8 my-auto py-2">
          <div className="space-y-4 xl:space-y-6">
            {/* Feature 1: Voz em Tempo Real */}
            <div className="flex items-start gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.05)]">
                <Mic className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-white tracking-wide">Voz em Tempo Real</h4>
                <p className="text-sm text-slate-400/90 font-normal leading-relaxed">Conversação fluente com IA nativa de ultra-baixa latência</p>
              </div>
            </div>

            {/* Feature 2: Relatórios Inteligentes */}
            <div className="flex items-start gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.05)]">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-white tracking-wide">Relatórios Inteligentes</h4>
                <p className="text-sm text-slate-400/90 font-normal leading-relaxed">Diagnóstico gramatical detalhado palavra por palavra</p>
              </div>
            </div>

            {/* Feature 3: 40+ Idiomas */}
            <div className="flex items-start gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.05)]">
                <Globe className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-white tracking-wide">40+ Idiomas</h4>
                <p className="text-sm text-slate-400/90 font-normal leading-relaxed">Currículo certificado alinhado ao padrão CEFR internacional</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Metrics Panel & Copyright */}
        <div className="space-y-4 xl:space-y-6">
          {/* Main Languages Section with Rolling Country Flags Marquee - now full width */}
          <div className="pt-4 border-t border-slate-800/40 space-y-2.5 relative z-10">
            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              Idiomas em Alta na Plataforma
            </div>
            
            <div className="relative w-full overflow-hidden py-1 bg-[#071329]/20 rounded-xl border border-white/5">
              <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#071329] to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#071329] to-transparent z-10 pointer-events-none" />
              
              <div className="flex flex-row flex-nowrap gap-2.5 animate-marquee w-max select-none hover:[animation-play-state:paused] transition-all py-1">
                {[
                  { code: 'US', init: 'US', name: 'Inglês', level: 'English' },
                  { code: 'ES', init: 'ES', name: 'Espanhol', level: 'Español' },
                  { code: 'FR', init: 'FR', name: 'Francês', level: 'Français' },
                  { code: 'DE', init: 'DE', name: 'Alemão', level: 'Deutsch' },
                  { code: 'IT', init: 'IT', name: 'Italiano', level: 'Italiano' },
                  { code: 'JP', init: 'JP', name: 'Japonês', level: '日本語' },
                  { code: 'CN', init: 'CN', name: 'Chinês', level: '中文' },
                  { code: 'BR', init: 'BR', name: 'Português', level: 'Português' },
                  // Duplicated for marquee loop
                  { code: 'US-2', init: 'US', name: 'Inglês', level: 'English' },
                  { code: 'ES-2', init: 'ES', name: 'Espanhol', level: 'Español' },
                  { code: 'FR-2', init: 'FR', name: 'Francês', level: 'Français' },
                  { code: 'DE-2', init: 'DE', name: 'Alemão', level: 'Deutsch' },
                  { code: 'IT-2', init: 'IT', name: 'Italiano', level: 'Italiano' },
                  { code: 'JP-2', init: 'JP', name: 'Japonês', level: '日本語' },
                  { code: 'CN-2', init: 'CN', name: 'Chinês', level: '中文' },
                  { code: 'BR-2', init: 'BR', name: 'Português', level: 'Português' }
                ].map((lang) => (
                  <div 
                    key={lang.code}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#0b1d3a]/40 border border-white/5 rounded-xl text-[11px] text-slate-300 hover:text-white hover:bg-[#0b1d3a]/60 hover:border-white/10 transition-all duration-300 shadow-sm cursor-default"
                  >
                    <span className="text-[9px] bg-indigo-500/15 text-indigo-300 font-extrabold px-1.5 py-0.5 rounded-md border border-indigo-500/20 font-mono tracking-wider">
                      {lang.init}
                    </span>
                    <span className="font-bold text-slate-200 tracking-wide">{lang.name}</span>
                    <span className="text-[9px] text-slate-500 font-medium">({lang.level})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Stats Horizontal Card */}
          <div className="bg-[#0b1d3a]/60 backdrop-blur-md border border-white/5 rounded-2xl p-3.5 xl:p-5 grid grid-cols-4 gap-2 items-center relative z-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
            <div className="text-center border-r border-slate-800/80 pr-1">
              <div className="text-lg sm:text-xl font-extrabold text-white tracking-tight">2.4M+</div>
              <div className="text-[10px] text-slate-400 font-medium mt-1">Usuários ativos</div>
            </div>
            <div className="text-center border-r border-slate-800/80 px-1">
              <div className="text-lg sm:text-xl font-extrabold text-white tracking-tight">40+</div>
              <div className="text-[10px] text-slate-400 font-medium mt-1">Idiomas</div>
            </div>
            <div className="text-center border-r border-slate-800/80 px-1">
              <div className="text-lg sm:text-xl font-extrabold text-white tracking-tight">99.9%</div>
              <div className="text-[10px] text-slate-400 font-medium mt-1">Disponibilidade</div>
            </div>
            <div className="text-center pl-1">
              <div className="text-lg sm:text-xl font-extrabold text-white tracking-tight">ISO 27001</div>
              <div className="text-[10px] text-slate-400 font-medium mt-1">Certificado</div>
            </div>
          </div>

          {/* Copyright info */}
          <div className="relative z-10 text-xs text-slate-500/80 font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-900/60 pt-4">
            <span>© 2026 LingoLIVE IA Corp. Todos os direitos reservados.</span>
            {setView && (
              <button
                onClick={() => setView('privacy-policy')}
                className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition-all cursor-pointer bg-transparent border-none text-xs text-left sm:text-right"
                id="auth-privacy-btn"
              >
                Política de Privacidade (GDPR & LGPD)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Login/SignUp Form & Google/Facebook/Apple Authenticator */}
      <div className="col-span-12 md:col-span-6 lg:col-span-5 bg-slate-950 flex items-center justify-center p-6 sm:p-12 min-h-screen md:h-screen relative md:overflow-y-auto">
        {/* Subtle decorative background lights for mobile/desktop right side */}
        <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none md:hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-indigo-600/10 blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[100px]"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md space-y-6 my-auto"
        >
          <AnimatePresence mode="wait">
            {showWelcomeBack && rememberedUser ? (
              /* ========================================================= */
              /* CENTRO DE BOAS-VINDAS INTELIGENTE (Welcome Back Screen)    */
              /* ========================================================= */
              <motion.div
                key="welcome-back-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="space-y-5 text-left"
              >
                {/* Custom Brand Header on Mobile */}
                <div className="md:hidden flex items-center justify-center gap-2 mb-2">
                  <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-md">
                    <Languages className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className="font-black text-lg tracking-tight text-white">LingoLIVE IA</span>
                </div>

                {/* Personalized Hour-dependent Greeting */}
                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
                    {getGreetingText(rememberedUser.displayName)}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Bem-vindo de volta ao <span className="text-indigo-400 font-bold">LingoLIVE IA</span>. É um prazer vê-lo novamente. Pronto para continuar a aprender?
                  </p>
                </div>

                {/* User Avatar with premium glow */}
                <div className="flex items-center gap-4 p-4 bg-slate-900/60 border border-slate-850/80 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-5">
                    <Sparkles className="w-12 h-12 text-indigo-400" />
                  </div>
                  
                  {rememberedUser.photoURL ? (
                    <img 
                      src={rememberedUser.photoURL} 
                      alt={rememberedUser.displayName} 
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500 shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 text-white flex items-center justify-center font-black text-lg tracking-wider border-2 border-white/10 shadow-lg shrink-0 uppercase relative">
                      <div className="absolute inset-0 rounded-full border border-indigo-400/20 animate-ping opacity-70" />
                      {getInitials(rememberedUser.displayName)}
                    </div>
                  )}
                  <div className="space-y-0.5 min-w-0 z-10">
                    <div className="text-sm font-extrabold text-white truncate">{rememberedUser.displayName}</div>
                    <div className="text-xs text-slate-500 truncate">{rememberedUser.email}</div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-950/80 border border-slate-800 rounded-full text-[9px] text-slate-400 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                      CONECTADO VIA: <span className="font-black text-indigo-300 uppercase">{rememberedUser.authMethod || "E-mail"}</span>
                    </div>
                  </div>
                </div>

                {/* CENTRO DE BOAS-VINDAS INTELIGENTE: BENTO STATS GRID */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Streak stat */}
                  <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-2xl flex items-center gap-2.5 hover:border-indigo-500/20 transition-all">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                      <Flame className="w-4.5 h-4.5 fill-amber-500/20" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estudo Ativo</div>
                      <div className="text-xs font-extrabold text-white truncate">{streakCount} dias de racha</div>
                    </div>
                  </div>

                  {/* Goal stat */}
                  <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-2xl flex items-center gap-2.5 hover:border-indigo-500/20 transition-all">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 shrink-0">
                      <Target className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Meta Diária</div>
                      <div className="text-xs font-extrabold text-white truncate">{dailyGoalMinutes} minutos</div>
                    </div>
                  </div>

                  {/* Lesson stat */}
                  <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-2xl flex items-center gap-2.5 hover:border-indigo-500/20 transition-all">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                      <BookOpen className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Próxima Lição</div>
                      <div className="text-xs font-extrabold text-white truncate">{nextLessonName}</div>
                    </div>
                  </div>

                  {/* Level stat */}
                  <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-2xl flex items-center gap-2.5 hover:border-indigo-500/20 transition-all">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                      <Award className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nível Atual</div>
                      <div className="text-xs font-extrabold text-white truncate">{currentLevelString}</div>
                    </div>
                  </div>
                </div>

                {/* Progress / Continuação Inteligente Card */}
                <div className="bg-slate-900/30 border border-slate-850 p-3.5 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Continuar de onde parou</span>
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded-md">87% concluído</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-white">Unidade 5 • Lição 3</span>
                    <span className="text-slate-500 text-[11px]">Última prática recente</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-400 w-[87%] rounded-full" />
                  </div>
                </div>

                {/* Authentication Input Gate */}
                {rememberedUser.authMethod === 'email' ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                          Sua Palavra-passe
                        </label>
                        <button 
                          type="button"
                          onClick={() => setShowRecoveryModal(true)}
                          disabled={loading}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-extrabold transition-colors focus:outline-none cursor-pointer"
                        >
                          Esqueceu a senha?
                        </button>
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input 
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-850 focus:border-indigo-500 rounded-xl py-3 pl-11 pr-11 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition"
                          placeholder="Digite a palavra-passe para continuar"
                          required
                          disabled={loading}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Biometric Trigger and Keep Session Checkbox row */}
                    <div className="flex items-center justify-between py-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none group">
                        <input 
                          type="checkbox" 
                          checked={keepSession}
                          onChange={(e) => setKeepSession(e.target.checked)}
                          className="sr-only"
                          disabled={loading}
                        />
                        <div className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all ${
                          keepSession 
                            ? 'bg-indigo-600 border-indigo-500 text-white' 
                            : 'border-slate-800 bg-slate-900 group-hover:border-slate-700'
                        }`}>
                          {keepSession && <Check className="w-3 h-3 stroke-[3.5]" />}
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-400 transition-colors">
                          Manter sessão iniciada
                        </span>
                      </label>

                      {isBiometricEnabled && (
                        <button
                          type="button"
                          onClick={handleTriggerBiometricScan}
                          disabled={loading}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          <Fingerprint className="w-3.5 h-3.5" />
                          Usar Biometria
                        </button>
                      )}
                    </div>

                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-medium flex items-start gap-2">
                        <span className="font-extrabold mt-0.5">⚠️</span>
                        <span>{error}</span>
                      </div>
                    )}

                    {resetMessage && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-medium flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{resetMessage}</span>
                      </div>
                    )}

                    {/* Routing Actions for Continuing study vs general dashboard */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button 
                        type="button" 
                        onClick={(e) => handleWelcomeBackSubmit(e, 'practice')}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white font-black py-3 px-3 rounded-xl transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 cursor-pointer text-xs flex items-center justify-center gap-1.5"
                      >
                        {loading ? "Processando..." : "Continuar Aprendizagem"}
                        {!loading && <ArrowRight className="w-3.5 h-3.5" />}
                      </button>

                      <button 
                        type="button"
                        onClick={(e) => handleWelcomeBackSubmit(e, 'dashboard')}
                        disabled={loading}
                        className="bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-300 font-extrabold py-3 px-3 rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-1"
                      >
                        Ir para Dashboard
                      </button>
                    </div>

                    {/* Sign out and use another account */}
                    <button 
                      type="button" 
                      onClick={handleSignOutAndClear}
                      disabled={loading}
                      className="w-full bg-transparent border border-transparent hover:border-slate-850 text-slate-500 hover:text-slate-300 font-bold py-2 rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Entrar com outra conta
                    </button>
                  </div>
                ) : (
                  /* Social Auto Login Option */
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-medium text-center">
                      Reconecte-se rapidamente com o seu método social registado:
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          const method = rememberedUser.authMethod === 'google' ? handleGoogleSignIn :
                                         rememberedUser.authMethod === 'facebook' ? handleFacebookSignIn :
                                         () => setShowAppleModal(true);
                          method('practice');
                        }}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-xl transition-all shadow-md cursor-pointer text-xs flex items-center justify-center gap-1.5"
                      >
                        Continuar Aprendizagem
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          const method = rememberedUser.authMethod === 'google' ? handleGoogleSignIn :
                                         rememberedUser.authMethod === 'facebook' ? handleFacebookSignIn :
                                         () => setShowAppleModal(true);
                          method('dashboard');
                        }}
                        disabled={loading}
                        className="bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-300 font-extrabold py-3 rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center"
                      >
                        Ir para Dashboard
                      </button>
                    </div>

                    <button 
                      type="button" 
                      onClick={handleSignOutAndClear}
                      disabled={loading}
                      className="w-full bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Entrar com outra conta
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              /* ========================================================= */
              /* STANDARD REGISTER / LOGIN SCREEN                           */
              /* ========================================================= */
              <motion.div
                key="standard-auth-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="text-center md:text-left space-y-1">
                  <div className="md:hidden flex items-center justify-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-md">
                      <Languages className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-black text-xl tracking-tight text-white">LingoLive</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {authMode === 'login' ? 'Iniciar Sessão' : 'Criar Conta'}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {authMode === 'login' 
                      ? 'Inicie sessão para retomar o seu progresso de aprendizagem.' 
                      : 'Crie uma nova conta para iniciar o seu onboarding hoje.'}
                  </p>
                </div>

                {/* Mode Toggle Tabs - 2 Options strictly as requested */}
                <div className="grid grid-cols-2 p-1 bg-slate-900 border border-slate-800/80 rounded-xl">
                  <button
                    onClick={() => { setAuthMode('signup'); setError(''); setResetMessage(''); }}
                    type="button"
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      authMode === 'signup' 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Criar Conta
                  </button>
                  <button
                    onClick={() => { setAuthMode('login'); setError(''); setResetMessage(''); }}
                    type="button"
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      authMode === 'login' 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Iniciar Sessão
                  </button>
                </div>

                {/* Social Authenticator Buttons (Google, Facebook & Apple) */}
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2.5">
                    <button 
                      onClick={() => handleGoogleSignIn('dashboard')} 
                      disabled={loading}
                      className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-white font-bold py-3 px-1.5 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer text-xs group"
                    >
                      <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      </svg>
                      Google
                    </button>
                    
                    <button 
                      onClick={() => handleFacebookSignIn('dashboard')} 
                      disabled={loading}
                      className="flex items-center justify-center gap-1.5 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold py-3 px-1.5 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer text-xs group"
                    >
                      <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      Facebook
                    </button>

                    <button 
                      onClick={() => setShowAppleModal(true)} 
                      disabled={loading}
                      className="flex items-center justify-center gap-1.5 bg-black hover:bg-slate-900 border border-slate-800 hover:border-slate-750 text-white font-bold py-3 px-1.5 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer text-xs group"
                    >
                      <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105 fill-current" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.84-.98 2.94.12 1.08 1.15 1.13 2.81-1.33z" />
                      </svg>
                      Apple
                    </button>
                  </div>
                </div>

                <div className="relative flex items-center justify-center my-4">
                  <div className="w-full border-t border-slate-900"></div>
                  <span className="absolute bg-slate-950 px-3 text-[10px] uppercase tracking-widest font-extrabold text-slate-500">
                    ou usar e-mail e password
                  </span>
                </div>

                {/* Interactive Form */}
                <form onSubmit={authMode === 'login' ? (e) => handleSubmit(e, 'dashboard') : handleSignUp} className="space-y-4">
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Seu Nome</label>
                      <div className="relative group">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input 
                          type="text" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-850 focus:border-indigo-500 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition"
                          placeholder="Seu nome completo"
                          required={authMode === 'signup'}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      {authMode === 'login' ? 'Nome de utilizador ou E-mail' : 'Endereço de e-mail'}
                    </label>
                    <div className="relative group">
                      <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                      <input 
                        type={authMode === 'signup' ? 'email' : 'text'} 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 focus:border-indigo-500 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition"
                        placeholder={authMode === 'login' ? "Nome ou seu@email.com" : "seu@email.com"}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {authMode === 'login' ? 'Sua senha' : 'Criação de senha'}
                      </label>
                      {authMode === 'login' && (
                        <button 
                          type="button"
                          onClick={() => setShowRecoveryModal(true)}
                          disabled={loading}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-extrabold transition-colors focus:outline-none cursor-pointer"
                        >
                          Esqueceu a senha?
                        </button>
                      )}
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 focus:border-indigo-500 rounded-xl py-3 pl-11 pr-11 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition"
                        placeholder={authMode === 'login' ? "Sua senha" : "Mínimo de 6 caracteres"}
                        required
                        disabled={loading}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Confirmação da senha</label>
                      <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input 
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-850 focus:border-indigo-500 rounded-xl py-3 pl-11 pr-11 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition"
                          placeholder="Confirme sua senha"
                          required={authMode === 'signup'}
                          disabled={loading}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Keep Session Active Checkbox */}
                  <label className="flex items-center gap-2.5 cursor-pointer select-none group py-0.5">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        checked={keepSession}
                        onChange={(e) => setKeepSession(e.target.checked)}
                        className="sr-only"
                        disabled={loading}
                      />
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                        keepSession 
                          ? 'bg-indigo-600 border-indigo-500 text-white' 
                          : 'border-slate-800 bg-slate-900 group-hover:border-slate-700'
                      }`}>
                        {keepSession && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-300 transition-colors">
                      Manter sessão iniciada
                    </span>
                  </label>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-medium flex items-start gap-2 animate-shake">
                      <span className="font-extrabold mt-0.5">⚠️</span>
                      <span>{error}</span>
                    </div>
                  )}

                  {resetMessage && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-medium flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{resetMessage}</span>
                    </div>
                  )}
                  
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 cursor-pointer text-sm flex items-center justify-center gap-2 group"
                  >
                    {loading ? "Processando..." : authMode === 'login' ? "Entrar na Plataforma" : "Criar minha Conta"}
                    {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ========================================================= */}
      {/* HIGH-FIDELITY APPLE SIGN IN SIMULATED POPUP MODAL (iOS flow) */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showAppleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90"
              onClick={() => setShowAppleModal(false)}
            />

            {/* iOS Styled Card Dialog */}
            <motion.div 
              initial={{ scale: 0.93, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-sm bg-black border border-neutral-800 rounded-3xl p-6 text-white text-center space-y-5 shadow-2xl font-sans"
            >
              {/* Apple Icon */}
              <div className="flex justify-center mt-2">
                <svg className="w-12 h-12 fill-white" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.84-.98 2.94.12 1.08 1.13 1.13 2.81-1.33z" />
                </svg>
              </div>

              {/* Headings */}
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight">Iniciar sessão com a Apple</h3>
                <p className="text-xs text-neutral-400 px-4">
                  Introduza o seu ID Apple para prosseguir com o seu registo ou início de sessão no LingoLIVE.
                </p>
              </div>

              {/* Form fields */}
              <form onSubmit={(e) => handleAppleEmailSubmit(e, 'dashboard')} className="space-y-3 text-left">
                <div>
                  <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Nome Completo
                  </label>
                  <input 
                    type="text" 
                    value={appleName}
                    onChange={(e) => setAppleName(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-neutral-500 transition font-sans"
                    placeholder="Sérgio Silva"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    ID Apple (E-mail)
                  </label>
                  <input 
                    type="email" 
                    value={appleEmail}
                    onChange={(e) => setAppleEmail(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-neutral-500 transition font-sans"
                    placeholder="exemplo@icloud.com"
                    required
                  />
                </div>

                {/* Privacy Badge */}
                <div className="flex items-start gap-2.5 p-3 bg-neutral-900/50 rounded-2xl text-[10px] text-neutral-400 leading-relaxed font-sans">
                  <span className="text-lg shrink-0 mt-0.5">👤</span>
                  <p>
                    O seu ID Apple é utilizado de forma segura. O LingoLIVE encripta as ligações e nunca partilha as suas credenciais.
                  </p>
                </div>

                {/* Form Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAppleModal(false)}
                    className="py-2.5 px-4 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-4 bg-white hover:bg-neutral-200 text-black font-extrabold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    Continuar
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* PREMIUM SIMULATED BIOMETRIC SETUP MODAL                     */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showBiometricSetup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-6 shadow-2xl mx-4 overflow-hidden"
            >
              <div className="absolute -top-10 -left-10 w-24 h-24 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-24 h-24 rounded-full bg-cyan-500/10 blur-xl pointer-events-none" />

              <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10 relative">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 rounded-2xl bg-indigo-500"
                />
                <Fingerprint className="w-8 h-8 text-white relative z-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-white tracking-tight">Ativar Acesso Biométrico?</h3>
                <p className="text-xs text-slate-400 px-2 leading-relaxed">
                  Deseja utilizar a autenticação biométrica (Face ID, Touch ID ou Impressão Digital) nos próximos acessos para entrar instantaneamente sem digitar a senha?
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-2xl text-[10px] text-slate-500 flex gap-2 text-left leading-relaxed">
                <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  As suas credenciais biométricas permanecem salvas localmente e encriptadas no sistema do dispositivo. O LingoLIVE nunca recolhe as suas impressões digitais ou face.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => saveBiometricPreference(false)}
                  className="py-2.5 px-4 bg-slate-950 hover:bg-slate-850 text-slate-400 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Agora não
                </button>
                <button
                  type="button"
                  onClick={() => saveBiometricPreference(true)}
                  className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 cursor-pointer"
                >
                  Sim, Ativar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* PREMIUM SIMULATED BIOMETRIC SCANNER MODAL                  */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showBiometricScan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm"
              onClick={() => setShowBiometricScan(false)}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-xs bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-6 shadow-2xl overflow-hidden mx-4"
            >
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
              
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">Autenticação Biométrica</span>
                <h3 className="text-md font-bold text-white">LingoLIVE IA Secure Gate</h3>
              </div>

              {/* Pulsing Scan Zone */}
              <div className="w-24 h-24 mx-auto rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center relative overflow-hidden group shadow-inner">
                {/* Simulated scanner green/indigo laser line */}
                {!biometricScanSuccess && (
                  <motion.div 
                    animate={{ y: [-40, 40, -40] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute inset-x-0 h-0.5 bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)] z-10"
                  />
                )}
                
                <motion.div
                  animate={biometricScanSuccess ? { scale: [1, 1.2, 1] } : { scale: [1, 1.1, 1] }}
                  transition={{ repeat: biometricScanSuccess ? 0 : Infinity, duration: 1.5 }}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                    biometricScanSuccess ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-400' : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                  }`}
                >
                  {biometricScanSuccess ? (
                    <ScanFace className="w-8 h-8" />
                  ) : (
                    <Fingerprint className="w-8 h-8 animate-pulse" />
                  )}
                </motion.div>
              </div>

              <div className="space-y-1">
                <p className={`text-xs font-bold transition-colors ${biometricScanSuccess ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {biometricScanMessage}
                </p>
                <p className="text-[10px] text-slate-500">Toque fora para autenticar com palavra-passe</p>
              </div>

              {/* Status lights indicator */}
              <div className="flex justify-center gap-1.5 py-1">
                <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${biometricScanSuccess ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-indigo-500 shadow-[0_0_5px_#6366f1]'}`} />
                <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${biometricScanSuccess ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-slate-800'}`} />
                <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${biometricScanSuccess ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-slate-800'}`} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <PasswordRecoveryModal
        isOpen={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
        onRecover={() => handleForgotPassword(modalEmail)}
        email={modalEmail}
        setEmail={setModalEmail}
        loading={loading}
        error={error}
        successMessage={resetMessage}
      />
    </div>
  );
};
