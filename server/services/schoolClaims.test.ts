import { beforeEach, describe, expect, it } from "vitest";
import { localMemoryDb, safeSetDoc } from "./firestoreSafe.service";
import {
  assertClassAccess,
  assertTenantAccess,
  assignSchoolClaims,
  CLAIM_GRANTING_ROLES,
  CROSS_TENANT_ROLES,
  isCrossTenantRole,
  normalizeSchoolRole,
  resolveSchoolClaims,
  SchoolClaims,
} from "./schoolClaims.service";

const claims = (overrides: Partial<SchoolClaims> = {}): SchoolClaims => ({
  role: "SCHOOL_ADMIN",
  tenantId: "escola-alfa",
  schoolId: "sede",
  classIds: ["turma-a"],
  ...overrides,
});

beforeEach(() => {
  for (const key of [...localMemoryDb.keys()]) {
    if (key.startsWith("users_")) localMemoryDb.delete(key);
  }
});

describe("normalização de papéis", () => {
  it("preserva os papéis canónicos", () => {
    expect(normalizeSchoolRole("SCHOOL_ADMIN")).toBe("SCHOOL_ADMIN");
    expect(normalizeSchoolRole("teacher")).toBe("TEACHER");
    expect(normalizeSchoolRole(" Native-Teacher ")).toBe("NATIVE_TEACHER");
  });

  it("converte os papéis legados em vez de os rejeitar", () => {
    expect(normalizeSchoolRole("LEARNER")).toBe("STUDENT");
    expect(normalizeSchoolRole("PARENT")).toBe("PARENT_GUARDIAN");
    expect(normalizeSchoolRole("professor")).toBe("TEACHER");
  });

  it("devolve null para papéis desconhecidos, sem inventar um por omissão", () => {
    expect(normalizeSchoolRole("PIRATA")).toBeNull();
    expect(normalizeSchoolRole(undefined)).toBeNull();
    expect(normalizeSchoolRole(42)).toBeNull();
  });

  it("identifica os papéis com alcance entre tenants", () => {
    expect(isCrossTenantRole("SUPER_ADMIN")).toBe(true);
    expect(isCrossTenantRole("SCHOOL_ADMIN")).toBe(false);
    expect(CROSS_TENANT_ROLES).toEqual(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
  });
});

describe("resolução de claims", () => {
  it("dá precedência às custom claims assinadas sobre o Firestore", async () => {
    await safeSetDoc("users", "u1", { role: "STUDENT", tenantId: "escola-do-firestore" });
    const resolved = await resolveSchoolClaims({
      uid: "u1",
      role: "TEACHER",
      tenantId: "escola-do-token",
      classIds: ["turma-b"],
    });
    expect(resolved.role).toBe("TEACHER");
    expect(resolved.tenantId).toBe("escola-do-token");
    expect(resolved.classIds).toEqual(["turma-b"]);
  });

  it("recorre ao perfil persistido quando o token ainda não foi sincronizado", async () => {
    await safeSetDoc("users", "u2", {
      role: "LEARNER",
      organizationId: "escola-beta",
      turma: "turma-c",
      schoolId: "beta-sede",
    });
    const resolved = await resolveSchoolClaims({ uid: "u2" });
    expect(resolved.role).toBe("STUDENT");
    expect(resolved.tenantId).toBe("escola-beta");
    expect(resolved.classIds).toEqual(["turma-c"]);
    expect(resolved.schoolId).toBe("beta-sede");
  });

  it("falha fechado quando não existe tenant algum", async () => {
    await safeSetDoc("users", "u3", { role: "STUDENT" });
    await expect(resolveSchoolClaims({ uid: "u3" })).rejects.toThrow("SCHOOL_TENANT_UNRESOLVED");
  });

  it("recusa um pedido sem uid", async () => {
    await expect(resolveSchoolClaims({})).rejects.toThrow("SCHOOL_CLAIMS_UNRESOLVED");
  });
});

describe("isolamento por tenant", () => {
  it("permite o acesso dentro do próprio tenant", () => {
    expect(() => assertTenantAccess(claims(), "escola-alfa")).not.toThrow();
  });

  it("bloqueia o acesso a outro tenant", () => {
    expect(() => assertTenantAccess(claims(), "escola-beta")).toThrow("SCHOOL_TENANT_FORBIDDEN");
    expect(() => assertTenantAccess(claims(), null)).toThrow("SCHOOL_TENANT_FORBIDDEN");
  });

  it("deixa passar os papéis com alcance global", () => {
    expect(() => assertTenantAccess(claims({ role: "SUPER_ADMIN" }), "qualquer")).not.toThrow();
  });

  it("restringe um professor às turmas das suas claims", () => {
    const teacher = claims({ role: "TEACHER" });
    expect(() => assertClassAccess(teacher, "turma-a")).not.toThrow();
    expect(() => assertClassAccess(teacher, "turma-z")).toThrow("SCHOOL_CLASS_FORBIDDEN");
    expect(() => assertClassAccess(teacher, null)).toThrow("SCHOOL_CLASS_FORBIDDEN");
  });

  it("permite a um administrador escolar operar sobre qualquer turma do tenant", () => {
    expect(() => assertClassAccess(claims({ role: "SCHOOL_ADMIN" }), "turma-z")).not.toThrow();
  });
});

describe("atribuição de claims", () => {
  const actor = { ...claims(), userId: "admin-1" };

  it("só permite a papéis administrativos conceder claims", async () => {
    expect(CLAIM_GRANTING_ROLES).toContain("SCHOOL_ADMIN");
    await expect(
      assignSchoolClaims({
        actor: { ...claims({ role: "TEACHER" }), userId: "prof-1" },
        targetUid: "aluno-1",
        role: "STUDENT",
        tenantId: "escola-alfa",
      }),
    ).rejects.toThrow("SCHOOL_CLAIMS_FORBIDDEN");
  });

  it("impede a concessão de claims noutro tenant", async () => {
    await expect(
      assignSchoolClaims({ actor, targetUid: "aluno-1", role: "STUDENT", tenantId: "escola-beta" }),
    ).rejects.toThrow("SCHOOL_TENANT_FORBIDDEN");
  });

  it("impede a escalada para papéis com alcance global", async () => {
    await expect(
      assignSchoolClaims({ actor, targetUid: "aluno-1", role: "SUPER_ADMIN", tenantId: "escola-alfa" }),
    ).rejects.toThrow("SCHOOL_ROLE_ESCALATION_FORBIDDEN");
  });

  it("rejeita papéis fora do catálogo e tenants em branco", async () => {
    await expect(
      assignSchoolClaims({ actor, targetUid: "aluno-1", role: "PIRATA" as never, tenantId: "escola-alfa" }),
    ).rejects.toThrow("SCHOOL_ROLE_INVALID");
    await expect(
      assignSchoolClaims({ actor, targetUid: "aluno-1", role: "STUDENT", tenantId: "   " }),
    ).rejects.toThrow("SCHOOL_TENANT_REQUIRED");
  });

  it("falha explicitamente quando o Firebase Admin Auth não está disponível", async () => {
    // Sem Admin SDK não há como escrever custom claims. Preferimos um erro
    // visível a fingir que a autorização foi concedida.
    await expect(
      assignSchoolClaims({ actor, targetUid: "aluno-1", role: "STUDENT", tenantId: "escola-alfa" }),
    ).rejects.toThrow("SCHOOL_CLAIMS_UNAVAILABLE");
  });
});
