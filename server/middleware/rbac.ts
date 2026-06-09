import type { Request, Response, NextFunction } from "express";

export type Role = "admin" | "manager" | "employee" | "user";

const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 4,
  manager: 3,
  employee: 2,
  user: 1,
};

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const userRole = ((req.user as any)?.role || "user") as Role;
    if (allowedRoles.includes(userRole)) {
      return next();
    }
    return res.status(403).json({ error: "Insufficient permissions", requiredRoles: allowedRoles, yourRole: userRole });
  };
}

export function requireMinRole(minRole: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const userRole = ((req.user as any)?.role || "user") as Role;
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;
    if (userLevel >= requiredLevel) {
      return next();
    }
    return res.status(403).json({ error: "Insufficient permissions", requiredMinRole: minRole, yourRole: userRole });
  };
}
