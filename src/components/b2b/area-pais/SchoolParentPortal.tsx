import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  FileText,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Download,
  Bell,
  Settings,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

interface ChildProgress {
  id: string;
  name: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  overallProgress: number;
  attendance: number;
  classesAttended: number;
  xpEarned: number;
  lastActivityDate: number;
  strengths: string[];
  areasForImprovement: string[];
  recentAchievements: string[];
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'teacher' | 'parent' | 'coordinator';
  recipientId: string;
  content: string;
  attachments?: string[];
  timestamp: number;
  read: boolean;
}

interface EventNotification {
  id: string;
  type: 'achievement' | 'warning' | 'upcoming-event' | 'report-ready';
  title: string;
  message: string;
  childId: string;
  timestamp: number;
  read: boolean;
}

interface ReportCard {
  id: string;
  childId: string;
  period: string;
  issuedAt: number;
  overallScore: number;
  skillScores: {
    listening: number;
    speaking: number;
    reading: number;
    writing: number;
  };
  teacherComments: string;
  nextSteps: string[];
}

interface SchoolParentPortalProps {
  schoolId: string;
  parentId: string;
  childrenIds: string[];
}

type TabType = 'progress' | 'messages' | 'reports' | 'notifications' | 'settings';

export const SchoolParentPortal: React.FC<SchoolParentPortalProps> = ({
  schoolId,
  parentId,
  childrenIds,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('progress');
  const [selectedChildId, setSelectedChildId] = useState(childrenIds[0]);
  const [messageInput, setMessageInput] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [showNotificationDetails, setShowNotificationDetails] = useState<string | null>(null);

  const { data: childrenProgress, loading: progressLoading } = useRealtimeSync<ChildProgress[]>(
    `schools/${schoolId}/children-progress/${parentId}`,
    (data) => data || []
  );

  const { data: messages, loading: messagesLoading } = useRealtimeSync<Message[]>(
    `schools/${schoolId}/messages/${parentId}`,
    (data) => data || []
  );

  const { data: notifications } = useRealtimeSync<EventNotification[]>(
    `schools/${schoolId}/notifications/${parentId}`,
    (data) => data || []
  );

  const { data: reportCards } = useRealtimeSync<ReportCard[]>(
    `schools/${schoolId}/report-cards/${parentId}`,
    (data) => data || []
  );

  const selectedChild = childrenProgress?.find((c) => c.id === selectedChildId);
  const childReports = reportCards?.filter((r) => r.childId === selectedChildId) || [];
  const unreadMessages = messages?.filter((m) => !m.read && m.recipientId === parentId) || [];
  const unreadNotifications = notifications?.filter((n) => !n.read) || [];

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedTeacherId) return;

    try {
      const token = await (window as any).auth?.currentUser?.getIdToken?.();
      await fetch(`/api/schools/${schoolId}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senderId: parentId,
          senderRole: 'parent',
          recipientId: selectedTeacherId,
          content: messageInput,
          relatedChildId: selectedChildId,
        }),
      });

      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      const token = await (window as any).auth?.currentUser?.getIdToken?.();
      const response = await fetch(
        `/api/schools/${schoolId}/report-cards/${reportId}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${reportId}.pdf`;
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Portal dos Pais
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Acompanhe o progresso dos seus filhos
              </p>
            </div>
            <div className="flex gap-2">
              {unreadNotifications.length > 0 && (
                <div className="relative">
                  <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotifications.length}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Children Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {childrenProgress?.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  selectedChildId === child.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {child.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-8">
          {(['progress', 'messages', 'reports', 'notifications', 'settings'] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 px-4 font-medium text-sm transition-colors relative ${
                  activeTab === tab
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab === 'progress' && 'Progresso'}
                {tab === 'messages' && `Mensagens${unreadMessages.length > 0 ? ` (${unreadMessages.length})` : ''}`}
                {tab === 'reports' && 'Relatórios'}
                {tab === 'notifications' && `Notificações${unreadNotifications.length > 0 ? ` (${unreadNotifications.length})` : ''}`}
                {tab === 'settings' && 'Configurações'}
              </button>
            )
          )}
        </div>

        <AnimatePresence mode="wait">
          {/* Progress Tab */}
          {activeTab === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {progressLoading ? (
                <div className="text-center py-12 text-gray-500">Carregando dados...</div>
              ) : selectedChild ? (
                <>
                  {/* Progress Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Progresso</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {selectedChild.overallProgress}%
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-30" />
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Frequência</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {selectedChild.attendance}%
                          </p>
                        </div>
                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 opacity-30" />
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Aulas</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {selectedChild.classesAttended}
                          </p>
                        </div>
                        <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400 opacity-30" />
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">XP</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {selectedChild.xpEarned}
                          </p>
                        </div>
                        <span className="text-2xl">⚡</span>
                      </div>
                    </motion.div>
                  </div>

                  {/* Strengths and Areas for Improvement */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        Pontos Fortes
                      </h3>
                      <ul className="space-y-2">
                        {selectedChild.strengths.map((strength, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                          >
                            <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        Áreas a Melhorar
                      </h3>
                      <ul className="space-y-2">
                        {selectedChild.areasForImprovement.map((area, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                          >
                            <span className="text-amber-600 dark:text-amber-400 mt-1">→</span>
                            {area}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  </div>

                  {/* Recent Achievements */}
                  {selectedChild.recentAchievements.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                        Conquistas Recentes
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {selectedChild.recentAchievements.map((achievement, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center"
                          >
                            <p className="text-2xl mb-2">🏆</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {achievement}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </>
              ) : null}
            </motion.div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <motion.div
              key="messages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Message List */}
                <div className="lg:col-span-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Conversas</h3>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {messagesLoading ? (
                      <div className="text-center py-4 text-gray-500">Carregando...</div>
                    ) : messages && messages.length > 0 ? (
                      messages.map((msg) => (
                        <button
                          key={msg.id}
                          onClick={() => setSelectedTeacherId(msg.senderId)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedTeacherId === msg.senderId
                              ? 'bg-indigo-100 dark:bg-indigo-900/30 border-l-2 border-indigo-600 dark:border-indigo-400'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {msg.senderName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {msg.content}
                          </p>
                          {!msg.read && (
                            <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-1"></span>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">Nenhuma mensagem</div>
                    )}
                  </div>
                </div>

                {/* Message Thread */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 flex flex-col">
                  {selectedTeacherId ? (
                    <>
                      <div className="flex-1 mb-4 max-h-[400px] overflow-y-auto space-y-4">
                        {messages
                          ?.filter(
                            (m) =>
                              m.senderId === selectedTeacherId || m.recipientId === selectedTeacherId
                          )
                          .map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.senderId === parentId ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-xs p-3 rounded-lg ${
                                  msg.senderId === parentId
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                }`}
                              >
                                <p className="text-sm">{msg.content}</p>
                                <p
                                  className={`text-xs mt-1 ${
                                    msg.senderId === parentId
                                      ? 'text-indigo-100'
                                      : 'text-gray-500 dark:text-gray-400'
                                  }`}
                                >
                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSendMessage();
                            }
                          }}
                          placeholder="Escreva sua mensagem..."
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={handleSendMessage}
                          className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Selecione uma conversa
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="space-y-4">
                {childReports.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Nenhum relatório disponível
                  </div>
                ) : (
                  childReports.map((report) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {report.period}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Emitido em {new Date(report.issuedAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDownloadReport(report.id)}
                          className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 flex items-center gap-2 text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Baixar
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        {[
                          { label: 'Geral', score: report.overallScore },
                          { label: 'Audição', score: report.skillScores.listening },
                          { label: 'Fala', score: report.skillScores.speaking },
                          { label: 'Leitura', score: report.skillScores.reading },
                          { label: 'Escrita', score: report.skillScores.writing },
                        ].map(({ label, score }) => (
                          <div key={label} className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{label}</p>
                            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                              {score}
                            </p>
                          </div>
                        ))}
                      </div>

                      {report.teacherComments && (
                        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {report.teacherComments}
                          </p>
                        </div>
                      )}

                      {report.nextSteps.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Próximos Passos:
                          </p>
                          <ul className="space-y-1">
                            {report.nextSteps.map((step, idx) => (
                              <li
                                key={idx}
                                className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                              >
                                <span className="text-indigo-600 dark:text-indigo-400 mt-1">→</span>
                                {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="space-y-4">
                {unreadNotifications.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">Nenhuma notificação</div>
                ) : (
                  unreadNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() =>
                        setShowNotificationDetails(
                          showNotificationDetails === notification.id ? null : notification.id
                        )
                      }
                      className="bg-white dark:bg-gray-800 border-l-4 border-indigo-600 dark:border-indigo-400 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            {new Date(notification.timestamp).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full flex-shrink-0 mt-2"></div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Configurações
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Notificações por Email</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Receber atualizações de progresso
                      </p>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Visibilidade de Dados</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Controlar quem pode ver informações dos seus filhos
                      </p>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
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
