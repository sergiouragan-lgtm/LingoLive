import { beforeEach, describe, expect, it } from "vitest";
import { collectPushTargets, deliverPush, isDeliverableToken } from "./pushDelivery.service";
import { localMemoryDb, safeSetDoc } from "./firestoreSafe.service";

const REAL_WEB_TOKEN = "fWebToken_abcdefghijklmnopqrstuvwxyz0123456789";
const REAL_ANDROID_TOKEN = "fAndroidToken_abcdefghijklmnopqrstuvwxyz0123456789";
const REAL_IOS_TOKEN = "fIosToken_abcdefghijklmnopqrstuvwxyz0123456789";

beforeEach(() => {
  for (const key of [...localMemoryDb.keys()]) {
    if (key.startsWith("device_tokens_")) localMemoryDb.delete(key);
  }
});

describe("validação de tokens", () => {
  it("rejeita tokens simulados, vazios ou demasiado curtos", () => {
    expect(isDeliverableToken("simulated_fcm_token_abcdefghijklmnop")).toBe(false);
    expect(isDeliverableToken("curto")).toBe(false);
    expect(isDeliverableToken(null)).toBe(false);
    expect(isDeliverableToken(undefined)).toBe(false);
    expect(isDeliverableToken(REAL_WEB_TOKEN)).toBe(true);
  });
});

describe("recolha de destinos push", () => {
  it("junta o token web às inscrições nativas do mesmo utilizador", async () => {
    await safeSetDoc("device_tokens", REAL_ANDROID_TOKEN, {
      fcmToken: REAL_ANDROID_TOKEN,
      userId: "u1",
      platform: "android",
      active: true,
    });
    await safeSetDoc("device_tokens", REAL_IOS_TOKEN, {
      fcmToken: REAL_IOS_TOKEN,
      userId: "u1",
      platform: "ios",
      active: true,
    });

    const targets = await collectPushTargets("u1", REAL_WEB_TOKEN);
    expect(targets).toHaveLength(3);
    expect(targets.map((target) => target.platform).sort()).toEqual(["android", "ios", "web"]);
  });

  it("exclui dispositivos desativados e tokens de outros utilizadores", async () => {
    await safeSetDoc("device_tokens", REAL_ANDROID_TOKEN, {
      fcmToken: REAL_ANDROID_TOKEN,
      userId: "u1",
      platform: "android",
      active: false,
    });
    await safeSetDoc("device_tokens", REAL_IOS_TOKEN, {
      fcmToken: REAL_IOS_TOKEN,
      userId: "outro",
      platform: "ios",
      active: true,
    });

    const targets = await collectPushTargets("u1", REAL_WEB_TOKEN);
    expect(targets).toHaveLength(1);
    expect(targets[0].platform).toBe("web");
  });

  it("não repete um token registado nas duas origens", async () => {
    await safeSetDoc("device_tokens", REAL_WEB_TOKEN, {
      fcmToken: REAL_WEB_TOKEN,
      userId: "u1",
      platform: "android",
      active: true,
    });
    const targets = await collectPushTargets("u1", REAL_WEB_TOKEN);
    expect(targets).toHaveLength(1);
  });

  it("devolve zero destinos quando só existe um token simulado", async () => {
    const targets = await collectPushTargets("u1", "simulated_fcm_token_xyzabcdefghijklmnop");
    expect(targets).toHaveLength(0);
  });
});

describe("entrega", () => {
  it("reporta honestamente quando não há destinos registados", async () => {
    const report = await deliverPush({ userId: "sem-dispositivos", title: "t", body: "b" });
    expect(report.attempted).toBe(0);
    expect(report.accepted).toBe(0);
    expect(report.skippedReason).toBe("NO_REGISTERED_TOKENS");
  });

  it("não conta como entregue quando o FCM não está configurado", async () => {
    const report = await deliverPush({
      userId: "u1",
      title: "t",
      body: "b",
      webToken: REAL_WEB_TOKEN,
    });
    expect(report.attempted).toBe(1);
    expect(report.accepted).toBe(0);
    expect(report.skippedReason).toBe("FCM_NOT_CONFIGURED");
  });
});
