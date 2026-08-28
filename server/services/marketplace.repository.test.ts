import { beforeEach, describe, expect, it } from "vitest";
import { localMemoryDb } from "./firestoreSafe.service";
import { acquireMarketplaceItem, listOwned, listPublishedItems, saveMarketplaceItem } from "./marketplace.repository";

describe("marketplace repository", () => {
  beforeEach(() => localMemoryDb.clear());
  it("lists only published items and strips contentRef", async () => {
    await saveMarketplaceItem("draft", { creatorId: "c", status: "DRAFT", title: "Draft" }, true);
    await saveMarketplaceItem("live", { creatorId: "c", status: "PUBLISHED", title: "Live", description: "desc", itemType: "COURSE", language: "en", cefrLevel: "A1", priceCoins: 5, stockQuantity: null, contentRef: "secret" }, true);
    expect(await listPublishedItems()).toEqual([expect.objectContaining({ id: "live", title: "Live" })]);
    expect((await listPublishedItems())[0]).not.toHaveProperty("contentRef");
  });
  it("acquires once, debits wallet, grants entitlement and replays idempotently", async () => {
    await saveMarketplaceItem("live", { creatorId: "c", status: "PUBLISHED", title: "Live", itemType: "COURSE", priceCoins: 25, stockQuantity: 1, contentRef: "courses/live" }, true);
    localMemoryDb.set("user_gamification_u1", { coins: 50 });
    const first = await acquireMarketplaceItem("u1", "live", "purchase_1234567890");
    const replay = await acquireMarketplaceItem("u1", "live", "purchase_1234567890");
    expect(first.duplicated).toBe(false); expect(replay.duplicated).toBe(true);
    expect(localMemoryDb.get("user_gamification_u1").coins).toBe(25);
    expect(await listOwned("marketplace_entitlements", "u1")).toHaveLength(1);
  });
  it("does not mutate state when balance is insufficient", async () => {
    await saveMarketplaceItem("live", { creatorId: "c", status: "PUBLISHED", title: "Live", itemType: "COURSE", priceCoins: 25, stockQuantity: 1, contentRef: "courses/live" }, true);
    localMemoryDb.set("user_gamification_u1", { coins: 10 });
    await expect(acquireMarketplaceItem("u1", "live", "purchase_1234567890")).rejects.toThrow("INSUFFICIENT");
    expect(localMemoryDb.get("user_gamification_u1").coins).toBe(10);
  });
});
