import { beforeEach, describe, expect, it } from "vitest";
import { localMemoryDb, safeGetDoc, safeSetDoc } from "./firestoreSafe.service";
import { MarketplaceService, MarketplaceValidationError } from "./marketplace.service";

const validListing = {
  type: "course" as const,
  title: "Inglês para entrevistas técnicas",
  description: "Curso prático com exercícios, simulações e feedback de pronúncia.",
  category: "Carreira",
  language: "en",
  price: 49.9,
  currency: "USD",
};

describe("MarketplaceService", () => {
  beforeEach(() => localMemoryDb.clear());

  it("rejeita preço, moeda e conteúdo fora do contrato", () => {
    expect(() => MarketplaceService.validateListing({ ...validListing, price: -1 })).toThrow(MarketplaceValidationError);
    expect(() => MarketplaceService.validateListing({ ...validListing, currency: "BTC" })).toThrow("Moeda não suportada");
    expect(() => MarketplaceService.validateListing({ ...validListing, description: "curta" })).toThrow("descrição");
  });

  it("cria e lista somente ofertas ativas persistidas", async () => {
    const created = await MarketplaceService.create(validListing, { uid: "teacher-1", displayName: "Prof. Ana" });
    expect(created.sellerId).toBe("teacher-1");
    expect(await MarketplaceService.list()).toHaveLength(1);
    await safeSetDoc("marketplace_listings", created.id, { status: "archived" });
    expect(await MarketplaceService.list()).toHaveLength(0);
  });

  it("aplica pesquisa e filtros sem expor registos não publicados", async () => {
    await MarketplaceService.create(validListing, { uid: "teacher-1" });
    await MarketplaceService.create({ ...validListing, type: "material", title: "Francês essencial", language: "fr" }, { uid: "teacher-2" });
    expect(await MarketplaceService.list({ type: "material" })).toHaveLength(1);
    expect(await MarketplaceService.list({ language: "en", query: "entrevistas" })).toHaveLength(1);
  });

  it("conclui pagamento confirmado e concede entitlement uma única vez", async () => {
    const item = await MarketplaceService.create(validListing, { uid: "seller-1" });
    await safeSetDoc("marketplace_orders", "order-1", {
      id: "order-1", itemId: item.id, buyerId: "buyer-1", sellerId: "seller-1",
      amount: item.price, currency: item.currency, status: "pending_payment",
    }, false);
    const session = {
      id: "cs_1", payment_intent: "pi_1", amount_total: 4990, currency: "usd",
      metadata: { purchaseType: "marketplace", orderId: "order-1", itemId: item.id, buyerId: "buyer-1", sellerId: "seller-1" },
    };
    const first = await MarketplaceService.completeStripeCheckout(session);
    const second = await MarketplaceService.completeStripeCheckout(session);
    expect(first.handled).toBe(true);
    expect(second.idempotent).toBe(true);
    expect((await safeGetDoc("marketplace_entitlements", `buyer-1_${item.id}`)).exists).toBe(true);
    expect((await safeGetDoc("marketplace_listings", item.id)).data().salesCount).toBe(1);
  });

  it("falha fechado quando valor pago não corresponde ao pedido", async () => {
    const item = await MarketplaceService.create(validListing, { uid: "seller-1" });
    await safeSetDoc("marketplace_orders", "order-2", { id: "order-2", itemId: item.id, buyerId: "buyer-1", sellerId: "seller-1", amount: 49.9, currency: "USD", status: "pending_payment" }, false);
    await expect(MarketplaceService.completeStripeCheckout({
      amount_total: 100, currency: "usd",
      metadata: { purchaseType: "marketplace", orderId: "order-2", itemId: item.id, buyerId: "buyer-1", sellerId: "seller-1" },
    })).rejects.toThrow("MARKETPLACE_PAYMENT_AMOUNT_MISMATCH");
  });

  it("aceita avaliação apenas de comprador com entitlement", async () => {
    const item = await MarketplaceService.create(validListing, { uid: "seller-1" });
    await expect(MarketplaceService.addReview(item.id, "visitor", 5, "Excelente")).rejects.toThrow("Apenas compradores");
    await safeSetDoc("marketplace_entitlements", `buyer-1_${item.id}`, { buyerId: "buyer-1", itemId: item.id, status: "active" }, false);
    await MarketplaceService.addReview(item.id, "buyer-1", 5, "Excelente curso");
    expect((await safeGetDoc("marketplace_listings", item.id)).data().ratingAverage).toBe(5);
  });
});
