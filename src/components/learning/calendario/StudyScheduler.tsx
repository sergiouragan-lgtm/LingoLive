import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { auth } from '../../../firebase';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useMonitoring } from '../../../hooks/useMonitoring';

export const StudyScheduler: React.FC = () => {
  const [time, setTime] = useState('');
  const { addToast } = useToast();
  const userId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();

  const setReminder = async () => {
    if (!time) {
      addToast('Por favor, selecione um horário.', 'error');
      if (userId) {
        trackEvent('study_reminder_set_failed', {
          reason: 'no_time_selected'
        });
      }
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      addToast('Permissão de notificação negada.', 'error');
      if (userId) {
        trackEvent('study_reminder_permission_denied', {
          permission: permission
        });
      }
      return;
    }

    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);

    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const delay = reminderTime.getTime() - now.getTime();

    // Simple client-side reminder for now
    setTimeout(() => {
      new Notification('Hora de estudar!', {
        body: 'Está na hora da sua sessão de prática.'
      });
    }, delay);

    if (userId) {
      trackEvent('study_reminder_set', {
        reminderTime: time,
        reminderType: 'study_session',
        delayMinutes: Math.round(delay / 60000)
      });
    }
    addToast(`Lembrete definido para ${time}`, 'success');
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Bell className="w-5 h-5 text-indigo-600" />
        Agendar Estudo
      </h3>
      <div className="flex gap-2">
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm flex-1"
        />
        <button
          onClick={setReminder}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
        >
          Definir
        </button>
      </div>
    </div>
  );
};
