import React from 'react';
import { Settings, UserCog, ShieldCheck, Sparkles, Lock, Target, Database, Trash2, RefreshCw, Bell, BellRing, BellOff, Clock, Smartphone, AlertCircle, Volume2, Globe, Languages, Sliders, MessageSquare, GraduationCap, Flame, Snowflake, Sun, Moon, Monitor } from "lucide-react";
import { UserRole, AppView, Localization, SavedWord, StreakData } from '../../types';
import { useLocalization } from '../../context/LocalizationContext';
import { useAppTheme } from '../../context/ThemeContext';
import { LocalizationTests } from './LocalizationTests';
import { getCacheSizeEstimate, clearAllOfflineDB } from '../../utils/indexedDB';
import { toggleFullscreen } from '../../utils/fullscreen';
import { fetchSavedWordsFromFirestore } from '../../lib/AchievementsManager';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { reauthenticateWithCredential, EmailAuthProvider, deleteUser } from 'firebase/auth';
import { UserRepository } from '../../repositories/user.repository';
import { simulateStreakRiskNotification } from '../../services/streakNotification.service';
import { LearningMemoryPanel } from '../learning/LearningMemoryPanel';
import {
  isPushNotificationSupported,
  requestNotificationPermission,
  getFCMToken,
  saveNotificationSettingsToFirestore,
  showLocalWebNotification,
  DEFAULT_NOTIFICATION_SETTINGS,
  NotificationSettings
} from '../../lib/pushNotifications';

interface SettingsViewProps {
  role: UserRole;
  isAdminAuthenticated: boolean;
  setRole: (role: UserRole) => void;
  setView: (view: AppView) => void;
  setIsPasswordModalOpen: (open: boolean) => void;
  setAdminPasswordInput: (input: string) => void;
  setAdminPasswordError: (error: string) => void;
  orientation: 'portrait' | 'landscape';
  dailyGoal: number;
  updateDailyGoal: (goal: number) => Promise<void>;
  localization: Localization;
  setLocalization: (loc: Localization) => void;
  userId?: string;
  savedWords?: SavedWord[];
  onVocabularyUpdated?: (words: SavedWord[]) => void;
  streakData?: StreakData;
  onProtectStreakWithPoints?: () => void;
}

const APPEARANCE_OPTIONS = {
  light: { label: 'Editorial Claro', description: 'Luminoso e editorial', icon: Sun },
  dark: { label: 'Índigo Atmosférico', description: 'Profundo e imersivo', icon: Moon },
  system: { label: 'Sistema', description: 'Segue o dispositivo', icon: Monitor },
} as const;

