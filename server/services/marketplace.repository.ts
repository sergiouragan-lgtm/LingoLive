import crypto from "crypto";
import { dbAdmin } from "../config/firebaseAdmin";
import { ENABLE_SANDBOX_FALLBACK } from "../config/env";
import { localMemoryDb } from "./firestoreSafe.service";
import { publicMarketplaceItem } from "./marketplace.service";

const volatileAllowed = ENABLE_SANDBOX_FALLBACK || process.env.NODE_ENV === "test" || process.env.VITEST === "true";
const itemKey = (id: string) => `marketplace_items_${id}`;
const orderIdFor = (uid: string, key: string) => crypto.createHash("sha256").update(`${uid}:${key}`).digest("hex");

export async function listPublishedItems() {
  if (dbAdmin && process.env.VITEST !== "true" && process.env.NODE_ENV !== "test") {
    const snap = await dbAdmin.collection("marketplace_items").where("status", "==", "PUBLISHED").limit(100).get();
    return snap.docs.map((doc: any) => publicMarketplaceItem(doc.id, doc.data()));
  }
  if (!volatileAllowed) throw new Error("MARKETPLACE_STORAGE_UNAVAILABLE");
  return [...localMemoryDb.entries()].filter(([key, value]) => key.startsWith("marketplace_items_") && value.status === "PUBLISHED")
    .map(([key, value]) => publicMarketplaceItem(key.slice("marketplace_items_".length), value));
}

export async function listOwned(collection: "marketplace_items" | "marketplace_entitlements", uid: string) {
  const ownerField = collection === "marketplace_items" ? "creatorId" : "userId";
  if (dbAdmin && process.env.VITEST !== "true" && process.env.NODE_ENV !== "test") {
    const snap = await dbAdmin.collection(collection).where(ownerField, "==", uid).limit(100).get();
    return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  }
  if (!volatileAllowed) throw new Error("MARKETPLACE_STORAGE_UNAVAILABLE");
  return [...localMemoryDb.entries()].filter(([key, value]) => key.startsWith(`${collection}_`) && value[ownerField] === uid).map(([key, value]) => ({ id: key.slice(collection.length + 1), ...value }));
}

export async function saveMarketplaceItem(id: string, data: any, create = false) {
  if (dbAdmin && process.env.VITEST !== "true" && process.env.NODE_ENV !== "test") {
    const ref = dbAdmin.collection("marketplace_items").doc(id);
    if (create) await ref.create(data); else await ref.set(data, { merge: true });
    return;
  }
  if (!volatileAllowed) throw new Error("MARKETPLACE_STORAGE_UNAVAILABLE");
  const existing = localMemoryDb.get(itemKey(id));
  if (create && existing) throw new Error("ITEM_EXISTS");
  localMemoryDb.set(itemKey(id), { ...(existing || {}), ...data });
}

export async function getMarketplaceItem(id: string) {
  if (dbAdmin && process.env.VITEST !== "true" && process.env.NODE_ENV !== "test") {
    const snap = await dbAdmin.collection("marketplace_items").doc(id).get();
    return snap.exists ? snap.data() : null;
  }
  if (!volatileAllowed) throw new Error("MARKETPLACE_STORAGE_UNAVAILABLE");
  return localMemoryDb.get(itemKey(id)) || null;
}

