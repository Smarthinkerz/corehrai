import { Router } from "express";
import express from "express";
import { z } from "zod";
import {
  createCharge, retrieveCharge, verifyWebhookSignature, isTapConfigured,
} from "../integrations/tapPayments";

const router = Router();

const chargeSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(["OMR", "AED", "SAR", "USD", "EUR"]),
  description: z.string().optional(),
  customer: z.object({
    first_name: z.string().min(1),
    last_name: z.string().optional(),
    email: z.string().email(),
    phone: z.object({ country_code: z.string(), number: z.string() }).optional(),
  }),
  reference: z.object({ transaction: z.string().optional(), order: z.string().optional() }).optional(),
  redirect_url: z.string().url(),
});

router.get("/status", (_req, res) => {
  res.json({ configured: isTapConfigured() });
});

router.post("/charges", async (req, res) => {
  try {
    const data = chargeSchema.parse(req.body);
    const charge = await createCharge({
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      customer: data.customer,
      reference: data.reference,
      source: { id: "src_all" },
      redirect: { url: data.redirect_url },
      post: { url: `${req.protocol}://${req.get("host")}/api/tap-payments/webhook` },
    });
    res.status(201).json(charge);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.get("/charges/:id", async (req, res) => {
  try {
    const charge = await retrieveCharge(req.params.id);
    res.json(charge);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Webhook needs raw body for signature verification — mounted with express.raw upstream.
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const rawBody = (req.body as Buffer).toString("utf8");
    const signature = req.header("hashstring") || req.header("x-tap-signature") || undefined;
    if (!verifyWebhookSignature(rawBody, signature)) {
      return res.status(401).json({ error: "Invalid signature" });
    }
    try {
      const event = JSON.parse(rawBody);
      // TODO: map event.type → invoice update / subscription state.
      res.json({ received: true, type: event?.type, id: event?.id });
    } catch {
      res.status(400).json({ error: "Invalid JSON" });
    }
  }
);

export default router;
