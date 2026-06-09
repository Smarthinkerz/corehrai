/**
 * Tap Payments adapter (Oman / GCC).
 * Docs: https://www.tap.company/developers
 *
 * This is a thin wrapper that lets the app create charges, retrieve charges,
 * and verify webhooks without leaking SDK details into the routes.
 *
 * Configure with TAP_SECRET_KEY (sk_...) and TAP_WEBHOOK_SECRET in env.
 * If TAP_SECRET_KEY is unset all calls return a clear "not configured" error.
 */
import crypto from "crypto";

const TAP_API_BASE = "https://api.tap.company/v2";

export interface TapCustomer {
  first_name: string;
  last_name?: string;
  email: string;
  phone?: { country_code: string; number: string };
}

export interface TapChargeRequest {
  amount: number;
  currency: "OMR" | "AED" | "SAR" | "USD" | "EUR";
  description?: string;
  reference?: { transaction?: string; order?: string };
  customer: TapCustomer;
  source?: { id?: string }; // e.g. "src_all"
  redirect?: { url: string };
  post?: { url: string };
  metadata?: Record<string, string | number | boolean>;
}

export interface TapChargeResponse {
  id: string;
  status: string;
  amount: number;
  currency: string;
  transaction?: { url?: string };
  customer: TapCustomer & { id?: string };
}

function requireKey(): string {
  const key = process.env.TAP_SECRET_KEY;
  if (!key) {
    throw new Error("TAP_SECRET_KEY is not configured");
  }
  return key;
}

export function isTapConfigured(): boolean {
  return !!process.env.TAP_SECRET_KEY;
}

export async function createCharge(charge: TapChargeRequest): Promise<TapChargeResponse> {
  const key = requireKey();
  const res = await fetch(`${TAP_API_BASE}/charges`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(charge),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tap createCharge failed (${res.status}): ${text}`);
  }
  return (await res.json()) as TapChargeResponse;
}

export async function retrieveCharge(chargeId: string): Promise<TapChargeResponse> {
  const key = requireKey();
  const res = await fetch(`${TAP_API_BASE}/charges/${encodeURIComponent(chargeId)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tap retrieveCharge failed (${res.status}): ${text}`);
  }
  return (await res.json()) as TapChargeResponse;
}

/** Verify Tap webhook signature using HMAC-SHA256 of the raw body. */
export function verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
  const secret = process.env.TAP_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
