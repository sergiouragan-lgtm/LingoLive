import { showLocalWebNotification, isPushNotificationSupported } from '../lib/pushNotifications';
import { notificationService } from './notification.service';
import { StreakData } from '../types';

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if the user's streak is currently at risk today and sends
 * local web and in-app notifications if it hasn't been sent yet today.
 */
export async function checkAndNotifyStreakRisk(streakData: StreakData, userId: string = 'guest'): Promise<boolean> {
  if (!streakData || streakData.count <= 0) {
    return false;
  }

  const today = getTodayDateString();
  const hasPracticedToday = streakData.lastDate === today;

  if (hasPracticedToday) {
    return false; // Streak is safe today!
  }

  // Streak is at risk!
  const notifKey = `lingolive_streak_risk_notif_${userId}_${today}`;
  const alreadyNotifiedToday = localStorage.getItem(notifKey) === 'true';

  if (!alreadyNotifiedToday) {
    // 1. Send Local Web Push / Browser notification
    if (isPushNotificationSupported()) {
      showLocalWebNotification(
        `⚠️ Sequência de ${streakData.count} dia(s) em Risco!`,
        `Não praticaste hoje! Ativa o Congelamento de Ofensiva com os teus Pontos de Prática ou pratica agora para manter a tua ofensiva.`,
        { type: 'streak_risk', count: streakData.count }
      );
    }

    // 2. Send In-App System Notification
    await notificationService.notifyUser(userId, {
      title: `🔥 Sequência em Risco! (${streakData.count} dias)`,
      message: `A tua ofensiva vai expirar ao final do dia. Pratica uma lição ou usa 50 Pontos de Prática para congelar a sequência!`,
      type: 'streak_warning'
    });

    // Mark as notified for today
    try {
      localStorage.setItem(notifKey, 'true');
    } catch (e) {
      console.warn('Failed to save streak risk notification date:', e);
    }
  }

  return true;
}

/**
 * Force trigger a test/simulation of the streak risk warning local notification
 */
export async function simulateStreakRiskNotification(streakData: StreakData, userId: string = 'guest') {
  const currentCount = streakData.count > 0 ? streakData.count : 5;
  
  // 1. Show browser local notification
  showLocalWebNotification(
    `🔥 [TESTE] Sequência de ${currentCount} dias em Risco!`,
    `A tua ofensiva expira em breve. Ativa o Congelamento com 50 Pontos de Prática para proteger o teu progresso!`,
    { type: 'streak_risk_test' }
  );

  // 2. Add in-app notification
  await notificationService.notifyUser(userId, {
    title: `🔥 [TESTE] Sequência em Risco! (${currentCount} dias)`,
    message: `Alerta de teste: Ativa o Congelamento de Ofensiva instantaneamente usando os teus Pontos de Prática.`,
    type: 'streak_warning'
  });
}
