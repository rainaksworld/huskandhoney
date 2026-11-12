import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Payment providers.
 *
 * - `razorpay`: live or test keys from the Razorpay dashboard
 *   (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET / RAZORPAY_WEBHOOK_SECRET).
 * - `sandbox`: an offline stand-in used ONLY for local development and the
 *   automated tests. It can never be enabled in a production build.
 * - `none`: payments are switched off; checkout says so and takes no orders.
 */
export type ProviderName = "razorpay" | "sandbox" | "none";

export function activeProvider(): ProviderName {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) return "razorpay";
  if (process.env.NODE_ENV !== "production" && process.env.PAYMENTS_SANDBOX === "1") return "sandbox";
  return "none";
}

export type ProviderOrder = { id: string };

export async function createProviderOrder(input: {
  amountPaise: number;
  receipt: string;
  notes: Record<string, string>;
}): Promise<ProviderOrder> {
  const provider = activeProvider();
  if (provider === "razorpay") {
    const auth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`,
    ).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount: input.amountPaise,
        currency: "INR",
        receipt: input.receipt.slice(0, 40),
        notes: input.notes,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Razorpay order failed (${res.status}): ${text.slice(0, 300)}`);
    }
    const data = (await res.json()) as { id: string };
    return { id: data.id };
  }
  if (provider === "sandbox") {
    return { id: `sandbox_${input.receipt}_${Math.random().toString(36).slice(2, 10)}` };
  }
  throw new Error("Payments are not configured");
}

function hmacHex(message: string, secret: string) {
  return createHmac("sha256", secret).update(message).digest("hex");
}

function safeEqualHex(a: string, b: string) {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * Razorpay checkout signature: HMAC-SHA256(order_id + "|" + payment_id, key_secret).
 * `orderId` must be the id we stored, never the one sent back by the browser.
 */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  const provider = activeProvider();
  const secret =
    provider === "razorpay"
      ? process.env.RAZORPAY_KEY_SECRET!
      : provider === "sandbox"
        ? sandboxSecret()
        : null;
  if (!secret) return false;
  return safeEqualHex(hmacHex(`${orderId}|${paymentId}`, secret), signature);
}

/** Webhook signature: HMAC-SHA256(raw body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  return safeEqualHex(hmacHex(rawBody, secret), signature);
}

/** Sandbox only: the test page signs like Razorpay does, with a dev secret. */
export function sandboxSecret() {
  return process.env.SANDBOX_SECRET ?? "hh-sandbox-dev-secret";
}
export function sandboxSign(orderId: string, paymentId: string) {
  return hmacHex(`${orderId}|${paymentId}`, sandboxSecret());
}
