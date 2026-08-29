import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const rootRules = fs.readFileSync(path.join(process.cwd(), "firestore.rules"), "utf8");
const firebaseRules = fs.readFileSync(path.join(process.cwd(), "firebase", "rules", "firestore.rules"), "utf8");

const MARKETPLACE_COLLECTIONS = [
  "marketplace_items",
  "marketplace_orders",
  "marketplace_entitlements",
  "marketplace_ledger",
] as const;

function matchBlock(rules: string, collection: string): string {
  const match = rules.match(
    new RegExp(`match \\/${collection}\\/\\{[^}]+\\} \\{([\\s\\S]*?)\\n    \\}`),
  );
  return match?.[1] ?? "";
}

function normalizedBlock(rules: string, collection: string): string {
  return matchBlock(rules, collection).replace(/\s+/g, " ").trim();
}

describe.each([
  ["ruleset principal", rootRules],
  ["ruleset de deploy Firebase", firebaseRules],
])("Marketplace em %s", (_name, rules) => {
  it.each(MARKETPLACE_COLLECTIONS)("mantém todo o acesso a %s exclusivamente no backend", (collection) => {
    const block = matchBlock(rules, collection);
    expect(block).not.toBe("");
    expect(normalizedBlock(rules, collection)).toBe("allow read, write: if false;");
    expect(block).not.toMatch(/allow\s+(read|get|list|create|update|delete|write)\s*:\s*if\s+(?!false\b)/);
  });

  it("não expõe catálogo nem rascunhos diretamente ao cliente", () => {
    const block = normalizedBlock(rules, "marketplace_items");
    expect(block).not.toMatch(/allow (get|list|read): if/);
    expect(block).not.toContain("request.auth");
  });

  it.each(["marketplace_orders", "marketplace_entitlements"])(
    "impede enumeração e acesso direto aos documentos privados de %s",
    (collection) => {
      const block = normalizedBlock(rules, collection);
      expect(block).not.toMatch(/allow (get|list|read): if/);
      expect(block).not.toContain("existing().userId");
      expect(block).not.toContain("request.resource.data.userId == request.auth.uid");
    },
  );

  it("não expõe o ledger financeiro nem mesmo a clientes com claims administrativos", () => {
    const block = normalizedBlock(rules, "marketplace_ledger");
    expect(block).toBe("allow read, write: if false;");
    expect(block).not.toContain("request.auth.uid");
    expect(block).not.toContain("isAdmin()");
  });
});

describe("paridade dos rulesets do Marketplace", () => {
  it.each(MARKETPLACE_COLLECTIONS)("mantém o bloco %s idêntico nos dois ficheiros", (collection) => {
    expect(normalizedBlock(firebaseRules, collection)).toBe(normalizedBlock(rootRules, collection));
  });
});
