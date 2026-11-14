import "server-only";
import { orderNumber } from "./orders";

/**
 * Appends each paid order as a row in the owner's Google Sheet, through a
 * small Google Apps Script "web app" attached to that sheet (see
 * docs/google-sheet-setup.md). Without SHEET_WEBHOOK_URL nothing is sent;
 * the attempt is logged instead, same as email.
 */
type OrderLike = {
  seq: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  note: string | null;
  total: number;
  whatsappOptIn: boolean;
  paidAt: Date | string | null;
  createdAt: Date | string;
};
type ItemLike = { title: string; meta: string; qty: number };

export async function appendOrderToSheet(o: OrderLike, items: ItemLike[]) {
  const url = process.env.SHEET_WEBHOOK_URL;
  const number = orderNumber(o.seq);
  if (!url) {
    console.info(`[sheet:not-sent] order=${number}`);
    return { sent: false as const };
  }
  const when = new Date(o.paidAt ?? o.createdAt);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        secret: process.env.SHEET_WEBHOOK_SECRET ?? "",
        order: number,
        date: when.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        name: o.name,
        email: o.email,
        phone: o.phone,
        address: o.address,
        city: o.city,
        state: o.state,
        pincode: o.pincode,
        items: items.map((i) => `${i.qty} × ${i.title} (${i.meta})`).join("\n"),
        total: o.total / 100,
        whatsapp: o.whatsappOptIn ? "Yes" : "No",
        note: o.note ?? "",
      }),
      // Apps Script answers with a redirect to the result; follow it.
      redirect: "follow",
      cache: "no-store",
    });
    if (!res.ok) console.error("[sheet] failed", res.status, await res.text().catch(() => ""));
    return { sent: res.ok };
  } catch (err) {
    console.error("[sheet] error", err);
    return { sent: false as const };
  }
}
