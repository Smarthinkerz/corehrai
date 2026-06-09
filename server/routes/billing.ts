import { Router, Request, Response } from "express";
import { db } from "../db";
import { organizations } from "@shared/schema";
import { eq } from "drizzle-orm";
import { getPlanFeatures, getPlanLimits } from "../middleware/featureGating";
import { storage } from "../storage";
import { z } from "zod";
import { validateBody } from "../middleware/validate";

const router = Router();

const TAP_CHECKOUT_URL = "https://smarthinkerz.replit.app/api/checkout";

const PRICING_PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: "month",
    description: "Get started with basic HR management",
    tapPlanSlug: null,
    features: [
      "Up to 3 users",
      "Up to 10 employees",
      "Dashboard & metrics",
      "Employee directory",
      "Department management",
      "Task management",
      "Basic notifications",
      "Self-service portal",
    ],
    limits: { maxUsers: 3, maxEmployees: 10 },
    highlighted: false,
  },
  {
    id: "pro",
    name: "Professional",
    price: 29,
    interval: "month",
    annualPrice: 290,
    description: "Complete HR suite for growing teams",
    tapPlanSlug: "brainpower-pro",
    tapAnnualSlug: "brainpower-pro",
    features: [
      "Up to 25 users",
      "Up to 100 employees",
      "Everything in Free",
      "Recruitment & onboarding",
      "Performance reviews",
      "Payroll management",
      "Compliance tracking",
      "Surveys & engagement",
      "Knowledge base",
      "Attendance & leave",
      "Analytics & reports",
      "Calendar & scheduling",
      "Email communications",
      "Org chart",
      "Recognition program",
      "Document management",
      "Wellness programs",
    ],
    limits: { maxUsers: 25, maxEmployees: 100 },
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 99,
    interval: "month",
    annualPrice: 990,
    description: "Advanced AI-powered HR for large organizations",
    tapPlanSlug: "brainpower-enterprise",
    tapAnnualSlug: "brainpower-enterprise",
    features: [
      "Unlimited users",
      "Unlimited employees",
      "Everything in Professional",
      "AI-powered insights",
      "Interview coach AI",
      "Workforce planning AI",
      "Sentiment analysis",
      "HR chatbot",
      "VR training modules",
      "Digital twin scenarios",
      "Emotion AI analysis",
      "Resignation risk prediction",
      "Career path planning",
      "Talent marketplace",
      "Shift management",
      "Compliance reports AI",
      "Anonymous feedback",
      "Meeting tracker",
      "Custom branding",
      "SSO / SAML support",
      "API access",
      "Priority support",
      "Data export (GDPR)",
      "Audit log access",
    ],
    limits: { maxUsers: -1, maxEmployees: -1 },
    highlighted: false,
  },
];

router.get("/plans", (_req: Request, res: Response) => {
  const plansForClient = PRICING_PLANS.map(({ tapPlanSlug, tapAnnualSlug, ...rest }) => rest);
  res.json(plansForClient);
});

router.get("/current", async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    if (!user.organizationId) {
      return res.json({
        plan: "free",
        status: "active",
        features: getPlanFeatures("free"),
        limits: getPlanLimits("free"),
      });
    }

    const [org] = await db.select().from(organizations).where(eq(organizations.id, user.organizationId));
    if (!org) {
      return res.json({
        plan: "free",
        status: "active",
        features: getPlanFeatures("free"),
        limits: getPlanLimits("free"),
      });
    }

    res.json({
      plan: org.plan,
      status: org.subscriptionStatus,
      features: getPlanFeatures(org.plan),
      limits: getPlanLimits(org.plan),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch billing info" });
  }
});

const checkoutSchema = z.object({
  plan: z.enum(["pro", "enterprise"]),
  cycle: z.enum(["monthly", "annual", "yearly"]).optional().default("monthly"),
  phone: z.string().trim().min(6).optional(),
});

router.post("/checkout", validateBody(checkoutSchema), async (req: Request, res: Response) => {
  try {
    const user = req.user! as any;
    const { plan, cycle, phone: phoneFromBody } = req.body as { plan: string; cycle?: string; phone?: string };

    // Smarthinkerz proxy expects "monthly" or "yearly"
    const tapCycle = cycle === "annual" || cycle === "yearly" ? "yearly" : "monthly";
    const selectedPlan = PRICING_PLANS.find(p => p.id === plan);
    if (!selectedPlan) {
      return res.status(400).json({ error: "Plan not found" });
    }

    const tapSlug = tapCycle === "yearly"
      ? (selectedPlan as any).tapAnnualSlug
      : selectedPlan.tapPlanSlug;

    if (!tapSlug) {
      return res.status(400).json({ error: "Payment not available for this plan" });
    }

    const phone = (phoneFromBody || user.phone || "").trim();
    if (!phone) {
      return res.status(400).json({
        error: "Phone number with country code is required (e.g. +96899887766)",
        requiresPhone: true,
      });
    }

    await storage.createActivityLog({
      userId: user.id,
      action: "CHECKOUT",
      description: `Initiated ${plan} (${tapCycle}) checkout via Smarthinkerz Tap proxy`,
      entityType: "billing",
      entityId: user.id,
    });

    // Client will POST these fields as application/x-www-form-urlencoded
    // to TAP_CHECKOUT_URL. Smarthinkerz responds with 303 → Tap hosted checkout.
    res.json({
      checkoutUrl: TAP_CHECKOUT_URL,
      method: "POST",
      fields: {
        plan: tapSlug,
        cycle: tapCycle,
        name: user.fullName,
        email: user.email,
        phone,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to initiate checkout" });
  }
});

const upgradeSchema = z.object({
  plan: z.enum(["free", "pro", "enterprise"]),
});

router.post("/upgrade", validateBody(upgradeSchema), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { plan } = req.body;

    if (plan !== "free") {
      return res.status(400).json({
        error: "Paid plans require payment via Tap Payments checkout",
        requiresPayment: true,
      });
    }

    if (!user.organizationId) {
      return res.status(400).json({ error: "No organization found. Create an organization first." });
    }

    const limits = getPlanLimits(plan);
    await db.update(organizations).set({
      plan,
      maxUsers: limits.maxUsers === -1 ? 999999 : limits.maxUsers,
      maxEmployees: limits.maxEmployees === -1 ? 999999 : limits.maxEmployees,
      subscriptionStatus: "active",
      updatedAt: new Date(),
    }).where(eq(organizations.id, user.organizationId));

    await storage.createActivityLog({
      userId: user.id,
      action: "DOWNGRADE",
      description: `Downgraded to ${plan} plan`,
      entityType: "billing",
      entityId: user.id,
    });

    res.json({ message: `Successfully changed to ${plan} plan`, plan });
  } catch (error) {
    res.status(500).json({ error: "Failed to update plan" });
  }
});

router.post("/webhook/tap", async (req: Request, res: Response) => {
  try {
    const { charge_id, status, metadata } = req.body;

    if (status === "CAPTURED" && metadata?.organizationId) {
      const orgId = parseInt(metadata.organizationId);
      const plan = metadata.plan || "pro";
      const limits = getPlanLimits(plan);

      await db.update(organizations).set({
        plan,
        maxUsers: limits.maxUsers === -1 ? 999999 : limits.maxUsers,
        maxEmployees: limits.maxEmployees === -1 ? 999999 : limits.maxEmployees,
        subscriptionStatus: "active",
        updatedAt: new Date(),
      }).where(eq(organizations.id, orgId));
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Tap webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

router.get("/invoices", async (_req: Request, res: Response) => {
  try {
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

export default router;
