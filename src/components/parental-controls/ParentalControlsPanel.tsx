import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  Lock,
  BarChart3,
  AlertCircle,
  Settings,
  Save,
  Eye,
  EyeOff,
  Smartphone,
  BookOpen,
  MessageSquare,
} from 'lucide-react';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

interface ScreenTimeLimit {
  dayOfWeek: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  dailyLimitMinutes: number;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

interface ContentFilter {
  minLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  blockedCategories: string[];
  allowedFeatures: {
    ebooks: boolean;
    liveClasses: boolean;
    aiTutor: boolean;
    messaging: boolean;
  };
}

interface ParentalControl {
  id: string;
  childId: string;
  screenTimeLimits: ScreenTimeLimit[];
  contentFilters: ContentFilter;
  requireApprovalForPurchase: boolean;
  notifyParentOnActivity: boolean;
  activityAlerts: {
    xpMilestone: number;
    dailyUsageThreshold: number;
  };
  createdAt: number;
  updatedAt: number;
}

interface ParentalControlsPanelProps {
  parentId: string;
  childId: string;
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const ParentalControlsPanel: React.FC<ParentalControlsPanelProps> = ({
  parentId,
  childId,
}) => {
  const [activeTab, setActiveTab] = useState<'screentime' | 'content' | 'alerts'>('screentime');
  const [isEditing, setIsEditing] = useState(false);
  const [controls, setControls] = useState<ParentalControl | null>(null);

  const { data: parentalControl } = useRealtimeSync<ParentalControl>(
    `parental_controls/${parentId}/${childId}`,
    (data) => {
      if (data) setControls(data);
      return data;
    }
  );

  const handleScreenTimeLimitChange = (
    dayIndex: number,
    field: 'dailyLimitMinutes' | 'startTime' | 'endTime',
    value: string | number
  ) => {
    if (!controls) return;

    const updatedLimits = [...controls.screenTimeLimits];
    updatedLimits[dayIndex] = {
      ...updatedLimits[dayIndex],
      [field]: value,
    };

    setControls({
      ...controls,
      screenTimeLimits: updatedLimits,
    });
  };

  const handleContentFilterChange = (field: string, value: unknown) => {
    if (!controls) return;

    if (field.startsWith('allowedFeatures.')) {
      const featureKey = field.split('.')[1];
      setControls({
        ...controls,
        contentFilters: {
          ...controls.contentFilters,
          allowedFeatures: {
            ...controls.contentFilters.allowedFeatures,
            [featureKey]: value,
          },
        },
      });
    } else if (field === 'minLevel') {
      setControls({
        ...controls,
        contentFilters: {
          ...controls.contentFilters,
          minLevel: value as any,
        },
      });
    }
  };

  const handleSave = async () => {
    try {
      const token = await (window as any).auth?.currentUser?.getIdToken?.();
      await fetch(`/api/parental-controls/${parentId}/${childId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(controls),
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save parental controls:', error);
    }
  };

  if (!controls) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="max-w-2xl mx-auto text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Carregando controles parentais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Controles Parentais
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gerenciar limites de tempo, conteúdo e atividades
              </p>
            </div>
            {isEditing && (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salvar Alterações
              </button>
            )}
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Editar
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
            {(['screentime', 'content', 'alerts'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 px-4 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab === 'screentime' && <Clock className="w-4 h-4 inline mr-2" />}
                {tab === 'content' && <Lock className="w-4 h-4 inline mr-2" />}
                {tab === 'alerts' && <AlertCircle className="w-4 h-4 inline mr-2" />}
                {tab === 'screentime' && 'Tempo de Tela'}
                {tab === 'content' && 'Filtro de Conteúdo'}
                {tab === 'alerts' && 'Alertas'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Screen Time Tab */}
          {activeTab === 'screentime' && (
            <motion.div
              key="screentime"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
                  <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Configure limites diários de tempo de tela por dia da semana. O aluno não poderá acessar a plataforma fora dos horários permitidos.
                </p>
              </div>

              <div className="space-y-4">
                {controls.screenTimeLimits.map((limit, idx) => (
                  <motion.div
                    key={limit.dayOfWeek}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      {limit.dayOfWeek === 'Mon' && 'Segunda-feira'}
                      {limit.dayOfWeek === 'Tue' && 'Terça-feira'}
                      {limit.dayOfWeek === 'Wed' && 'Quarta-feira'}
                      {limit.dayOfWeek === 'Thu' && 'Quinta-feira'}
                      {limit.dayOfWeek === 'Fri' && 'Sexta-feira'}
                      {limit.dayOfWeek === 'Sat' && 'Sábado'}
                      {limit.dayOfWeek === 'Sun' && 'Domingo'}
                    </h3>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                          Início (HH:MM)
                        </label>
                        <input
                          type="time"
                          value={limit.startTime}
                          onChange={(e) => handleScreenTimeLimitChange(idx, 'startTime', e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                          Fim (HH:MM)
                        </label>
                        <input
                          type="time"
                          value={limit.endTime}
                          onChange={(e) => handleScreenTimeLimitChange(idx, 'endTime', e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                          Limite (minutos)
                        </label>
                        <input
                          type="number"
                          value={limit.dailyLimitMinutes}
                          onChange={(e) =>
                            handleScreenTimeLimitChange(idx, 'dailyLimitMinutes', Number(e.target.value))
                          }
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Content Filter Tab */}
          {activeTab === 'content' && (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-purple-800 dark:text-purple-200 flex items-start gap-2">
                  <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Controle qual conteúdo seu filho pode acessar com base no nível de proficiência e características específicas.
                </p>
              </div>

              {/* Min Level */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Nível Mínimo de Conteúdo</h3>
                <select
                  value={controls.contentFilters.minLevel}
                  onChange={(e) => handleContentFilterChange('minLevel', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                >
                  <option value="A1">A1 - Iniciante</option>
                  <option value="A2">A2 - Elementar</option>
                  <option value="B1">B1 - Intermediário</option>
                  <option value="B2">B2 - Intermediário Superior</option>
                  <option value="C1">C1 - Avançado</option>
                  <option value="C2">C2 - Proficiente</option>
                </select>
              </div>

              {/* Allowed Features */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recursos Permitidos</h3>
                <div className="space-y-3">
                  {[
                    { key: 'ebooks', icon: BookOpen, label: 'E-books' },
                    { key: 'liveClasses', icon: Smartphone, label: 'Aulas ao Vivo' },
                    { key: 'aiTutor', icon: MessageSquare, label: 'Tutor IA' },
                    { key: 'messaging', icon: MessageSquare, label: 'Mensagens' },
                  ].map(({ key, icon: Icon, label }) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={controls.contentFilters.allowedFeatures[key as keyof typeof controls.contentFilters.allowedFeatures]}
                        onChange={(e) =>
                          handleContentFilterChange(`allowedFeatures.${key}`, e.target.checked)
                        }
                        disabled={!isEditing}
                        className="w-4 h-4 rounded"
                      />
                      <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Purchase Approval */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <label className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Exigir Aprovação para Compras
                  </span>
                  <input
                    type="checkbox"
                    checked={controls.requireApprovalForPurchase}
                    onChange={(e) =>
                      setControls({
                        ...controls,
                        requireApprovalForPurchase: e.target.checked,
                      })
                    }
                    disabled={!isEditing}
                    className="w-4 h-4 rounded"
                  />
                </label>
              </div>
            </motion.div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800 dark:text-green-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Configure alertas para ser notificado sobre atividades importantes do seu filho.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Configurações de Notificação</h3>

                <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg mb-4">
                  <span className="font-medium text-gray-900 dark:text-white">
                    Notificar sobre atividades
                  </span>
                  <input
                    type="checkbox"
                    checked={controls.notifyParentOnActivity}
                    onChange={(e) =>
                      setControls({
                        ...controls,
                        notifyParentOnActivity: e.target.checked,
                      })
                    }
                    disabled={!isEditing}
                    className="w-4 h-4 rounded"
                  />
                </label>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                      Alerta ao atingir XP (pontos)
                    </label>
                    <input
                      type="number"
                      value={controls.activityAlerts.xpMilestone}
                      onChange={(e) =>
                        setControls({
                          ...controls,
                          activityAlerts: {
                            ...controls.activityAlerts,
                            xpMilestone: Number(e.target.value),
                          },
                        })
                      }
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                      Alerta se usar mais de (minutos/dia)
                    </label>
                    <input
                      type="number"
                      value={controls.activityAlerts.dailyUsageThreshold}
                      onChange={(e) =>
                        setControls({
                          ...controls,
                          activityAlerts: {
                            ...controls.activityAlerts,
                            dailyUsageThreshold: Number(e.target.value),
                          },
                        })
                      }
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
