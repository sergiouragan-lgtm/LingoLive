import admin from "firebase-admin";
import { isFirestoreAdminUsable, safeAddDoc, safeQueryDocs, safeSetDoc } from "./firestoreSafe.service";

/**
 * Entrega de notificações push para todos os destinos registados de um
 * utilizador: o token web guardado em `users.notificationSettings.fcmToken` e
 * os tokens nativos registados pela app mobile em `device_tokens`.
 */

export interface PushTarget {
  token: string;
  platform: "web" | "android" | "ios";
}

export interface PushDeliveryReport {
  attempted: number;
  accepted: number;
  rejected: number;
  invalidTokens: string[];
  skippedReason?: string;
}

/** Tokens simulados nunca são enviados para o FCM. */
export function isDeliverableToken(token: unknown): token is string {
  return typeof token === "string" && token.length > 20 && !token.startsWith("simulated_");
}

/**
 * Reúne os destinos push reais de um utilizador, sem duplicados.
 */
export async function collectPushTargets(
  userId: string,
  webToken?: unknown,
): Promise<PushTarget[]> {
  const targets: PushTarget[] = [];
  const seen = new Set<string>();

  if (isDeliverableToken(webToken)) {
    seen.add(webToken);
    targets.push({ token: webToken, platform: "web" });
  }

  const devices = await safeQueryDocs("device_tokens", "userId", userId);
  for (const device of devices) {
    if (device.active === false) continue;
    if (!isDeliverableToken(device.fcmToken)) continue;
    if (seen.has(device.fcmToken)) continue;
    seen.add(device.fcmToken);
    targets.push({
      token: device.fcmToken,
      platform: device.platform === "ios" ? "ios" : "android",
    });
  }

  return targets;
}

/**
 * Envia a notificação a todos os destinos e regista cada entrega em
 * `notification_deliveries`. Tokens recusados pelo FCM como inválidos são
 * desativados para não voltarem a ser tentados.
 */
export async function deliverPush(params: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  webToken?: unknown;
  kind?: string;
}): Promise<PushDeliveryReport> {
  const targets = await collectPushTargets(params.userId, params.webToken);

  if (targets.length === 0) {
    return { attempted: 0, accepted: 0, rejected: 0, invalidTokens: [], skippedReason: "NO_REGISTERED_TOKENS" };
  }

  if (!isFirestoreAdminUsable()) {
    return { attempted: targets.length, accepted: 0, rejected: 0, invalidTokens: [], skippedReason: "FCM_NOT_CONFIGURED" };
  }

  const report: PushDeliveryReport = {
    attempted: targets.length,
    accepted: 0,
    rejected: 0,
    invalidTokens: [],
  };

  for (const target of targets) {
    try {
      const messageId = await (admin as any).messaging().send({
        token: target.token,
        notification: { title: params.title, body: params.body },
        data: params.data || {},
      });
      report.accepted += 1;
      await safeAddDoc("notification_deliveries", {
        userId: params.userId,
        channel: "fcm",
        platform: target.platform,
        kind: params.kind || "generic",
        status: "accepted",
        providerMessageId: messageId,
        createdAt: new Date().toISOString(),
      });
    } catch (error: any) {
      report.rejected += 1;
      const code = error?.errorInfo?.code || error?.code || "";
      const invalid = String(code).includes("registration-token-not-registered")
        || String(code).includes("invalid-registration-token")
        || String(code).includes("invalid-argument");

      if (invalid) {
        report.invalidTokens.push(target.token);
        // Não é possível entregar a este dispositivo outra vez: desativamos.
        await safeSetDoc("device_tokens", target.token, {
          active: false,
          deactivatedReason: String(code),
          deactivatedAt: new Date().toISOString(),
        }, true);
      }

      await safeAddDoc("notification_deliveries", {
        userId: params.userId,
        channel: "fcm",
        platform: target.platform,
        kind: params.kind || "generic",
        status: "rejected",
        errorCode: String(code) || "unknown",
        createdAt: new Date().toISOString(),
      });
    }
  }

  return report;
}
