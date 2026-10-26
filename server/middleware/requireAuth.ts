import { Response, NextFunction } from "express";
import { authAdmin } from "../config/firebaseAdmin";
import { getSandboxFallbackEnabled } from "../config/env";

export async function requireAuth(req: any, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;
    const sandboxEnabled = getSandboxFallbackEnabled();

    if (!token) {
      if (sandboxEnabled) {
        req.user = { uid: "sandbox-demo-user", email: "sandbox@example.com", role: "super_admin" };
        return next();
      }
      return res.status(401).json({ error: "Token ausente" });
    }

    if (authAdmin) {
      const decoded = await authAdmin.verifyIdToken(token);
      req.user = decoded;
      return next();
    } else if (sandboxEnabled) {
      req.user = { uid: "sandbox-demo-user", email: "sandbox@example.com", role: "super_admin" };
      return next();
    } else {
      return res.status(500).json({ error: "Firebase Authentication service is not initialized." });
    }
  } catch (error: any) {
    if (getSandboxFallbackEnabled()) {
      req.user = { uid: "sandbox-demo-user", email: "sandbox@example.com", role: "super_admin" };
      return next();
    }
    return res.status(401).json({ error: "Token inválido" });
  }
}

/**
 * Enforces ownership for routes that address a user through `:userId`.
 * This must run after requireAuth so req.user is a verified Firebase token.
 */
export function requireSelfParam(req: any, res: Response, next: NextFunction) {
  const authenticatedUid = req.user?.uid;
  const requestedUid = req.params?.userId;

  if (!authenticatedUid || !requestedUid) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const hasElevatedClaim =
    req.user?.admin === true ||
    req.user?.role === "admin" ||
    req.user?.role === "super_admin";

  if (authenticatedUid !== requestedUid && !hasElevatedClaim) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  return next();
}

/** Enforces ownership when the addressed user is supplied in the request body. */
export function requireSelfBody(req: any, res: Response, next: NextFunction) {
  const authenticatedUid = req.user?.uid;
  const requestedUid = req.body?.userId;

  if (!authenticatedUid || !requestedUid) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const hasElevatedClaim =
    req.user?.admin === true ||
    req.user?.role === "admin" ||
    req.user?.role === "super_admin";

  if (authenticatedUid !== requestedUid && !hasElevatedClaim) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  return next();
}
