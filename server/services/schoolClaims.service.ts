import { authAdmin } from "../config/firebaseAdmin";
import { safeAddDoc, safeGetDoc, safeSetDoc } from "./firestoreSafe.service";

// Mesma proteção aplicada em firestoreSafe.service: `authAdmin` fica
// inicializado mesmo sem credenciais reais, pelo que uma escrita de claims
// durante os testes tentaria uma chamada de rede e falharia com um erro de
// credenciais em vez do erro de domínio esperado.
const isRunningUnderTests = process.env.VITEST === "true" || process.env.NODE_ENV === "test";
const authAdminUsable = () => Boolean(authAdmin) && !isRunningUnderTests;

/**
 * Papéis escolares canónicos. Alinhados com `OfficialUserRole` do fluxo de
 * entrada (src/types/entryFlow.ts) — não introduzir variantes locais.
 */
export const SCHOOL_ROLES = [
  "SUPER_ADMIN",
  "PLATFORM_ADMIN",
  "ORG_ADMIN",
  "SCHOOL_ADMIN",
  "TEACHER",
  "NATIVE_TEACHER",
  "PARENT_GUARDIAN",
  "STUDENT",
] as const;

export type SchoolRole = (typeof SCHOOL_ROLES)[number];

/** Papéis que podem operar sobre qualquer tenant. */
export const CROSS_TENANT_ROLES: SchoolRole[] = ["SUPER_ADMIN", "PLATFORM_ADMIN"];

/** Papéis autorizados a atribuir claims escolares a outros utilizadores. */
export const CLAIM_GRANTING_ROLES: SchoolRole[] = [
  "SUPER_ADMIN",
  "PLATFORM_ADMIN",
  "ORG_ADMIN",
  "SCHOOL_ADMIN",
];

export interface SchoolClaims {
  role: SchoolRole;
  tenantId: string;
  schoolId: string | null;
  classIds: string[];
}

const LEGACY_ROLE_MAP: Record<string, SchoolRole> = {
  LEARNER: "STUDENT",
  ALUNO: "STUDENT",
  PARENT: "PARENT_GUARDIAN",
  ENCARREGADO: "PARENT_GUARDIAN",
  PROFESSOR: "TEACHER",
  SCHOOL: "SCHOOL_ADMIN",
  SCHOOL_ADMINISTRATOR: "SCHOOL_ADMIN",
  ADMIN: "PLATFORM_ADMIN",
};

export function normalizeSchoolRole(rawRole: unknown): SchoolRole | null {
  if (typeof rawRole !== "string" || !rawRole.trim()) return null;
  const upper = rawRole.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if ((SCHOOL_ROLES as readonly string[]).includes(upper)) return upper as SchoolRole;
  return LEGACY_ROLE_MAP[upper] || null;
}

export function isCrossTenantRole(role: unknown): boolean {
  const normalized = normalizeSchoolRole(role);
  return normalized !== null && CROSS_TENANT_ROLES.includes(normalized);
}

/**
 * Resolve as claims escolares efetivas de um pedido autenticado.
 *
 * A ordem de precedência é deliberada: as custom claims do token vencem sempre,
 * porque são assinadas pelo Firebase e não podem ser forjadas pelo cliente. O
 * documento `users/{uid}` é apenas usado quando o token ainda não foi
 * sincronizado. O corpo do pedido NUNCA é consultado.
 */
export async function resolveSchoolClaims(user: any): Promise<SchoolClaims> {
  if (!user?.uid) {
    throw new Error("SCHOOL_CLAIMS_UNRESOLVED");
  }

  const tokenRole = normalizeSchoolRole(user.role);
  const tokenTenant = typeof user.tenantId === "string" ? user.tenantId : null;

  if (tokenRole && tokenTenant) {
    return {
      role: tokenRole,
      tenantId: tokenTenant,
      schoolId: typeof user.schoolId === "string" ? user.schoolId : null,
      classIds: Array.isArray(user.classIds) ? user.classIds.map(String) : [],
    };
  }

  const snapshot = await safeGetDoc("users", user.uid);
  const profile = snapshot.exists ? snapshot.data() : {};

  const role = tokenRole || normalizeSchoolRole(profile.role) || "STUDENT";
  const tenantId = tokenTenant || profile.tenantId || profile.organizationId || null;

  if (!tenantId) {
    throw new Error("SCHOOL_TENANT_UNRESOLVED");
  }

  const classIds = Array.isArray(user.classIds)
    ? user.classIds.map(String)
    : Array.isArray(profile.classIds)
      ? profile.classIds.map(String)
      : profile.classId || profile.turma
        ? [String(profile.classId || profile.turma)]
        : [];

  return {
    role,
    tenantId: String(tenantId),
    schoolId: (typeof user.schoolId === "string" ? user.schoolId : null) || profile.schoolId || null,
    classIds,
  };
}

