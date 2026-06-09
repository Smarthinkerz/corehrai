import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      organizationId?: number | null;
    }
  }
}

/**
 * Resolve the active organizationId for the request from the authenticated user.
 * Attaches `req.organizationId`. Does not enforce — entity routes are responsible
 * for filtering. Use `requireOrgScope` to enforce that an org context exists.
 */
export function resolveOrgScope(req: Request, _res: Response, next: NextFunction) {
  const user = req.user as any;
  req.organizationId = user?.organizationId ?? null;
  next();
}

export function requireOrgScope(req: Request, res: Response, next: NextFunction) {
  const user = req.user as any;
  const orgId = user?.organizationId;
  if (orgId == null) {
    return res.status(403).json({ error: "Organization context required" });
  }
  req.organizationId = orgId;
  next();
}

/** Helper for storage callers: returns the user's organizationId or undefined. */
export function getReqOrg(req: Request): number | undefined {
  return req.organizationId ?? (req.user as any)?.organizationId ?? undefined;
}
