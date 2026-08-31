import { randomUUID } from "node:crypto";
import { appBaseUrl } from "../config/env";
import { getStripeClient } from "../config/stripe";
import { dbAdmin } from "../config/firebaseAdmin";
import { safeAddDoc, safeGetDoc, safeListDocs, safeQueryDocs, safeSetDoc } from "./firestoreSafe.service";

export type MarketplaceItemType = "course" | "material" | "live_class" | "service" | "subscription";

export interface MarketplaceListingInput {
  type: MarketplaceItemType;
  title: string;
  description: string;
  category: string;
  language: string;
  price: number;
  currency: string;
  imageUrl?: string | null;
  stockQuantity?: number | null;
}

const TYPES = new Set<MarketplaceItemType>(["course", "material", "live_class", "service", "subscription"]);
const CURRENCIES = new Set(["USD", "EUR", "AOA", "BRL", "GBP"]);
const MAX_PRICE = 100_000;

export class MarketplaceValidationError extends Error {}

export class MarketplaceService {
  static validateListing(input: MarketplaceListingInput): MarketplaceListingInput {
    const type = String(input?.type || "") as MarketplaceItemType;
    const title = String(input?.title || "").trim();
    const description = String(input?.description || "").trim();
    const category = String(input?.category || "").trim();
    const language = String(input?.language || "").trim().toLowerCase();
    const price = Number(input?.price);
    const currency = String(input?.currency || "USD").trim().toUpperCase();
    const imageUrl = input?.imageUrl ? String(input.imageUrl).trim() : null;
    const stockQuantity = input?.stockQuantity == null ? null : Number(input.stockQuantity);

    if (!TYPES.has(type)) throw new MarketplaceValidationError("Tipo de anúncio inválido.");
    if (title.length < 3 || title.length > 160) throw new MarketplaceValidationError("O título deve ter entre 3 e 160 caracteres.");
    if (description.length < 20 || description.length > 4_000) throw new MarketplaceValidationError("A descrição deve ter entre 20 e 4000 caracteres.");
    if (!category || category.length > 80) throw new MarketplaceValidationError("Categoria inválida.");
    if (!/^[a-z]{2,3}(?:-[a-z]{2})?$/.test(language)) throw new MarketplaceValidationError("Código de idioma inválido.");
    if (!Number.isFinite(price) || price < 0.5 || price > MAX_PRICE) throw new MarketplaceValidationError("Preço inválido.");
    if (!CURRENCIES.has(currency)) throw new MarketplaceValidationError("Moeda não suportada.");
    if (imageUrl && (!/^https:\/\//i.test(imageUrl) || imageUrl.length > 2_048)) throw new MarketplaceValidationError("URL de imagem inválida.");
    if (stockQuantity != null && (!Number.isInteger(stockQuantity) || stockQuantity < 0 || stockQuantity > 1_000_000)) throw new MarketplaceValidationError("Stock inválido.");
    return { type, title, description, category, language, price, currency, imageUrl, stockQuantity };
  }

  static async list(filters: { type?: string; language?: string; query?: string } = {}) {
    const all = await safeListDocs("marketplace_listings");
    const query = String(filters.query || "").trim().toLocaleLowerCase();
    return all
      .filter((item) => item.status === "active")
      .filter((item) => !filters.type || item.type === filters.type)
      .filter((item) => !filters.language || item.language === filters.language.toLowerCase())
      .filter((item) => !query || `${item.title} ${item.description} ${item.category}`.toLocaleLowerCase().includes(query))
      .map(this.toPublicListing)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  static async get(itemId: string) {
    const snapshot = await safeGetDoc("marketplace_listings", itemId);
    if (!snapshot.exists || snapshot.data()?.status !== "active") return null;
    return this.toPublicListing({ id: itemId, ...snapshot.data() });
  }

  static async create(input: MarketplaceListingInput, actor: { uid: string; displayName?: string | null }) {
    const valid = this.validateListing(input);
    const now = new Date().toISOString();
    const id = `mpl_${randomUUID()}`;
    const listing = {
      id, ...valid, sellerId: actor.uid, sellerName: actor.displayName || "Criador LingoLive",
      status: "active", ratingAverage: 0, ratingCount: 0, salesCount: 0,
      createdAt: now, updatedAt: now, version: 1,
    };
    await safeSetDoc("marketplace_listings", id, listing, false);
    return this.toPublicListing(listing);
  }

  static async createCheckout(itemId: string, buyerId: string) {
    const item = await this.get(itemId);
    if (!item) throw new MarketplaceValidationError("Anúncio não encontrado.");
    if (item.sellerId === buyerId) throw new MarketplaceValidationError("O criador não pode comprar o próprio anúncio.");
    if (item.stockQuantity != null && item.stockQuantity <= 0) throw new MarketplaceValidationError("Produto esgotado.");

    const stripe = getStripeClient();
    if (!stripe) throw new Error("Stripe is not configured in this environment.");
    const orderId = `morder_${randomUUID()}`;
    const now = new Date().toISOString();
    await safeSetDoc("marketplace_orders", orderId, {
      id: orderId, itemId, buyerId, sellerId: item.sellerId, amount: item.price,
      currency: item.currency, status: "pending_payment", createdAt: now, updatedAt: now,
    }, false);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], mode: "payment", client_reference_id: buyerId,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: item.currency.toLowerCase(), unit_amount: Math.round(item.price * 100),
          product_data: { name: item.title, description: item.description.slice(0, 500) },
        },
      }],
      success_url: `${appBaseUrl}/marketplace?purchase=success&order_id=${orderId}`,
      cancel_url: `${appBaseUrl}/marketplace?purchase=cancelled&order_id=${orderId}`,
      metadata: { purchaseType: "marketplace", orderId, itemId, buyerId, sellerId: item.sellerId },
    });
    await safeSetDoc("marketplace_orders", orderId, { stripeSessionId: session.id, updatedAt: new Date().toISOString() });
    return { orderId, url: session.url };
  }

  static async completeStripeCheckout(session: any) {
    const metadata = session?.metadata || {};
    if (metadata.purchaseType !== "marketplace") return { handled: false };
    const { orderId, itemId, buyerId, sellerId } = metadata;
    if (!orderId || !itemId || !buyerId || !sellerId) throw new Error("MARKETPLACE_CHECKOUT_METADATA_INVALID");
    const orderSnap = await safeGetDoc("marketplace_orders", orderId);
    if (!orderSnap.exists) throw new Error("MARKETPLACE_ORDER_NOT_FOUND");
    const order = orderSnap.data();
    if (order.status === "paid") return { handled: true, idempotent: true, orderId };
    if (order.itemId !== itemId || order.buyerId !== buyerId || order.sellerId !== sellerId) throw new Error("MARKETPLACE_ORDER_OWNERSHIP_MISMATCH");
    const paidAmount = Number(session.amount_total || 0) / 100;
    if (paidAmount !== Number(order.amount) || String(session.currency || "").toUpperCase() !== order.currency) throw new Error("MARKETPLACE_PAYMENT_AMOUNT_MISMATCH");
    const paidAt = new Date().toISOString();
    const isTest = process.env.VITEST === "true" || process.env.NODE_ENV === "test";
    if (dbAdmin && !isTest) {
      const transactionResult = await dbAdmin.runTransaction(async (tx: any) => {
        const orderRef = dbAdmin.collection("marketplace_orders").doc(orderId);
        const itemRef = dbAdmin.collection("marketplace_listings").doc(itemId);
        const entitlementRef = dbAdmin.collection("marketplace_entitlements").doc(`${buyerId}_${itemId}`);
        const [freshOrder, freshItem] = await Promise.all([tx.get(orderRef), tx.get(itemRef)]);
        if (!freshOrder.exists || !freshItem.exists) throw new Error("MARKETPLACE_TRANSACTION_RESOURCE_NOT_FOUND");
        if (freshOrder.data().status === "paid") return { idempotent: true };
        const currentStock = freshItem.data().stockQuantity;
        if (currentStock != null && currentStock <= 0) throw new Error("MARKETPLACE_STOCK_EXHAUSTED_REVIEW_REQUIRED");
        tx.update(orderRef, { status: "paid", paidAt, updatedAt: paidAt, providerTransactionId: session.payment_intent || session.id });
        tx.set(entitlementRef, { id: `${buyerId}_${itemId}`, buyerId, itemId, orderId, sellerId, status: "active", grantedAt: paidAt });
        tx.update(itemRef, {
          salesCount: Number(freshItem.data().salesCount || 0) + 1,
          ...(currentStock == null ? {} : { stockQuantity: currentStock - 1 }),
          updatedAt: paidAt,
        });
        return { idempotent: false };
      });
      return { handled: true, idempotent: transactionResult.idempotent, orderId, entitlementId: `${buyerId}_${itemId}` };
    }
    const itemSnap = await safeGetDoc("marketplace_listings", itemId);
    if (itemSnap.exists) {
      const currentStock = itemSnap.data().stockQuantity;
      if (currentStock != null && currentStock <= 0) throw new Error("MARKETPLACE_STOCK_EXHAUSTED_REVIEW_REQUIRED");
      await safeSetDoc("marketplace_orders", orderId, { status: "paid", paidAt, updatedAt: paidAt, providerTransactionId: session.payment_intent || session.id });
      await safeSetDoc("marketplace_entitlements", `${buyerId}_${itemId}`, { id: `${buyerId}_${itemId}`, buyerId, itemId, orderId, sellerId, status: "active", grantedAt: paidAt }, false);
      await safeSetDoc("marketplace_listings", itemId, { salesCount: Number(itemSnap.data().salesCount || 0) + 1, ...(currentStock == null ? {} : { stockQuantity: currentStock - 1 }), updatedAt: paidAt });
    } else throw new Error("MARKETPLACE_ITEM_NOT_FOUND");
    return { handled: true, orderId, entitlementId: `${buyerId}_${itemId}` };
  }

  static async myPurchases(buyerId: string) {
    const entitlements = await safeQueryDocs("marketplace_entitlements", "buyerId", buyerId);
    return Promise.all(entitlements.filter((e) => e.status === "active").map(async (e) => ({ ...e, item: await this.get(e.itemId) })));
  }

  static async addReview(itemId: string, buyerId: string, rating: number, comment: string) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new MarketplaceValidationError("Avaliação inválida.");
    const cleanComment = String(comment || "").trim();
    if (cleanComment.length > 1_000) throw new MarketplaceValidationError("Comentário demasiado longo.");
    const entitlement = await safeGetDoc("marketplace_entitlements", `${buyerId}_${itemId}`);
    if (!entitlement.exists || entitlement.data()?.status !== "active") throw new MarketplaceValidationError("Apenas compradores podem avaliar.");
    const reviewId = `${itemId}_${buyerId}`;
    const existing = await safeGetDoc("marketplace_reviews", reviewId);
    if (existing.exists) throw new MarketplaceValidationError("Este produto já foi avaliado.");
    const createdAt = new Date().toISOString();
    await safeSetDoc("marketplace_reviews", reviewId, { id: reviewId, itemId, buyerId, rating, comment: cleanComment, createdAt }, false);
    const reviews = await safeQueryDocs("marketplace_reviews", "itemId", itemId);
    const ratingAverage = reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length;
    await safeSetDoc("marketplace_listings", itemId, { ratingAverage: Number(ratingAverage.toFixed(2)), ratingCount: reviews.length, updatedAt: createdAt });
    return { id: reviewId, itemId, rating, comment: cleanComment, createdAt };
  }

  private static toPublicListing(item: any) {
    return {
      id: item.id, type: item.type, title: item.title, description: item.description,
      category: item.category, language: item.language, price: Number(item.price), currency: item.currency,
      imageUrl: item.imageUrl || null, stockQuantity: item.stockQuantity ?? null,
      sellerId: item.sellerId, sellerName: item.sellerName, ratingAverage: Number(item.ratingAverage || 0),
      ratingCount: Number(item.ratingCount || 0), salesCount: Number(item.salesCount || 0), createdAt: item.createdAt,
    };
  }
}