export const SettingsView: React.FC<SettingsViewProps> = ({
  role,
  isAdminAuthenticated,
  setRole,
  setView,
  setIsPasswordModalOpen,
  setAdminPasswordInput,
  setAdminPasswordError,
  orientation,
  dailyGoal,
  updateDailyGoal,
  localization,
  setLocalization,
  userId,
  savedWords,
  onVocabularyUpdated,
  streakData,
  onProtectStreakWithPoints,
}) => {
  const { colorScheme, setColorScheme } = useAppTheme();
  const [cacheStats, setCacheStats] = React.useState<{ count: number; sizeBytes: number }>({ count: 0, sizeBytes: 0 });
  const [isClearing, setIsClearing] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmClear, setConfirmClear] = React.useState(false);
  const { linguisticIdentity, setLinguisticIdentity, isRtl, fallbackLogs, translateMessage } = useLocalization();

  // FCM Push Notifications States
  const [notifSettings, setNotifSettings] = React.useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [permissionState, setPermissionState] = React.useState<NotificationPermission | 'unsupported'>('default');
  const [isUpdatingNotif, setIsUpdatingNotif] = React.useState(false);
  const [testPushStatus, setTestPushStatus] = React.useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Conversational AI States
  const [isVoiceCommandsEnabled, setIsVoiceCommandsEnabled] = React.useState<boolean>(() => {
    return localStorage.getItem("lingolive_voice_commands_enabled") === "true";
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  const [preferredAI, setPreferredAI] = React.useState<string>(() => {
    return localStorage.getItem("lingolive_conversational_ai_model") || "gpt-4o";
  });

  const handleUpdateAIModel = (model: string) => {
    setPreferredAI(model);
    localStorage.setItem("lingolive_conversational_ai_model", model);
  };

  // High-Fidelity Neural TTS States
  const [preferredVoice, setPreferredVoice] = React.useState<string>(() => {
    return localStorage.getItem("lingolive_tts_voice_id") || "21m00Tcm4TlvDq8ikWAM";
  });

  const handleUpdateVoiceModel = (voiceId: string) => {
    setPreferredVoice(voiceId);
    localStorage.setItem("lingolive_tts_voice_id", voiceId);
  };

  // Load notification settings from Firestore
  React.useEffect(() => {
    if (!userId) return;

    const loadNotificationSettings = async () => {
      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.notificationSettings) {
            setNotifSettings({
              enabled: userData.notificationSettings.enabled ?? false,
              dailyReminderEnabled: userData.notificationSettings.dailyReminderEnabled ?? true,
              dailyReminderTime: userData.notificationSettings.dailyReminderTime ?? "09:00",
              lessonReminderEnabled: userData.notificationSettings.lessonReminderEnabled ?? true,
              fcmToken: userData.notificationSettings.fcmToken ?? null
            });
          }
        }
      } catch (err) {
        console.error("Error loading notification settings:", err);
      }
    };

    loadNotificationSettings();

    if (!isPushNotificationSupported()) {
      setPermissionState('unsupported');
    } else {
      setPermissionState(Notification.permission);
    }
  }, [userId]);

  const handleTogglePushNotifications = async () => {
    if (!userId) {
      setTestPushStatus({ type: 'error', text: 'Usuário não autenticado.' });
      return;
    }

    setIsUpdatingNotif(true);
    setTestPushStatus(null);

    try {
      const isCurrentlyEnabled = notifSettings.enabled;
      
      if (!isCurrentlyEnabled) {
        const permission = await requestNotificationPermission();
        setPermissionState(permission);

        if (permission === 'denied') {
          throw new Error('Permissão negada. Ative as permissões nas configurações do seu navegador.');
        }

        const token = await getFCMToken();
        const updatedSettings: NotificationSettings = {
          ...notifSettings,
          enabled: true,
          fcmToken: token
        };

        await saveNotificationSettingsToFirestore(userId, updatedSettings);
        setNotifSettings(updatedSettings);
        setTestPushStatus({ type: 'success', text: 'Notificações Push ativadas com sucesso!' });
      } else {
        const updatedSettings: NotificationSettings = {
          ...notifSettings,
          enabled: false,
          fcmToken: null
        };

        await saveNotificationSettingsToFirestore(userId, updatedSettings);
        setNotifSettings(updatedSettings);
        setTestPushStatus({ type: 'info', text: 'Notificações Push desativadas.' });
      }
    } catch (err: any) {
      console.error(err);
      setTestPushStatus({ type: 'error', text: err.message || 'Erro ao atualizar notificações.' });
    } finally {
      setIsUpdatingNotif(false);
    }
  };

  const handleUpdatePreference = async (key: keyof NotificationSettings, value: any) => {
    if (!userId) return;
    
    const updatedSettings = {
      ...notifSettings,
      [key]: value
    };
    
    setNotifSettings(updatedSettings);
    
    try {
      await saveNotificationSettingsToFirestore(userId, updatedSettings);
    } catch (err) {
      console.error("Erro ao salvar sub-preferência:", err);
    }
  };

  const handleTestPushNotification = async () => {
    if (!userId) {
      setTestPushStatus({ type: 'error', text: 'Usuário não autenticado.' });
      return;
    }

    setIsUpdatingNotif(true);
    setTestPushStatus({ type: 'info', text: 'Disparando notificação de teste...' });

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/send-test-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          userId: userId,
          title: 'LingoLive: Meta de Estudo! 🚀',
          body: 'Está na hora de aprender com a IA de idiomas! Kamba IA te espera.'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar notificação de teste.');
      }

      if (data.status === 'simulated') {
        setTestPushStatus({ 
          type: 'success', 
          text: 'Sucesso! Notificação simulada disparada no ambiente de desenvolvimento.' 
        });
        showLocalWebNotification(data.title, data.body);
      } else {
        setTestPushStatus({ type: 'success', text: data.message });
      }
    } catch (err: any) {
      console.error(err);
      setTestPushStatus({ type: 'error', text: err.message || 'Falha ao testar notificação.' });
    } finally {
      setIsUpdatingNotif(false);
    }
  };

  const loadStats = React.useCallback(async () => {
    const stats = await getCacheSizeEstimate();
    setCacheStats(stats);
  }, []);

  React.useEffect(() => {
    loadStats();
  }, [loadStats, savedWords]);

  React.useEffect(() => {
    if (confirmClear) {
      const t = setTimeout(() => setConfirmClear(false), 4000);
      return () => clearTimeout(t);
    }
  }, [confirmClear]);

  const handleClearCache = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setIsClearing(true);
    setSyncStatus(null);
    try {
      await clearAllOfflineDB();
      if (onVocabularyUpdated) {
        onVocabularyUpdated([]);
      }
      await loadStats();
      setSyncStatus({ type: 'success', text: 'Cache offline limpo com sucesso!' });
      setConfirmClear(false);
    } catch (err) {
      console.error(err);
      setSyncStatus({ type: 'error', text: 'Erro ao limpar cache offline.' });
    } finally {
      setIsClearing(false);
    }
  };

  const [deletePassword, setDeletePassword] = React.useState('');
  const [deleteError, setDeleteError] = React.useState('');
  
  const handleDeleteAccount = async () => {
    if (!auth.currentUser || !userId) return;
    
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email!, deletePassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      const userRepo = new UserRepository();
      await userRepo.deleteUser(userId);
      await deleteUser(auth.currentUser);
      
      localStorage.clear();
      window.location.reload();
    } catch (e: any) {
      setDeleteError(e.message);
    }
  };

  const handleSyncFirestore = async () => {
    if (!userId) {
      setSyncStatus({ type: 'error', text: 'Usuário não autenticado no Firestore.' });
      return;
    }
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const words = await fetchSavedWordsFromFirestore(userId);
      if (words && words.length > 0) {
        if (onVocabularyUpdated) {
          onVocabularyUpdated(words);
        }
        setSyncStatus({ type: 'success', text: `Sincronizado! ${words.length} palavras recuperadas.` });
      } else {
        setSyncStatus({ type: 'success', text: 'Nenhuma palavra encontrada na nuvem.' });
      }
    } catch (err) {
      console.error(err);
      setSyncStatus({ type: 'error', text: 'Erro ao sincronizar dados.' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 w-full text-slate-800 dark:text-slate-100" id="settings-view">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/15 rounded-2xl">
          <Settings className="w-8 h-8 text-indigo-600 dark:text-indigo-300" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Configurações</h1>
          <p className="text-sm text-slate-400 dark:text-slate-400 font-medium">Gerencie seu perfil, preferências e permissões.</p>
        </div>
      </div>

      <div className={`grid gap-8 ${
        orientation === 'landscape' ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'
      }`}>
        {/* Card: Perfil de Acesso */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <UserCog className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">Perfil de Acesso</h3>
          </div>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Altere o seu papel de atuação na plataforma.
          </p>

          <div className="space-y-3">
            {[
              { id: 'Student', label: 'Estudante (Student)', desc: 'Pratique conversação e trilha de idiomas.' },
              { id: 'Educator', label: 'Educador (Educator)', desc: 'Acompanhe relatórios de turmas e alunos.' },
              { id: 'Admin', label: 'Administrador (Admin)', desc: 'Controle completo da escola.' }
            ].map((item) => {
              const isSelected = role === item.id;
              return (
                <div 
                  key={item.id}
                  onClick={() => {
                    const targetVal = item.id as any;
                    if (targetVal === "Admin") {
                      if (isAdminAuthenticated) {
                        setRole("Admin");
                        setView("admin-dashboard");
                      } else {
                        setIsPasswordModalOpen(true);
                        setAdminPasswordInput("");
                        setAdminPasswordError("");
                      }
                    } else {
                      setRole(targetVal);
                      if (targetVal === "Educator") {
                        setView("educator-dashboard");
                      } else {
                        setView("dashboard");
                      }
                    }
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-indigo-600 bg-indigo-50/40' 
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-bold text-sm ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                      {item.label}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">{item.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card: Motor de Identidade Linguística (LIE) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm col-span-1 md:col-span-2 space-y-6" id="lie-card">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <Globe className="w-5 h-5 text-indigo-600 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-950">Linguistic Identity Engine (LIE)</h3>
                <p className="text-[11px] text-slate-400 font-medium">Sistema avançado de personalização regional e identidade linguística.</p>
              </div>
            </div>
            {isRtl && (
              <span className="bg-amber-100 border border-amber-200 text-amber-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full animate-bounce">
                Layout RTL Ativo ⇄
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Col 1: Idiomas Base */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Languages size={13} className="text-indigo-500" />
                <span>Preferências de Idioma</span>
              </h4>

              {/* Interface Language */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Idioma da Interface (UI)</label>
                <select
                  value={linguisticIdentity.interfaceLanguage}
                  onChange={(e) => {
                    setLinguisticIdentity({
                      ...linguisticIdentity,
                      interfaceLanguage: e.target.value
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 font-semibold"
                >
                  <option value="pt">Português (Portugal)</option>
                  <option value="br">Português (Brasil)</option>
                  <option value="en">English (Estados Unidos)</option>
                  <option value="es">Español (Espanha)</option>
                  <option value="fr">Français (França)</option>
                  <option value="de">Deutsch (Alemanha)</option>
                  <option value="zh">中文 (China)</option>
                  <option value="ar">العربية (Árabe - RTL 🇸🇦)</option>
                  <option value="he">עברית (Hebraico - RTL 🇮🇱)</option>
                </select>
              </div>

              {/* Native Language */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Idioma Nativo (Materno)</label>
                <select
                  value={linguisticIdentity.nativeLanguage}
                  onChange={(e) => {
                    setLinguisticIdentity({
                      ...linguisticIdentity,
                      nativeLanguage: e.target.value
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 font-semibold"
                >
                  <option value="pt">Português</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="zh">中文</option>
                </select>
              </div>

              {/* Learning Language */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Idioma de Aprendizagem</label>
                <select
                  value={linguisticIdentity.learningLanguage}
                  onChange={(e) => {
                    setLinguisticIdentity({
                      ...linguisticIdentity,
                      learningLanguage: e.target.value
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 font-semibold"
                >
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="zh">中文</option>
                  <option value="ar">العربية (RTL)</option>
                  <option value="he">עברית (RTL)</option>
                </select>
              </div>
            </div>

            {/* Col 2: Contexto Regional e Dialetos */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Sliders size={13} className="text-indigo-500" />
                <span>Geografia & Dialetos</span>
              </h4>

              {/* Country Variant */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">País de Referência (Variante)</label>
                <select
                  value={linguisticIdentity.regionalVariant}
                  onChange={(e) => {
                    const regionalVariant = e.target.value;
                    let preferredDialect = 'Padrao';
                    if (regionalVariant === 'AO') preferredDialect = 'kimbundu';
                    else if (regionalVariant === 'NG') preferredDialect = 'igbo';
                    else if (regionalVariant === 'BR') preferredDialect = 'paulista';
                    else if (regionalVariant === 'PT') preferredDialect = 'alentejano';

                    setLinguisticIdentity({
                      ...linguisticIdentity,
                      regionalVariant,
                      preferredDialect
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 font-semibold"
                >
                  <option value="AO">Angola 🇦🇴</option>
                  <option value="NG">Nigéria 🇳🇬</option>
                  <option value="BR">Brasil 🇧🇷</option>
                  <option value="PT">Portugal 🇵🇹</option>
                  <option value="US">Estados Unidos 🇺🇸</option>
                  <option value="MZ">Moçambique 🇲🇿</option>
                  <option value="ZA">África do Sul 🇿🇦</option>
                </select>
              </div>

              {/* Dialect */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 font-sans">Dialeto / Variação Local</label>
                <select
                  value={linguisticIdentity.preferredDialect}
                  onChange={(e) => {
                    setLinguisticIdentity({
                      ...linguisticIdentity,
                      preferredDialect: e.target.value
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 font-semibold"
                >
                  <option value="Padrao">Português/Inglês Padrão</option>
                  {linguisticIdentity.regionalVariant === 'AO' && (
                    <>
                      <option value="kimbundu">Kimbundu (Angola)</option>
                      <option value="umbundu">Umbundu (Angola)</option>
                      <option value="kikongo">Kikongo (Angola)</option>
                    </>
                  )}
                  {linguisticIdentity.regionalVariant === 'NG' && (
                    <>
                      <option value="igbo">Igbo Dialect (Nigéria)</option>
                      <option value="yoruba">Yoruba Dialect (Nigéria)</option>
                      <option value="hausa">Hausa Dialect (Nigéria)</option>
                    </>
                  )}
                  {linguisticIdentity.regionalVariant === 'BR' && (
                    <>
                      <option value="paulista">Paulista - R retroflexo (Brasil)</option>
                      <option value="carioca">Carioca - S sibilante (Brasil)</option>
                    </>
                  )}
                  {linguisticIdentity.regionalVariant === 'PT' && (
                    <>
                      <option value="alentejano">Alentejano - Vocalizado (Portugal)</option>
                      <option value="nortenho">Nortenho - Tripeiro (Portugal)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Tutor Language */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Idioma de Comunicação do Tutor IA</label>
                <select
                  value={linguisticIdentity.tutorLanguage}
                  onChange={(e) => {
                    setLinguisticIdentity({
                      ...linguisticIdentity,
                      tutorLanguage: e.target.value
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 font-semibold"
                >
                  <option value="en">English (Padrão)</option>
                  <option value="pt">Português</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </div>

            {/* Col 3: Estilo e Contexto */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Sliders size={13} className="text-indigo-500" />
                <span>Estilo & Tons de Fala</span>
              </h4>

              {/* Formality */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 block">Nível de Formalidade</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['informal', 'formal'] as const).map((level) => (
                    <button
                      type="button"
                      key={level}
                      onClick={() => setLinguisticIdentity({ ...linguisticIdentity, formalityLevel: level })}
                      className={`py-1.5 rounded-lg border text-[10px] font-black uppercase transition cursor-pointer ${
                        linguisticIdentity.formalityLevel === level
                          ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {level === 'formal' ? 'Formal 👔' : 'Informal 👕'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slangs / Academic */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 block">Preferência Vocabular</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['slang', 'balanced', 'academic'] as const).map((pref) => (
                    <button
                      type="button"
                      key={pref}
                      onClick={() => setLinguisticIdentity({ ...linguisticIdentity, slangAcademicPreference: pref })}
                      className={`py-1.5 rounded-lg border text-[9px] font-bold uppercase transition cursor-pointer text-center truncate ${
                        linguisticIdentity.slangAcademicPreference === pref
                          ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {pref === 'slang' ? 'Gírias' : pref === 'academic' ? 'Académico' : 'Misto'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Usage Context */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Contexto de Utilização</label>
                <select
                  value={linguisticIdentity.usageContext}
                  onChange={(e) => {
                    setLinguisticIdentity({
                      ...linguisticIdentity,
                      usageContext: e.target.value as any
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 font-semibold"
                >
                  <option value="conversation">Conversação Geral 🗣️</option>
                  <option value="travel">Turismo e Viagem ✈️</option>
                  <option value="business">Trabalho e Negócios 💼</option>
                  <option value="academic">Universidade e Ensino 🎓</option>
                  <option value="exam">Preparação para Exame 📝</option>
                </select>
              </div>
            </div>
          </div>

          {/* AI Tutor Live Context Adaptation Preview */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700">
              <Sparkles size={13} className="animate-spin" />
              <span>Simulador de Adaptação do Tutor IA</span>
            </div>
            
            <p className="text-xs text-slate-600 italic leading-relaxed">
              {(() => {
                const { regionalVariant, preferredDialect, formalityLevel, slangAcademicPreference, usageContext } = linguisticIdentity;
                let greeting = "Olá!";
                let explanation = "";

                if (regionalVariant === 'AO') {
                  if (preferredDialect === 'kimbundu') {
                    greeting = "Olá meu wi! Walunga.";
                    explanation = "O Tutor adaptou-se ao dialeto Kimbundu angolano de Luanda, usando expressões típicas como 'wi' (amigo) e 'walunga' (saudação).";
                  } else if (preferredDialect === 'umbundu') {
                    greeting = "Walunga ndapandula! Como estão os seus mambos?";
                    explanation = "O Tutor adaptou-se à cadência e vocabulário Umbundu do planalto central angolano.";
                  } else {
                    greeting = "Olá! Tudo fixe com o mambo?";
                    explanation = "O Tutor adaptou-se ao português coloquial padrão de Angola.";
                  }
                } else if (regionalVariant === 'NG') {
                  if (preferredDialect === 'yoruba') {
                    greeting = "Bawo! E kabo to LingoLIVE.";
                    explanation = "The AI Tutor adapted to the Yoruba dialect of South-Western Nigeria, offering cultural welcomes.";
                  } else {
                    greeting = "Kedu! Welcome, Oyi.";
                    explanation = "The AI Tutor adapted to the Nigerian English context with local dialect flourishes.";
                  }
                } else if (regionalVariant === 'BR') {
                  if (preferredDialect === 'carioca') {
                    greeting = "Coé mermão! Tudo maneiro?";
                    explanation = "O Tutor adaptou-se ao dialeto Carioca com sibilância acentuada e gírias do Rio de Janeiro.";
                  } else {
                    greeting = "E aí muleque, tudo da hora?";
                    explanation = "O Tutor adaptou-se ao falar Paulista com sotaque caipira e termos locais.";
                  }
                } else {
                  greeting = "Olá! Como está, caro aluno?";
                  explanation = "O Tutor está a usar um tom padrão respeitando os formatos regionais ativos.";
                }

                if (formalityLevel === 'formal') {
                  greeting = greeting.replace("Coé mermão!", "Prezado Aluno,").replace("Tudo maneiro?", "Estimo que esteja bem.");
                }

                if (usageContext === 'business') {
                  greeting += " Vamos focar na sua apresentação de negócios hoje.";
                } else if (usageContext === 'travel') {
                  greeting += " Vamos rever termos essenciais para aeroporto e trânsito.";
                }

                return (
                  <span className="block font-medium">
                    <span className="font-extrabold text-slate-900 block mb-1">"{greeting}"</span>
                    <span className="text-[10px] text-slate-400 block not-italic font-sans">
                      💡 <strong>Comportamento LIE:</strong> {explanation} (Formalidade: {formalityLevel === 'formal' ? 'Falta de gíria, polidez' : 'Linguagem quotidiana'}, Contexto: {usageContext})
                    </span>
                  </span>
                );
              })()}
            </p>
          </div>

          {/* Diagnostics and Fallback Logging Console */}
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <Sliders size={12} />
                Registo de Fallbacks do Localization Engine
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-bold">
                {fallbackLogs.length} eventos
              </span>
            </div>
            
            {fallbackLogs.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic">Nenhum evento de fallback registado. O motor está a resolver 100% das traduções diretamente do dialeto ou variante regional ativa.</p>
            ) : (
              <div className="max-h-24 overflow-y-auto bg-slate-950 p-2.5 rounded-xl font-mono text-[9px] text-slate-300 space-y-1 scrollbar-thin">
                {fallbackLogs.map((log, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-slate-800/50 pb-1 last:border-0 last:pb-0">
                    <span className="text-amber-400">
                      [{new Date(log.timestamp).toLocaleTimeString()}] Missing key: "{log.key}"
                    </span>
                    <span className="text-indigo-400 font-bold">
                      RESOLVED via: {log.domain === 'interface' ? 'Interface Fallback' : 'System Fallback'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Test Suite Diagnostic Section */}
          <div className="border-t border-slate-100 pt-4">
            <LocalizationTests />
          </div>
        </div>

        {/* Card: Modo de Tela Cheia */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900">Modo de Tela Cheia</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Ative ou desative o modo de tela cheia (Fullscreen) para maximizar a área útil da plataforma e otimizar a experiência visual em todos os seus dispositivos.
            </p>
          </div>
          
          <button
            onClick={async () => {
              await toggleFullscreen();
            }}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Smartphone className="w-4 h-4" />
            <span>Alternar Tela Cheia (Fullscreen)</span>
          </button>
        </div>

        {/* Card: Preferências de Aprendizagem */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">Meta de Aprendizagem</h3>
          </div>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Defina sua meta diária de prática.
          </p>
          
          <div className="grid grid-cols-3 gap-3">
            {[15, 30, 60].map((goal) => (
              <button
                key={goal}
                onClick={() => updateDailyGoal(goal)}
                className={`py-3 px-2 rounded-xl border-2 font-bold text-sm transition-all ${
                  dailyGoal === goal
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : 'border-slate-100 hover:border-slate-200 text-slate-600'
                }`}
              >
                {goal} min
              </button>
            ))}
          </div>
        </div>

        {/* Card: Configuração de IA Conversacional (ChatGPT 4) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between" id="conversational-ai-card">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900">Motor de IA Conversacional</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Configure o motor de inteligência artificial utilizado nas conversações, traduções e explicações do Professor Virtual.
            </p>

            <div className="space-y-3">
              {[
                { 
                  id: 'gpt-4o', 
                  label: 'ChatGPT 4 (GPT-4o)', 
                  desc: 'Alta Precisão. Ideal para correções gramaticais completas, tom adaptativo sofisticado e regionalismos.' 
                },
                { 
                  id: 'gemini', 
                  label: 'Gemini (Padrão)', 
                  desc: 'Alta Velocidade. Ideal para conversações rápidas e diálogos cotidianos informais.' 
                }
              ].map((item) => {
                const isSelected = preferredAI === item.id;
                return (
                  <div 
                    key={item.id}
                    onClick={() => handleUpdateAIModel(item.id)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/40' 
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold text-sm ${isSelected ? 'text-indigo-900' : 'text-slate-800'} flex items-center gap-1.5`}>
                        {item.label}
                        {isSelected && (
                          <span className="text-[9px] bg-indigo-600 text-white font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            Ativo
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">{item.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Configuração sincronizada com os canais locais e de nuvem.</span>
          </div>
        </div>

        <LearningMemoryPanel userId={userId} />

        {/* Card: Configuração de Voz Neural de Alta Fidelidade (TTS) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between" id="neural-tts-voice-card">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Volume2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900">Voz Neural de Alta Fidelidade</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Escolha a voz sintetizada pelo modelo de IA de última geração (ElevenLabs Neural TTS) para o feedback de áudio e treinos de conversação.
            </p>

            <div className="space-y-3">
              {[
                { 
                  id: '21m00Tcm4TlvDq8ikWAM', 
                  label: 'Rachel', 
                  desc: 'Professora Atenciosa (Feminina). Tom claro, caloroso, ideal para aprendizagem formal e correções.' 
                },
                { 
                  id: 'JBFv7C9S8v0t7gp71mDG', 
                  label: 'George', 
                  desc: 'Tom Amigável (Masculino). Velocidade moderada e sotaque natural, perfeito para diálogos cotidianos.' 
                },
                { 
                  id: 'piTKgcLEGmPEe24241Cg', 
                  label: 'Nicole', 
                  desc: 'Gentil e Calma (Feminina). Ritmo suave e acolhedor, excelente para iniciantes ou sessões calmas.' 
                },
                { 
                  id: '2EiwWnXF2V4j9t70yUtm', 
                  label: 'Clyde', 
                  desc: 'Narrador Confiante (Masculino). Voz profunda, expressiva e envolvente para exercícios imersivos.' 
                },
                { 
                  id: 'Xb7hHBI0SpCOg841a67i', 
                  label: 'Alice', 
                  desc: 'Didática & Articulada (Feminina). Destaque para pronúncias muito claras e precisas.' 
                }
              ].map((item) => {
                const isSelected = preferredVoice === item.id;
                return (
                  <div 
                    key={item.id}
                    onClick={() => handleUpdateVoiceModel(item.id)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/40' 
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold text-sm ${isSelected ? 'text-indigo-900' : 'text-slate-800'} flex items-center gap-1.5`}>
                        {item.label}
                        {isSelected && (
                          <span className="text-[9px] bg-indigo-600 text-white font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            Selecionada
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">{item.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Mapeamento de voz neural persistido offline.</span>
          </div>
        </div>

        {/* Card: Controle de Voz & Acessibilidade */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between" id="voice-control-accessibility-card">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </span>
              <h3 className="text-lg font-bold text-slate-900">Comandos de Voz Globais</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Ative os comandos de voz para navegar na plataforma sem as mãos utilizando frases em inglês como <span className="font-mono text-indigo-600 font-semibold bg-indigo-50 px-1 rounded">"go to dashboard"</span> ou <span className="font-mono text-indigo-600 font-semibold bg-indigo-50 px-1 rounded">"start practice"</span>.
            </p>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-sm text-slate-800">Ativar Reconhecimento de Voz</span>
                <span className="text-[11px] text-slate-400 font-medium">Requer acesso ao microfone no seu navegador.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newValue = !isVoiceCommandsEnabled;
                  setIsVoiceCommandsEnabled(newValue);
                  localStorage.setItem("lingolive_voice_commands_enabled", newValue ? "true" : "false");
                  window.dispatchEvent(new CustomEvent("lingolive_voice_settings_changed"));
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isVoiceCommandsEnabled ? "bg-indigo-600" : "bg-slate-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isVoiceCommandsEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className={`w-2 h-2 rounded-full ${isVoiceCommandsEnabled ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`} />
            <span>{isVoiceCommandsEnabled ? "Escutando comandos em segundo plano (em Inglês)..." : "Reconhecimento de voz desativado por padrão."}</span>
          </div>
        </div>

        {/* Card: Gerenciamento de Dados */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between" id="data-management-card">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900">Gerenciamento de Dados</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Monitore o cache local offline e sincronize seu baralho de palavras salvo com o banco de dados em nuvem.
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 mb-6">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Estado de Conexão:</span>
                <span className={`font-bold flex items-center gap-1.5 ${navigator.onLine ? 'text-emerald-600' : 'text-amber-600'}`}>
                  <span className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  {navigator.onLine ? 'Online (Nuvem conectada)' : 'Offline (Apenas local)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Itens no Cache Offline:</span>
                <span className="font-bold text-slate-800">{cacheStats.count} termos</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Tamanho Estimado:</span>
                <span className="font-bold text-slate-800">
                  {(cacheStats.sizeBytes / 1024).toFixed(2)} KB
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {syncStatus && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${
                syncStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
              }`}>
                {syncStatus.text}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSyncFirestore}
                disabled={isSyncing || !navigator.onLine}
                className="flex-1 py-3 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                id="btn-fetch-firestore"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Buscando...' : 'Recuperar Nuvem'}</span>
              </button>

              <button
                onClick={handleClearCache}
                disabled={isClearing}
                className={`flex-1 py-3 px-2 rounded-xl border-2 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  confirmClear
                    ? 'border-rose-600 bg-rose-50 text-rose-700 hover:bg-rose-100'
                    : 'border-slate-100 hover:border-slate-200 text-slate-600 hover:text-slate-800'
                }`}
                id="btn-clear-cache"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmClear ? 'Confirmar?' : 'Limpar Cache'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card: Notificações Push (FCM) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between" id="push-notifications-card">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900">Notificações Push (FCM)</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Ative avisos de meta de estudo diária e lembretes de aulas agendadas diretamente no seu dispositivo.
            </p>

            <div className="space-y-4">
              {/* Global Enable Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  {notifSettings.enabled ? (
                    <BellRing className="w-5 h-5 text-indigo-600 animate-bounce" />
                  ) : (
                    <BellOff className="w-5 h-5 text-slate-400" />
                  )}
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">Notificações Push</span>
                    <span className="text-[11px] text-slate-400">
                      {permissionState === 'unsupported' 
                        ? 'Não suportado neste navegador' 
                        : permissionState === 'granted' 
                        ? 'Permitido pelo navegador' 
                        : permissionState === 'denied' 
                        ? 'Bloqueado pelo navegador' 
                        : 'Requer permissão'}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={handleTogglePushNotifications}
                  disabled={isUpdatingNotif || permissionState === 'unsupported'}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
                    notifSettings.enabled ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              {notifSettings.enabled && (
                <div className="space-y-4 border-t border-slate-100 pt-4 animate-fadeIn">
                  {/* Daily Goal Reminder */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-bold text-slate-700">Aviso de Meta Diária</span>
                      </div>
                      <button
                        onClick={() => handleUpdatePreference('dailyReminderEnabled', !notifSettings.dailyReminderEnabled)}
                        className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
                          notifSettings.dailyReminderEnabled ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                        }`}
                      >
                        <span className="bg-white w-3.5 h-3.5 rounded-full shadow-md" />
                      </button>
                    </div>

                    {notifSettings.dailyReminderEnabled && (
                      <div className="flex items-center gap-3 pl-6">
                        <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Horário do Lembrete</label>
                        <input
                          type="time"
                          value={notifSettings.dailyReminderTime}
                          onChange={(e) => handleUpdatePreference('dailyReminderTime', e.target.value)}
                          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Scheduled Lesson Reminder */}
                  <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-bold text-slate-700">Lembrete de Aulas Agendadas</span>
                    </div>
                    <button
                      onClick={() => handleUpdatePreference('lessonReminderEnabled', !notifSettings.lessonReminderEnabled)}
                      className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
                        notifSettings.lessonReminderEnabled ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <span className="bg-white w-3.5 h-3.5 rounded-full shadow-md" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 mt-6">
            {testPushStatus && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                testPushStatus.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                  : testPushStatus.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-100'
                  : 'bg-indigo-50 text-indigo-800 border border-indigo-100'
              }`}>
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{testPushStatus.text}</span>
              </div>
            )}

            <button
              onClick={handleTestPushNotification}
              disabled={isUpdatingNotif || !notifSettings.enabled}
              className="w-full py-3 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              id="btn-test-push"
            >
              <Bell className="w-3.5 h-3.5 animate-pulse" />
              <span>Enviar Notificação de Teste</span>
            </button>

            <button
              onClick={() => {
                simulateStreakRiskNotification(streakData || { count: 5, lastDate: '', history: [] }, userId || 'guest');
                setTestPushStatus({
                  type: 'info',
                  text: '⚡ Alerta de Risco de Sequência enviado! Verifique as notificações e o banner no Dashboard.'
                });
              }}
              className="w-full py-3 px-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              id="btn-test-streak-warning"
            >
              <Flame className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
              <span>Simular Alerta de Risco de Sequência</span>
            </button>
          </div>
        </div>
        
        {/* Card: Aparência */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Aparência</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Escolha um dos temas oficiais do LingoLIVE.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.keys(APPEARANCE_OPTIONS) as Array<keyof typeof APPEARANCE_OPTIONS>).map((scheme) => {
              const option = APPEARANCE_OPTIONS[scheme];
              const Icon = option.icon;
              const selected = colorScheme === scheme;
              return (
                <button
                  type="button"
                  key={scheme}
                  aria-label={`Tema ${option.label}`}
                  aria-pressed={selected}
                  onClick={() => setColorScheme(scheme)}
                  className={`flex items-center gap-3 py-3 px-4 rounded-xl border-2 text-left transition-all ${
                    selected
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-500/15 dark:text-indigo-200'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-xs font-bold leading-tight">{option.label}</span>
                    <span className="block text-[10px] font-medium opacity-70 mt-0.5">{option.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card: Perigo - Excluir Conta */}
        <div className="bg-white p-6 rounded-3xl border border-red-100 shadow-sm col-span-1 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-bold text-slate-900">Zona de Perigo: Excluir Conta</h3>
            </div>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition-all"
            >
              Excluir minha conta permanentemente
            </button>
          </div>
          <p className="text-xs text-red-400 mt-2">Esta ação é irreversível. Todos os seus dados serão apagados.</p>
        </div>
      </div>
      
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Confirmar Exclusão</h2>
            <p className="text-sm text-slate-600 mb-4">Para confirmar a exclusão permanente de sua conta e todos os dados, insira sua senha:</p>
            <input 
              type="password" 
              value={deletePassword} 
              onChange={(e) => setDeletePassword(e.target.value)} 
              className="w-full p-3 rounded-xl border border-slate-200 mb-4"
              placeholder="Sua senha"
            />
            {deleteError && <p className="text-xs text-red-500 mb-4">{deleteError}</p>}
            <div className="flex gap-2">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2 rounded-xl border font-bold text-sm">Cancelar</button>
              <button onClick={handleDeleteAccount} className="flex-1 py-2 rounded-xl bg-red-600 text-white font-bold text-sm">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
