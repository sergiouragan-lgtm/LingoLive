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