/**
 * Escreve as custom claims reais no Firebase Auth e espelha-as em
 * `users/{uid}` para leitura pelas regras do Firestore.
 *
 * Sem Admin SDK disponível a operação falha explicitamente: nunca fingimos que
 * uma autorização foi concedida.
 */
export async function assignSchoolClaims(params: {
  actor: SchoolClaims & { userId: string };
  targetUid: string;
  role: SchoolRole;
  tenantId: string;
  schoolId?: string | null;
  classIds?: string[];
}): Promise<SchoolClaims> {
  const { actor, targetUid } = params;

  if (!CLAIM_GRANTING_ROLES.includes(actor.role)) {
    throw new Error("SCHOOL_CLAIMS_FORBIDDEN");
  }

  const role = normalizeSchoolRole(params.role);
  if (!role) {
    throw new Error("SCHOOL_ROLE_INVALID");
  }

  const tenantId = String(params.tenantId || "").trim();
  if (!tenantId) {
    throw new Error("SCHOOL_TENANT_REQUIRED");
  }

  // Um administrador só pode conceder claims dentro do seu próprio tenant.
  if (!CROSS_TENANT_ROLES.includes(actor.role) && tenantId !== actor.tenantId) {
    throw new Error("SCHOOL_TENANT_FORBIDDEN");
  }

  // E nunca pode conceder um papel mais poderoso do que o seu.
  if (CROSS_TENANT_ROLES.includes(role) && !CROSS_TENANT_ROLES.includes(actor.role)) {
    throw new Error("SCHOOL_ROLE_ESCALATION_FORBIDDEN");
  }

  if (!authAdminUsable()) {
    throw new Error("SCHOOL_CLAIMS_UNAVAILABLE");
  }

  const claims: SchoolClaims = {
    role,
    tenantId,
    schoolId: params.schoolId ?? actor.schoolId ?? null,
    classIds: (params.classIds || []).map(String),
  };

  await authAdmin.setCustomUserClaims(targetUid, {
    role: claims.role,
    tenantId: claims.tenantId,
    schoolId: claims.schoolId,
    classIds: claims.classIds,
  });

  const nowIso = new Date().toISOString();
  await safeSetDoc("users", targetUid, {
    role: claims.role,
    tenantId: claims.tenantId,
    schoolId: claims.schoolId,
    classIds: claims.classIds,
    claimsSyncedAt: nowIso,
  }, true);

  await safeAddDoc("auditLogs", {
    action: "SCHOOL_CLAIMS_ASSIGNED",
    actorId: actor.userId,
    actorRole: actor.role,
    actorTenantId: actor.tenantId,
    targetUid,
    grantedRole: claims.role,
    grantedTenantId: claims.tenantId,
    grantedSchoolId: claims.schoolId,
    grantedClassIds: claims.classIds,
    createdAt: nowIso,
  });

  return claims;
}

/**
 * Confirma que o actor pode operar sobre um recurso pertencente a `tenantId`.
 */
export function assertTenantAccess(claims: SchoolClaims, tenantId: string | null | undefined): void {
  if (CROSS_TENANT_ROLES.includes(claims.role)) return;
  if (!tenantId || tenantId !== claims.tenantId) {
    throw new Error("SCHOOL_TENANT_FORBIDDEN");
  }
}

/**
 * Confirma que o actor pode operar sobre uma turma concreta. Professores só
 * acedem às turmas listadas nas suas claims; administradores acedem a todas as
 * turmas do seu tenant.
 */
export function assertClassAccess(claims: SchoolClaims, classId: string | null | undefined): void {
  if (CROSS_TENANT_ROLES.includes(claims.role)) return;
  if (claims.role === "ORG_ADMIN" || claims.role === "SCHOOL_ADMIN") return;
  if (!classId || !claims.classIds.includes(classId)) {
    throw new Error("SCHOOL_CLASS_FORBIDDEN");
  }
}
