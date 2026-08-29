import { auth } from "../firebase";
export interface MarketplaceItemDto { id: string; title: string; description: string; itemType: string; language: string; cefrLevel: string; priceCoins: number; stockQuantity: number | null; creatorName?: string; status: string; rejectionReason?: string; }
export interface MarketplaceEntitlementDto { id: string; itemId: string; title: string; itemType: string; contentRef: string; grantedAt: string; status: string; }
async function authenticatedFetch(path: string, init: RequestInit = {}) { const token = await auth.currentUser?.getIdToken(); if (!token) throw new Error("Inicie sessão para utilizar o Marketplace."); const response = await fetch(`/api/marketplace${path}`, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init.headers || {}) } }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.error || "Operação do Marketplace falhou."); return payload; }
export const marketplaceService = {
  catalog: async () => (await authenticatedFetch("/catalog")).items as MarketplaceItemDto[],
  library: async () => (await authenticatedFetch("/library")).entitlements as MarketplaceEntitlementDto[],
  creatorItems: async () => (await authenticatedFetch("/creator/items")).items as MarketplaceItemDto[],
  createItem: async (item: any) => authenticatedFetch("/creator/items", { method: "POST", body: JSON.stringify(item) }),
  submitItem: async (id: string) => authenticatedFetch(`/creator/items/${encodeURIComponent(id)}/submit`, { method: "POST" }),
  reviewQueue: async () => (await authenticatedFetch("/admin/review-queue")).items as MarketplaceItemDto[],
  moderate: async (id: string, decision: "APPROVE" | "REJECT", reason = "") => authenticatedFetch(`/admin/items/${encodeURIComponent(id)}/moderate`, { method: "POST", body: JSON.stringify({ decision, reason }) }),
  acquire: async (id: string) => authenticatedFetch(`/items/${encodeURIComponent(id)}/acquire`, { method: "POST", headers: { "Idempotency-Key": crypto.randomUUID() } }),
};
