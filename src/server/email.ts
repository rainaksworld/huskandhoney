import "server-only";
import { formatINR } from "@/lib/catalogue";
import { orderNumber } from "./orders";

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
