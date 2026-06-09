import { Router, Request, Response } from "express";
import * as otplib from "otplib";
import QRCode from "qrcode";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const authenticator = otplib.TOTP ? new otplib.TOTP() : (otplib as any).authenticator || otplib;

const router = Router();

router.post("/setup", async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, "AI HR Agent", secret);
    const qrCodeUrl = await QRCode.toDataURL(otpauth);

    await db.update(users).set({ twoFactorSecret: secret }).where(eq(users.id, user.id));

    res.json({ secret, qrCodeUrl, otpauth });
  } catch (error) {
    res.status(500).json({ error: "Failed to setup 2FA" });
  }
});

router.post("/verify", async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    const [currentUser] = await db.select().from(users).where(eq(users.id, user.id));
    if (!currentUser?.twoFactorSecret) {
      return res.status(400).json({ error: "2FA not set up. Please call /setup first." });
    }

    const isValid = authenticator.verify({ token, secret: currentUser.twoFactorSecret });
    if (!isValid) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    await db.update(users).set({ twoFactorEnabled: true }).where(eq(users.id, user.id));

    res.json({ message: "Two-factor authentication enabled successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to verify 2FA" });
  }
});

router.post("/disable", async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    const [currentUser] = await db.select().from(users).where(eq(users.id, user.id));
    if (!currentUser?.twoFactorSecret || !currentUser.twoFactorEnabled) {
      return res.status(400).json({ error: "2FA is not enabled" });
    }

    const isValid = authenticator.verify({ token, secret: currentUser.twoFactorSecret });
    if (!isValid) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    await db.update(users).set({ twoFactorEnabled: false, twoFactorSecret: null }).where(eq(users.id, user.id));

    res.json({ message: "Two-factor authentication disabled successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to disable 2FA" });
  }
});

router.get("/status", async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const [currentUser] = await db.select().from(users).where(eq(users.id, user.id));
    res.json({ enabled: currentUser?.twoFactorEnabled || false });
  } catch (error) {
    res.status(500).json({ error: "Failed to get 2FA status" });
  }
});

export default router;
