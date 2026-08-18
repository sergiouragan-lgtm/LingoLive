import { Response, NextFunction } from "express";

export function requireRole(...roles: string[]) {
  return (req: any, res: Response, next: NextFunction) => {
    const role = req.user?.role || "user";

    if (!roles.includes(role)) {
      return res.status(403).json({ error: "Sem permissão para esta ação." });
    }

    next();
  };
}
