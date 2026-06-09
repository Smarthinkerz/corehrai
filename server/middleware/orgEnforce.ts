import type { Request, Response, NextFunction } from "express";

/**
 * Soft enforcement: sets req.organizationId from session and rejects unauth users.
 * Works alongside resolveOrgScope. Use on entity routers that require multi-tenant
 * isolation (employees, candidates, departments, hr_tasks, documents).
 */
export function enforceOrgScope(req: Request, res: Response, next: NextFunction) {
  const user = req.user as any;
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const orgId = user.organizationId;
  if (orgId == null) {
    return res.status(403).json({ error: "User is not associated with an organization" });
  }
  req.organizationId = orgId;
  next();
}

/**
 * Filters an arbitrary array of records by `organizationId === req.organizationId`,
 * passing through entries whose orgId is null (un-scoped legacy rows).
 */
export function filterByOrg<T extends { organizationId?: number | null }>(
  rows: T[],
  orgId: number | undefined
): T[] {
  if (orgId == null) return rows;
  return rows.filter((r) => r.organizationId == null || r.organizationId === orgId);
}

/**
 * Stamps a payload with organizationId from req if not already set.
 */
export function stampOrg<T extends { organizationId?: number | null }>(
  payload: T,
  orgId: number | undefined
): T {
  if (orgId == null) return payload;
  if (payload.organizationId != null) return payload;
  return { ...payload, organizationId: orgId };
}