export async function acquireMarketplaceItem(uid: string, itemId: string, idempotencyKey: string) {
  const orderId = orderIdFor(uid, idempotencyKey);
  if (dbAdmin && process.env.VITEST !== "true" && process.env.NODE_ENV !== "test") {
    const itemRef = dbAdmin.collection("marketplace_items").doc(itemId);
    const walletRef = dbAdmin.collection("user_gamification").doc(uid);
    const orderRef = dbAdmin.collection("marketplace_orders").doc(orderId);
    const entitlementRef = dbAdmin.collection("marketplace_entitlements").doc(`${uid}_${itemId}`);
    return dbAdmin.runTransaction(async (tx: any) => {
      const [orderSnap, itemSnap, walletSnap, entitlementSnap] = await tx.getAll(orderRef, itemRef, walletRef, entitlementRef);
      if (orderSnap.exists) return { ...orderSnap.data(), duplicated: true };
      if (!itemSnap.exists || itemSnap.data().status !== "PUBLISHED") throw new Error("ITEM_NOT_AVAILABLE");
      if (entitlementSnap.exists) throw new Error("ALREADY_OWNED");
      const item = itemSnap.data(); const coins = walletSnap.exists ? Number(walletSnap.data().coins || 0) : 0;
      if (coins < item.priceCoins) throw new Error("INSUFFICIENT_COINS");
      if (item.stockQuantity !== null && item.stockQuantity <= 0) throw new Error("OUT_OF_STOCK");
      const now = new Date().toISOString();
      const order = { orderId, userId: uid, itemId, creatorId: item.creatorId, title: item.title, priceCoins: item.priceCoins, currency: "LINGO_COINS", status: "COMPLETED", createdAt: now };
      tx.create(orderRef, order);
      tx.create(entitlementRef, { userId: uid, itemId, orderId, title: item.title, itemType: item.itemType, contentRef: item.contentRef, grantedAt: now, status: "ACTIVE" });
      tx.set(walletRef, { userId: uid, coins: coins - item.priceCoins, updatedAt: now }, { merge: true });
      tx.create(dbAdmin.collection("marketplace_ledger").doc(orderId), { orderId, userId: uid, creatorId: item.creatorId, amountCoins: item.priceCoins, type: "PURCHASE", createdAt: now });
      if (item.stockQuantity !== null) tx.update(itemRef, { stockQuantity: item.stockQuantity - 1, updatedAt: now });
      return { ...order, duplicated: false };
    });
  }
  if (!volatileAllowed) throw new Error("MARKETPLACE_STORAGE_UNAVAILABLE");
  const orderKey = `marketplace_orders_${orderId}`; const existingOrder = localMemoryDb.get(orderKey);
  if (existingOrder) return { ...existingOrder, duplicated: true };
  const item = localMemoryDb.get(itemKey(itemId));
  if (!item || item.status !== "PUBLISHED") throw new Error("ITEM_NOT_AVAILABLE");
  if (localMemoryDb.has(`marketplace_entitlements_${uid}_${itemId}`)) throw new Error("ALREADY_OWNED");
  const walletKey = `user_gamification_${uid}`; const wallet = localMemoryDb.get(walletKey) || {}; const coins = Number(wallet.coins || 0);
  if (coins < item.priceCoins) throw new Error("INSUFFICIENT_COINS");
  if (item.stockQuantity !== null && item.stockQuantity <= 0) throw new Error("OUT_OF_STOCK");
  const now = new Date().toISOString(); const order = { orderId, userId: uid, itemId, creatorId: item.creatorId, title: item.title, priceCoins: item.priceCoins, currency: "LINGO_COINS", status: "COMPLETED", createdAt: now };
  localMemoryDb.set(orderKey, order); localMemoryDb.set(`marketplace_entitlements_${uid}_${itemId}`, { userId: uid, itemId, orderId, title: item.title, itemType: item.itemType, contentRef: item.contentRef, grantedAt: now, status: "ACTIVE" });
  localMemoryDb.set(walletKey, { ...wallet, coins: coins - item.priceCoins, updatedAt: now });
  localMemoryDb.set(`marketplace_ledger_${orderId}`, { orderId, userId: uid, amountCoins: item.priceCoins, type: "PURCHASE", createdAt: now });
  if (item.stockQuantity !== null) localMemoryDb.set(itemKey(itemId), { ...item, stockQuantity: item.stockQuantity - 1 });
  return { ...order, duplicated: false };
}
