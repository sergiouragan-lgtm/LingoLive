import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("real certification platform", () => {
  it("does not contain browser-side demonstration certificates or ledger simulation", () => {
    const component = read("src/components/learning/CertificationPlatform.tsx");
    for (const forbidden of ["defaultCertificates", "defaultAuditLogs", "defaultStorageFiles", "lingolive_cert_cache", "Math.random", "Simulated Cloud Storage", "integrityHash", "issued_certificates"]) {
      expect(component).not.toContain(forbidden);
    }
    expect(component).toContain("/api/certification/certificates");
    expect(component).toContain("Nenhum registro local ou demonstrativo foi exibido.");
  });

  it("derives metrics and audit events from persisted certificate collections", () => {
    const route = read("server/routes/certification.routes.ts");
    expect(route).toContain('safeListDocs("assessment_certificates")');
    expect(route).toContain('safeListDocs("certificate_audit_events")');
    expect(route).toContain('router.get("/metrics"');
    expect(route).toContain('router.get("/verify/:code"');
    expect(route).not.toContain("94.8");
    expect(route).not.toContain("12 ms");
  });

  it("records issuance and keeps documents pending until a real PDF exists", () => {
    const route = read("server/routes/assessment.routes.ts");
    expect(route).toContain('action: "CERTIFICATE_ISSUED"');
    expect(route).toContain('documentStatus: "pending"');
    expect(route).toContain('documentUrl: null');
  });
});
