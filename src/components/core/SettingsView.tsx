import React from 'react';
import { Settings, UserCog, ShieldCheck, Sparkles, Lock, Target, Database, Trash2, RefreshCw } from "lucide-react";
import { UserRole, AppView, Localization, SavedWord } from '../../types';
import { getCacheSizeEstimate, clearAllOfflineDB } from '../../utils/indexedDB';
import { fetchSavedWordsFromFirestore } from '../../lib/AchievementsManager';

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
}

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
}) => {
  const [cacheStats, setCacheStats] = React.useState<{ count: number; sizeBytes: number }>({ count: 0, sizeBytes: 0 });
  const [isClearing, setIsClearing] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmClear, setConfirmClear] = React.useState(false);

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
    <div className="max-w-4xl mx-auto px-6 py-10 w-full" id="settings-view">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-50 rounded-2xl">
          <Settings className="w-8 h-8 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Configurações</h1>
          <p className="text-sm text-slate-400 font-medium">Gerencie seu perfil, preferências e permissões.</p>
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

        {/* Card: Localização */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">Localização e Preferências</h3>
          </div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            País/Localização
          </label>
          <select
            value={localization.country}
            onChange={(e) => {
                const country = e.target.value;
                let lang = 'en';
                let curr = 'USD';
                if (country === 'BR') { lang = 'pt'; curr = 'BRL'; }
                else if (country === 'PT') { lang = 'pt'; curr = 'EUR'; }
                else if (country === 'AO') { lang = 'pt'; curr = 'AOA'; }
                else if (country === 'MZ') { lang = 'pt'; curr = 'MZN'; }
                else if (country === 'ZA') { lang = 'en'; curr = 'ZAR'; }
                setLocalization({ country, language: lang, currency: curr });
            }}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
          >
            <option value="US">Estados Unidos (English / USD)</option>
            <option value="BR">Brasil (Português / BRL)</option>
            <option value="PT">Portugal (Português / EUR)</option>
            <option value="AO">Angola (Português / AOA)</option>
            <option value="MZ">Moçambique (Português / MZN)</option>
            <option value="ZA">África do Sul (English / ZAR)</option>
          </select>
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
      </div>
    </div>
  );
};
