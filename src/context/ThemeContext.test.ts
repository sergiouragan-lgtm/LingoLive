import { describe, expect, it, vi } from "vitest";

vi.mock("../firebase", () => ({
  auth: { onAuthStateChanged: vi.fn(() => vi.fn()) },
  db: {},
  handleFirestoreError: vi.fn(),
  OperationType: { GET: "get", WRITE: "write" },
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

import { normalizeColorScheme } from "./ThemeContext";

describe("ThemeContext color scheme", () => {
  it("accepts supported schemes and rejects stale or invalid persisted values", () => {
    expect(normalizeColorScheme("light")).toBe("light");
    expect(normalizeColorScheme("dark")).toBe("dark");
    expect(normalizeColorScheme("system")).toBe("system");
    expect(normalizeColorScheme("indigo")).toBe("system");
    expect(normalizeColorScheme(null)).toBe("system");
  });
});
