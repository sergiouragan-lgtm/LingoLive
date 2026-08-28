export const MARKETPLACE_ITEM_TYPES = ["COURSE", "FLASHCARD_DECK", "ASSESSMENT", "EBOOK"] as const;
export const MARKETPLACE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type MarketplaceItemStatus = "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "REJECTED" | "ARCHIVED";

export interface MarketplaceItemInput {
  title: string;
  description: string;
  itemType: typeof MARKETPLACE_ITEM_TYPES[number];
  language: string;
  cefrLevel: typeof MARKETPLACE_LEVELS[number];
  priceCoins: number;
  stockQuantity: number | null;
  contentRef: string;
}

const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

export function validateMarketplaceItem(input: unknown): MarketplaceItemInput {
  const raw = input && typeof input === "object" ? input as any : {};
  const item = {
    title: text(raw.title, 120), description: text(raw.description, 2000),
    itemType: raw.itemType, language: text(raw.language, 40), cefrLevel: raw.cefrLevel,
    priceCoins: Number(raw.priceCoins),
    stockQuantity: raw.stockQuantity === null || raw.stockQuantity === undefined ? null : Number(raw.stockQuantity),
    contentRef: text(raw.contentRef, 500),
  } as MarketplaceItemInput;
  if (item.title.length < 3 || item.description.length < 20 || !item.language || !item.contentRef) throw new Error("INVALID_MARKETPLACE_TEXT");
  if (!(MARKETPLACE_ITEM_TYPES as readonly string[]).includes(item.itemType)) throw new Error("INVALID_MARKETPLACE_TYPE");
  if (!(MARKETPLACE_LEVELS as readonly string[]).includes(item.cefrLevel)) throw new Error("INVALID_MARKETPLACE_LEVEL");
  if (!Number.isSafeInteger(item.priceCoins) || item.priceCoins < 0 || item.priceCoins > 1_000_000) throw new Error("INVALID_MARKETPLACE_PRICE");
  if (item.stockQuantity !== null && (!Number.isSafeInteger(item.stockQuantity) || item.stockQuantity < 0 || item.stockQuantity > 1_000_000)) throw new Error("INVALID_MARKETPLACE_STOCK");
  return item;
}

export function validateIdempotencyKey(value: unknown) {
  const key = text(value, 100);
  if (!/^[a-zA-Z0-9_-]{16,100}$/.test(key)) throw new Error("INVALID_IDEMPOTENCY_KEY");
  return key;
}

export function publicMarketplaceItem(id: string, data: any) {
  return { id, title: data.title, description: data.description, itemType: data.itemType, language: data.language,
    cefrLevel: data.cefrLevel, priceCoins: data.priceCoins, stockQuantity: data.stockQuantity,
    creatorName: data.creatorName || "Criador LingoLIVE", status: data.status };
}
