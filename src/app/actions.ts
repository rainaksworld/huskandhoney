"use server";

import { z } from "zod";
import { getDb, schema } from "@/server/db";
import { allow } from "@/server/security";
import { sendMail } from "@/server/email";
import {
  getOrderByProviderId,
  markPaid,
  startCheckout,
  type StartedCheckout,
} from "@/server/orders";
import { activeProvider, sandboxSign, verifyCheckoutSignature } from "@/server/payments";
import { notifyOrderPaid } from "@/server/notify";
import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { getCoffee, getEquipment, getKit } from "@/lib/catalogue";

export type FormResult = { ok: boolean; message: string };

const ListSchema = z
  .string()
  .regex(/^(cafe|newsletter|product:[a-z0-9-]{2,40})$/)
  .refine((l) => {
    if (!l.startsWith("product:")) return true;
    const slug = l.slice("product:".length);
    return Boolean(getKit(slug) || getEquipment(slug) || getCoffee(slug) || slug === "house-blend");
  });

/** Email sign-up for the café opening, a product's availability, or news. */
export async function subscribe(_: FormResult | null, form: FormData): Promise<FormResult> {
  if (String(form.get("website") ?? "")) return { ok: true, message: "Thanks, you're on the list." }; // honeypot
  const email = z.string().trim().toLowerCase().email().max(120).safeParse(form.get("email"));
  const list = ListSchema.safeParse(form.get("list"));
  if (!email.success) return { ok: false, message: "Enter a valid email address." };
  if (!list.success) return { ok: false, message: "Something went wrong. Please try again." };
  if (!(await allow("subscribe", 8, 10 * 60_000)))
    return { ok: false, message: "Too many tries. Please wait a few minutes." };

  const db = await getDb();
  await db
    .insert(schema.subscribers)
    .values({ email: email.data, list: list.data })
    .onConflictDoNothing();
  return {
    ok: true,
    message:
      list.data === "cafe"
        ? "Thanks. We'll email you when the café opens."
        : list.data.startsWith("product:")
          ? "Thanks. We'll email you when it's available."
          : "Thanks, you're on the list.",
  };
}

const MessageSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(120),
  body: z.string().trim().min(5, "Write a message").max(3000),
});

/** Contact form: stores the message and emails the owner if email is set up. */
export async function sendMessage(_: FormResult | null, form: FormData): Promise<FormResult> {
  if (String(form.get("website") ?? "")) return { ok: true, message: "Thanks. We'll reply soon." };
  const parsed = MessageSchema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    body: form.get("msg"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  if (!(await allow("contact", 5, 10 * 60_000)))
    return { ok: false, message: "Too many messages. Please wait a few minutes." };

  const db = await getDb();
  await db.insert(schema.messages).values(parsed.data);
  if (process.env.OWNER_EMAIL) {
    await sendMail({
      to: process.env.OWNER_EMAIL,
      subject: `Website message from ${parsed.data.name}`,
      text: `${parsed.data.body}\n\n${parsed.data.name} <${parsed.data.email}>`,
      replyTo: parsed.data.email,
    });
  }
  return { ok: true, message: "Thanks. We've got your message and will reply soon." };
}

/* ------------------------------------------------------------------ */
/* Checkout                                                            */
/* ------------------------------------------------------------------ */

export async function beginCheckout(input: unknown): Promise<StartedCheckout> {
  if (!(await allow("checkout", 12, 10 * 60_000)))
    return { ok: false, error: "Too many attempts. Please wait a few minutes." };
  return startCheckout(input);
}

export type ConfirmResult =
  | { ok: true; orderId: string; token: string }
  | { ok: false; error: string };

/** Called by the browser after the payment window reports success. */
export async function confirmPayment(input: {
  providerOrderId: string;
  paymentId: string;
  signature: string;
}): Promise<ConfirmResult> {
  const p = z
    .object({
      providerOrderId: z.string().min(4).max(80),
      paymentId: z.string().min(4).max(80),
      signature: z.string().min(16).max(200),
    })
    .safeParse(input);
  if (!p.success) return { ok: false, error: "Payment details were incomplete." };

  const order = await getOrderByProviderId(p.data.providerOrderId);
  if (!order || !order.providerOrderId) return { ok: false, error: "We couldn't find that order." };
  if (!verifyCheckoutSignature(order.providerOrderId, p.data.paymentId, p.data.signature)) {
    return { ok: false, error: "We couldn't verify this payment. If money left your account, contact us." };
  }

  const { order: paid, firstTime } = await markPaid(order.providerOrderId, p.data.paymentId);
  if (!paid) return { ok: false, error: "We couldn't find that order." };
  if (firstTime) {
    updateTag("stock");
    const db = await getDb();
    const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, paid.id));
    await notifyOrderPaid(paid, items);
  }
  return { ok: true, orderId: paid.id, token: paid.accessToken };
}

/**
 * Development/test only: stands in for the payment window and signs the
 * result the way Razorpay does. Refuses to run unless the sandbox is active,
 * which is impossible in a production build.
 */
export async function sandboxPay(providerOrderId: string) {
  if (activeProvider() !== "sandbox") throw new Error("Sandbox payments are disabled");
  const paymentId = `pay_sandbox_${Math.random().toString(36).slice(2, 12)}`;
  return { paymentId, signature: sandboxSign(providerOrderId, paymentId) };
}
