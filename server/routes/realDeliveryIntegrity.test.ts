import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { assertCertificateDocumentUrl } from "../../src/lib/emailService";

describe("real delivery integrity", () => {
  it("does not acknowledge a simulated push or fall back after FCM errors", () => {
    const source = readFileSync(resolve(process.cwd(), "server/routes/school.routes.ts"), "utf8");
    expect(source).not.toContain('status: "simulated"');
    expect(source).not.toContain("providing simulation fallback");
    expect(source).toContain('error: "FCM_DELIVERY_FAILED"');
    expect(source).toContain('status: "accepted"');
  });

  it("does not email a placeholder certificate on level progression", () => {
    const source = readFileSync(resolve(process.cwd(), "server/routes/ai.routes.ts"), "utf8");
    expect(source).not.toContain("placeholder-certificado");
    expect(source).toContain('status: "pending_document"');
  });

  it("accepts only trusted HTTPS PDF document URLs", () => {
    expect(assertCertificateDocumentUrl("https://storage.googleapis.com/lingolive/cert.pdf"))
      .toBe("https://storage.googleapis.com/lingolive/cert.pdf");
    expect(() => assertCertificateDocumentUrl("http://storage.googleapis.com/lingolive/cert.pdf")).toThrow();
    expect(() => assertCertificateDocumentUrl("https://example.com/cert.pdf")).toThrow();
    expect(() => assertCertificateDocumentUrl("https://storage.googleapis.com/lingolive/cert.html")).toThrow();
  });
});
