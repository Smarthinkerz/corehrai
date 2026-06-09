import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const CSRF_COOKIE = "csrf-token";
const CSRF_HEADER = "x-csrf-token";

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    ensureCsrfCookie(res);
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER] as string;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: "CSRF token validation failed" });
  }

  next();
}

export function ensureCsrfCookie(res: Response) {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000,
  });
}

export function csrfTokenRoute(req: Request, res: Response) {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000,
  });
  res.json({ csrfToken: token });
}
