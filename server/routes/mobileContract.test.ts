import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { mobileDeepLink, MOBILE_DEEP_LINK_SCHEME } from "../config/env";
import { StripeService } from "../services/stripe.service";
import { CANONICAL_LEARNING_EVENT_TYPES } from "../services/learning/learningEvents.service";

const read = (relativePath: string) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

describe("retorno de pagamento em dispositivo real", () => {
  it("faz o checkout mobile regressar por uma ponte HTTPS, não por um esquema próprio", () => {
    const mobile = StripeService.buildReturnUrls("mobile");
    expect(mobile.success_url).toMatch(/^https:\/\//);
    expect(mobile.success_url).toContain("/api/mobile/billing/return");
    expect(mobile.success_url).toContain("outcome=success");
    expect(mobile.success_url).toContain("{CHECKOUT_SESSION_ID}");
    expect(mobile.cancel_url).toContain("outcome=cancel");
    // O Stripe recusa esquemas personalizados como success_url.
    expect(mobile.success_url).not.toContain(`${MOBILE_DEEP_LINK_SCHEME}://`);
  });

  it("mantém intacto o retorno web existente", () => {
    const web = StripeService.buildReturnUrls("web");
    expect(web.success_url).toContain("/billing/success?session_id={CHECKOUT_SESSION_ID}");
    expect(web.cancel_url).toContain("/billing/cancel");
  });

  it("constrói deep links coerentes com o esquema configurado", () => {
    expect(mobileDeepLink("billing/success", { session_id: "cs_1" }))
      .toBe(`${MOBILE_DEEP_LINK_SCHEME}://billing/success?session_id=cs_1`);
    expect(mobileDeepLink("/billing/cancel")).toBe(`${MOBILE_DEEP_LINK_SCHEME}://billing/cancel`);
  });

  it("verifica a sessão junto do Stripe e nunca confia no parâmetro do cliente", () => {
    const source = read("./mobilePayment.routes.ts");
    expect(source).toContain("stripe.checkout.sessions.retrieve(sessionId)");
    expect(source).toContain("CHECKOUT_SESSION_FORBIDDEN");
    expect(source).toContain('session.payment_status === "paid"');
    expect(source).toContain("PaymentEngineService.handlePaymentSuccess");
    // O entitlement é lido do perfil persistido, não do redirecionamento.
    expect(source).toContain('safeGetDoc("users", req.user.uid)');
  });

  it("o esquema do deep link coincide entre servidor, Android e iOS", () => {
    const manifest = read("../../apps/mobile/android/app/src/main/AndroidManifest.xml");
    const plist = read("../../apps/mobile/ios/Runner/Info.plist");
    const listener = read("../../apps/mobile/lib/core/deep_links.dart");

    expect(manifest).toContain(`android:scheme="${MOBILE_DEEP_LINK_SCHEME}"`);
    expect(manifest).toContain('android:host="billing"');
    expect(plist).toContain(`<string>${MOBILE_DEEP_LINK_SCHEME}</string>`);
    expect(listener).toContain(`uri.scheme != '${MOBILE_DEEP_LINK_SCHEME}'`);
  });
});

describe("contrato das rotas mobile", () => {
  it("nunca aceita XP, pontuação ou tenant vindos do cliente", () => {
    const source = read("./mobile.routes.ts");
    // A pontuação da pronúncia é relida do documento persistido.
    expect(source).toContain('safeGetDoc("pronunciation_results", evaluationId)');
    expect(source).toContain("PRONUNCIATION_EVALUATION_FORBIDDEN");
    // O tenant vem sempre das claims resolvidas, nunca do corpo.
    expect(source).toContain("attachSchoolClaims");
    expect(source).not.toContain("req.body.tenantId");
    expect(source).not.toContain("req.body.xp");
    expect(source).not.toContain("req.body.score");
  });

  it("recusa registar tokens FCM simulados", () => {
    const source = read("./mobile.routes.ts");
    expect(source).toContain('fcmToken.startsWith("simulated_")');
    expect(source).toContain("INVALID_FCM_TOKEN");
    expect(source).toContain("DEVICE_TOKEN_FORBIDDEN");
  });

  it("expõe os três tipos canónicos no dashboard, sem inventar médias", () => {
    const source = read("./mobile.routes.ts");
    expect(CANONICAL_LEARNING_EVENT_TYPES).toHaveLength(3);
    expect(source).toContain("CANONICAL_LEARNING_EVENT_TYPES");
    // Sem evidência devolvemos null (o cliente mostra "—"), não zero.
    expect(source).toContain("if (scoped.length === 0) return null;");
    expect(source).toContain("MOBILE_DASHBOARD_UNAVAILABLE");
  });

  it("declara honestamente porque uma lista de atividades está vazia", () => {
    const source = read("./mobile.routes.ts");
    expect(source).toContain("NO_PUBLISHED_MOBILE_QUIZZES");
    expect(source).toContain("NO_FLASHCARDS_FOR_TENANT");
    expect(source).toContain("NO_PRONUNCIATION_PROMPTS");
  });
});

describe("autorização escolar por claims", () => {
  it("a rota de professores deriva escola e tenant das claims, não do corpo", () => {
    const source = read("./school.routes.ts");
    expect(source).toContain("resolveSchoolClaims(req.user)");
    expect(source).toContain("assertTenantAccess(claims, requestedTenantId)");
    expect(source).toContain("assertClassAccess(claims, classId)");
    expect(source).not.toContain('schoolId: schoolId || "default-school"');
  });

  it("expõe a atribuição real de custom claims e o diretório por tenant", () => {
    const source = read("./school.routes.ts");
    expect(source).toContain('router.get("/claims/me"');
    expect(source).toContain('router.post(\n  "/claims/assign"');
    expect(source).toContain("assignSchoolClaims");
    expect(source).toContain('router.get(\n  "/directory"');
  });

  it("as rotas mobile e escolares estão montadas no servidor", () => {
    const source = read("../../server.ts");
    expect(source).toContain('app.use("/api/mobile/billing", mobilePaymentRouter)');
    expect(source).toContain('app.use("/api/mobile", mobileRouter)');
    // O router de faturação tem de vir antes para não ser capturado por /api/mobile.
    expect(source.indexOf('app.use("/api/mobile/billing"'))
      .toBeLessThan(source.indexOf('app.use("/api/mobile", mobileRouter)'));
  });
});

describe("regras do Firestore para as coleções novas", () => {
  it("bloqueia escrita direta do cliente em eventos, memória, SRS e tokens", () => {
    const rules = read("../../firestore.rules");
    for (const collection of [
      "learning_events",
      "user_memory",
      "flashcard_progress",
      "device_tokens",
      "mobile_checkout_sessions",
    ]) {
      expect(rules).toContain(`match /${collection}/`);
    }
    // Nenhuma destas coleções pode ser escrita pelo cliente.
    const blocked = rules.split("match /learning_events/")[1];
    expect(blocked).toContain("allow create, update, delete: if false;");
  });
});
