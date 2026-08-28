import { describe, expect, it } from "vitest";
import { publicMarketplaceItem, validateIdempotencyKey, validateMarketplaceItem } from "./marketplace.service";

const valid = { title: "Curso de inglês", description: "Conteúdo pedagógico completo e validado.", itemType: "COURSE", language: "Inglês", cefrLevel: "A2", priceCoins: 50, stockQuantity: null, contentRef: "courses/course_1" };
describe("marketplace domain", () => {
  it("validates a canonical item", () => expect(validateMarketplaceItem(valid)).toEqual(valid));
  it("rejects negative price and invalid type", () => {
    expect(() => validateMarketplaceItem({ ...valid, priceCoins: -1 })).toThrow("PRICE");
    expect(() => validateMarketplaceItem({ ...valid, itemType: "SERVICE" })).toThrow("TYPE");
  });
  it("validates idempotency keys", () => {
    expect(validateIdempotencyKey("purchase_1234567890")).toBe("purchase_1234567890");
    expect(() => validateIdempotencyKey("short")).toThrow("IDEMPOTENCY");
  });
  it("does not expose content references in catalog DTOs", () => expect(publicMarketplaceItem("i1", { ...valid, status: "PUBLISHED" })).not.toHaveProperty("contentRef"));
});
