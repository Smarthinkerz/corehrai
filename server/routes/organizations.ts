import { Router, Request, Response } from "express";
import { db } from "../db";
import { organizations, users, insertOrganizationSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    if (user.role === "super_admin") {
      const orgs = await db.select().from(organizations);
      return res.json(orgs);
    }
    if (user.organizationId) {
      const [org] = await db.select().from(organizations).where(eq(organizations.id, user.organizationId));
      return res.json(org ? [org] : []);
    }
    return res.json([]);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch organizations" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    if (!org) return res.status(404).json({ error: "Organization not found" });
    res.json(org);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch organization" });
  }
});

const createOrgSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  billingEmail: z.string().email().optional(),
  plan: z.string().optional(),
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const data = createOrgSchema.parse(req.body);

    const existing = await db.select().from(organizations).where(eq(organizations.slug, data.slug));
    if (existing.length > 0) {
      return res.status(400).json({ error: "Organization slug already taken" });
    }

    const [org] = await db.insert(organizations).values({
      name: data.name,
      slug: data.slug,
      billingEmail: data.billingEmail,
      plan: data.plan || "free",
    }).returning();

    await db.update(users).set({ organizationId: org.id, role: "admin" }).where(eq(users.id, req.user!.id));

    res.status(201).json(org);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: "Failed to create organization" });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [org] = await db.update(organizations).set({
      ...req.body,
      updatedAt: new Date(),
    }).where(eq(organizations.id, id)).returning();
    if (!org) return res.status(404).json({ error: "Organization not found" });
    res.json(org);
  } catch (error) {
    res.status(500).json({ error: "Failed to update organization" });
  }
});

router.get("/:id/users", async (req: Request, res: Response) => {
  try {
    const orgId = parseInt(req.params.id);
    const orgUsers = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      department: users.department,
      isActive: users.isActive,
      emailVerified: users.emailVerified,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.organizationId, orgId));
    res.json(orgUsers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch organization users" });
  }
});

router.get("/:id/usage", async (req: Request, res: Response) => {
  try {
    const orgId = parseInt(req.params.id);
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
    if (!org) return res.status(404).json({ error: "Organization not found" });

    const orgUsers = await db.select().from(users).where(eq(users.organizationId, orgId));

    res.json({
      plan: org.plan,
      currentUsers: orgUsers.length,
      maxUsers: org.maxUsers,
      maxEmployees: org.maxEmployees,
      subscriptionStatus: org.subscriptionStatus,
      features: org.features,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch usage" });
  }
});

export default router;
