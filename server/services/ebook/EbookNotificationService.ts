import { safeSetDoc, safeGetDoc, safeQueryDocs } from "../firestoreSafe.service";

export interface NotificationPrefs {
  studentId: string;
  studyReminders: boolean;
  reminderHour: number; // 0-23 UTC
  newEbookAlerts: boolean;
  progressMilestones: boolean;
  fcmTokens: string[];
}

const DEFAULT_PREFS: Omit<NotificationPrefs, "studentId" | "fcmTokens"> = {
  studyReminders: true,
  reminderHour: 18,
  newEbookAlerts: true,
  progressMilestones: true,
};

export async function getPreferences(studentId: string): Promise<NotificationPrefs> {
  const doc = await safeGetDoc("ebook_notification_prefs", studentId);
  if (doc.exists) {
    return doc.data() as NotificationPrefs;
  }
  return { studentId, fcmTokens: [], ...DEFAULT_PREFS };
}

export async function upsertPreferences(
  studentId: string,
  prefs: Partial<Omit<NotificationPrefs, "studentId">>
): Promise<NotificationPrefs> {
  const existing = await getPreferences(studentId);
  const updated: NotificationPrefs = { ...existing, ...prefs, studentId };
  await safeSetDoc("ebook_notification_prefs", studentId, updated);
  return updated;
}

export async function registerFcmToken(studentId: string, token: string): Promise<void> {
  const existing = await getPreferences(studentId);
  const tokens = Array.from(new Set([...existing.fcmTokens, token])).slice(-5); // keep latest 5
  await safeSetDoc("ebook_notification_prefs", studentId, {
    ...existing,
    fcmTokens: tokens,
  });
}

export async function unregisterFcmToken(studentId: string, token: string): Promise<void> {
  const existing = await getPreferences(studentId);
  const tokens = existing.fcmTokens.filter((t) => t !== token);
  await safeSetDoc("ebook_notification_prefs", studentId, { ...existing, fcmTokens: tokens });
}

// Send FCM message via Firebase Admin SDK (best-effort)
async function sendFcmToTokens(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ successCount: number; failureCount: number }> {
  if (!tokens.length) return { successCount: 0, failureCount: 0 };

  try {
    // Access the Firebase Messaging instance from admin SDK
    const { getApps, getApp } = await import("firebase-admin/app");
    const { getMessaging } = await import("firebase-admin/messaging");
    if (!getApps().length) return { successCount: 0, failureCount: tokens.length };
    const messaging = getMessaging(getApp());

    const responses = await Promise.allSettled(
      tokens.map((token) =>
        messaging.send({
          token,
          notification: { title, body },
          data: data ?? {},
          android: { priority: "high" },
          apns: { payload: { aps: { sound: "default" } } },
        })
      )
    );

    const successCount = responses.filter((r) => r.status === "fulfilled").length;
    return { successCount, failureCount: tokens.length - successCount };
  } catch {
    // FCM not configured in sandbox — log and continue
    return { successCount: 0, failureCount: tokens.length };
  }
}

export async function sendStudyReminder(studentId: string): Promise<{ sent: boolean; tokens: number }> {
  const prefs = await getPreferences(studentId);
  if (!prefs.studyReminders || !prefs.fcmTokens.length) return { sent: false, tokens: 0 };

  const { successCount } = await sendFcmToTokens(
    prefs.fcmTokens,
    "📚 Hora de estudar!",
    "Continue a sua leitura no LingoLive — a consistência é a chave do sucesso.",
    { action: "open_library" }
  );

  return { sent: successCount > 0, tokens: prefs.fcmTokens.length };
}

export async function sendMilestoneNotification(
  studentId: string,
  milestone: string,
  ebookTitle: string
): Promise<{ sent: boolean }> {
  const prefs = await getPreferences(studentId);
  if (!prefs.progressMilestones || !prefs.fcmTokens.length) return { sent: false };

  const messages: Record<string, { title: string; body: string }> = {
    "25": { title: "🎯 25% concluído!", body: `Excelente progresso em "${ebookTitle}"!` },
    "50": { title: "🔥 Metade feita!", body: `Já está a meio de "${ebookTitle}". Continue assim!` },
    "75": { title: "⚡ 75% concluído!", body: `Quase lá em "${ebookTitle}". Não pare agora!` },
    "100": { title: "🏆 Concluído!", body: `Parabéns! Terminou "${ebookTitle}". Veja o seu certificado!` },
  };

  const msg = messages[milestone];
  if (!msg) return { sent: false };

  const { successCount } = await sendFcmToTokens(prefs.fcmTokens, msg.title, msg.body, {
    action: "open_ebook",
    milestone,
  });

  return { sent: successCount > 0 };
}

export async function broadcastNewEbook(ebookId: string, title: string): Promise<{ totalSent: number }> {
  // Find all students with newEbookAlerts enabled
  const allPrefs = await safeQueryDocs("ebook_notification_prefs", "newEbookAlerts", true as any);

  let totalSent = 0;

  for (const prefs of allPrefs as NotificationPrefs[]) {
    if (!prefs.fcmTokens.length) continue;

    const { successCount } = await sendFcmToTokens(
      prefs.fcmTokens,
      "📖 Novo e-book disponível!",
      `"${title}" já está na Biblioteca. Começa a ler agora!`,
      { action: "open_marketplace", ebookId }
    );
    totalSent += successCount;
  }

  return { totalSent };
}
