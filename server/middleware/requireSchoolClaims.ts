import { Response, NextFunction } from "express";
import {
  SchoolRole,
  normalizeSchoolRole,
  resolveSchoolClaims,
} from "../services/schoolClaims.service";

const ERROR_STATUS: Record<string, number> = {
  SCHOOL_CLAIMS_UNRESOLVED: 401,
  SCHOOL_TENANT_UNRESOLVED: 403,
  SCHOOL_TENANT_FORBIDDEN: 403,
  SCHOOL_CLASS_FORBIDDEN: 403,
  SCHOOL_CLAIMS_FORBIDDEN: 403,
  SCHOOL_ROLE_ESCALATION_FORBIDDEN: 403,
  SCHOOL_ROLE_INVALID: 400,
  SCHOOL_TENANT_REQUIRED: 400,
  SCHOOL_CLAIMS_UNAVAILABLE: 503,
};

export function schoolClaimsErrorStatus(code: string): number {
  return ERROR_STATUS[code] || 500;
}

/**
 * Resolve e anexa as claims escolares assinadas a `req.schoolClaims`.
 *
 * Deve ser montado depois de `requireAuth`. Falha fechada: sem tenant
 * resolúvel o pedido é recusado em vez de assumir um tenant por omissão.
 */
export async function attachSchoolClaims(req: any, res: Response, next: NextFunction) {
  try {
    req.schoolClaims = await resolveSchoolClaims(req.user);
    return next();
  } catch (error: any) {
    const code = String(error?.message || "SCHOOL_CLAIMS_UNRESOLVED");
    return res.status(schoolClaimsErrorStatus(code)).json({
      error: code,
      message: "Não foi possível resolver a autorização escolar deste utilizador.",
    });
  }
}

/**
 * Exige que as claims resolvidas contenham um dos papéis indicados.
 * Ao contrário de `requireRole`, não confia no campo livre `req.user.role`
 * sem normalização nem aceita um tenant vindo do corpo do pedido.
 */
export function requireSchoolRole(...roles: SchoolRole[]) {
  return (req: any, res: Response, next: NextFunction) => {
    const claims = req.schoolClaims;
    if (!claims) {
      return res.status(500).json({
        error: "SCHOOL_CLAIMS_MISSING",
        message: "attachSchoolClaims tem de ser montado antes de requireSchoolRole.",
      });
    }
    const normalized = normalizeSchoolRole(claims.role);
    if (!normalized || !roles.includes(normalized)) {
      return res.status(403).json({
        error: "SCHOOL_ROLE_FORBIDDEN",
        message: "Sem permissão escolar para esta ação.",
      });
    }
    return next();
  };
}
