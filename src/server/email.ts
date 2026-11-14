import "server-only";
import { formatINR } from "@/lib/catalogue";
import { orderNumber } from "./orders";
import { STATUS_LABEL } from "@/lib/order-status";
import type { OrderStatus } from "./schema";

/**
 * Transactional email through Resend's HTTP API (no SDK dependency).
 * Without RESEND_API_KEY nothing is sent; the message is logged instead,
 * so local development never emails anyone.
 */
type Mail = { to: string; subject: string; text: string; replyTo?: string };

export async function sendMail(mail: Mail) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!key || !from) {
    console.info(`[mail:not-sent] to=${mail.to} subject="${mail.subject}"`);
    // Local development only: show the body so links (verify, reset) can be followed.
    if (process.env.NODE_ENV !== "production") console.info(mail.text);
    return { sent: false as const };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from,
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
        reply_to: mail.replyTo,
      }),
      cache: "no-store",
    });
    if (!res.ok) console.error("[mail] failed", res.status, await res.text().catch(() => ""));
    return { sent: res.ok };
  } catch (err) {
    console.error("[mail] error", err);
    return { sent: false as const };
  }
}

type OrderLike = {
  id: string;
  seq: number;
  accessToken: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  note: string | null;
  subtotal: number;
  shipping: number;
  total: number;
};
type ItemLike = { title: string; meta: string; unitPrice: number; qty: number };

function orderText(o: OrderLike, items: ItemLike[]) {
  const lines = items.map(
    (i) => `${i.qty} × ${i.title} (${i.meta}) — ${formatINR((i.unitPrice * i.qty) / 100)}`,
  );
  return [
    ...lines,
    "",
    `Subtotal: ${formatINR(o.subtotal / 100)}`,
    `Shipping: ${o.shipping ? formatINR(o.shipping / 100) : "Free"}`,
    `Total paid: ${formatINR(o.total / 100)}`,
    "",
    "Delivering to:",
    o.name,
    o.address,
    `${o.city}, ${o.state} ${o.pincode}`,
    o.phone,
  ].join("\n");
}

export async function sendOrderEmails(o: OrderLike, items: ItemLike[]) {
  const site = process.env.SITE_URL ?? "";
  const number = orderNumber(o.seq);
  const link = site ? `${site}/order/${o.id}?t=${o.accessToken}` : "";
  await sendMail({
    to: o.email,
    subject: `Your Husk & Honey order ${number}`,
    text: [
      `Hi ${o.name.split(" ")[0]},`,
      "",
      `Thank you. We've received your payment for order ${number}.`,
      "",
      orderText(o, items),
      "",
      link ? `See your order any time: ${link}` : "",
      "",
      "Husk & Honey, Siliguri",
    ].join("\n"),
    replyTo: process.env.OWNER_EMAIL,
  });
  if (process.env.OWNER_EMAIL) {
    await sendMail({
      to: process.env.OWNER_EMAIL,
      subject: `New paid order ${number} — ${formatINR(o.total / 100)}`,
      text: [orderText(o, items), "", o.note ? `Note: ${o.note}` : "", `${site}/admin/orders/${o.id}`].join("\n"),
      replyTo: o.email,
    });
  }
}

/* ------------------------------------------------------------------ */
/* Account emails                                                       */
/* ------------------------------------------------------------------ */

type AccountLike = { name: string; email: string };

export async function sendWelcomeEmail(u: AccountLike, verifyToken: string) {
  const site = process.env.SITE_URL ?? "";
  return sendMail({
    to: u.email,
    subject: "Welcome to Husk & Honey - please confirm your email",
    text: [
      `Hi ${u.name.split(" ")[0]},`,
      "Thanks for creating a Husk & Honey account. Please confirm this is your email address:",
      `${site}/verify-email?t=${verifyToken}`,
      "Confirming lets us show any earlier orders you placed with this email in your account. The link works for 7 days.",
      "If you didn't create this account, you can ignore this email.",
      "Husk & Honey, Siliguri",
    ].join("\n\n"),
    replyTo: process.env.OWNER_EMAIL,
  });
}

export async function sendVerifyEmail(u: AccountLike, verifyToken: string) {
  const site = process.env.SITE_URL ?? "";
  return sendMail({
    to: u.email,
    subject: "Confirm your Husk & Honey email",
    text: [
      `Hi ${u.name.split(" ")[0]},`,
      "Please confirm your email address:",
      `${site}/verify-email?t=${verifyToken}`,
      "The link works for 7 days.",
      "Husk & Honey, Siliguri",
    ].join("\n\n"),
    replyTo: process.env.OWNER_EMAIL,
  });
}

export async function sendPasswordResetEmail(u: AccountLike, resetToken: string) {
  const site = process.env.SITE_URL ?? "";
  return sendMail({
    to: u.email,
    subject: "Reset your Husk & Honey password",
    text: [
      `Hi ${u.name.split(" ")[0]},`,
      "Someone asked to reset the password for your Husk & Honey account. To choose a new one:",
      `${site}/reset-password?t=${resetToken}`,
      "The link works for 1 hour and only once.",
      "If this wasn't you, ignore this email - your password stays the same.",
      "Husk & Honey, Siliguri",
    ].join("\n\n"),
    replyTo: process.env.OWNER_EMAIL,
  });
}

/** A logistics update (packed/shipped/delivered/cancelled) after the order's own confirmation email. */
export async function sendStatusEmail(
  o: Pick<OrderLike, "id" | "seq" | "accessToken" | "name" | "email">,
  status: OrderStatus,
  trackingNote: string | null,
) {
  const site = process.env.SITE_URL ?? "";
  const number = orderNumber(o.seq);
  const link = site ? `${site}/order/${o.id}?t=${o.accessToken}` : "";
  const label = STATUS_LABEL[status];
  const paras = [`Hi ${o.name.split(" ")[0]},`, `Your order ${number} is now: ${label}.`];
  if (trackingNote) paras.push(trackingNote);
  if (link) paras.push(`See your order any time: ${link}`);
  paras.push("Husk & Honey, Siliguri");
  return sendMail({
    to: o.email,
    subject: `Order ${number}: ${label}`,
    text: paras.join("\n\n"),
    replyTo: process.env.OWNER_EMAIL,
  });
}
