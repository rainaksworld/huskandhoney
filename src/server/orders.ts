import "server-only";
import { randomBytes } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { describeSku, parseSku, stockKey } from "@/lib/catalogue";
import { getDb, schema } from "./db";
import { getSettings, getStockMap, shippingFor } from "./store";
import { activeProvider, createProviderOrder } from "./payments";

export const CheckoutSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(120),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => /^(\+91)?[6-9]\d{9}$/.test(v), "Enter a 10-digit Indian mobile number"),
  address: z.string().trim().min(8, "Enter your street address").max(300),
  city: z.string().trim().min(2, "Enter your city").max(60),
  state: z.string().trim().min(2, "Enter your state").max(60),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a 6-digit pincode"),
  note: z.string().trim().max(300).optional().default(""),
  whatsappOptIn: z.boolean().optional().default(false),
  items: z
    .array(z.object({ sku: z.string().max(80), qty: z.number().int().min(1).max(20) }))
    .min(1, "Your bag is empty")
    .max(30),
});
export type CheckoutInput = z.input<typeof CheckoutSchema>;

export type PricedLine = {
  sku: string;
  title: string;
  meta: string;
  unitPrice: number; // rupees
  qty: number;
};

export type Quote = {
  lines: PricedLine[];
  subtotal: number;
  shipping: number;
  total: number;
  problems: { sku: string; message: string }[];
};

/**
 * Re-prices a bag from the catalogue. Anything the browser claims about
 * price or names is ignored; unknown, unpriced or out-of-stock lines are
 * reported as problems and left out of the totals.
 */
export async function quoteBag(items: { sku: string; qty: number }[]): Promise<Quote> {
  const [settings, stock] = await Promise.all([getSettings(), getStockMap()]);
  const merged = new Map<string, number>();
  for (const it of items) merged.set(it.sku, (merged.get(it.sku) ?? 0) + it.qty);

  const used = new Map<string, number>();
  const lines: PricedLine[] = [];
  const problems: Quote["problems"] = [];

  for (const [sku, qty] of merged) {
    const parsed = parseSku(sku);
    const info = describeSku(sku);
    if (!parsed || !info) {
      problems.push({ sku, message: "This item is no longer available." });
      continue;
    }
    if (info.unitPrice === null) {
      problems.push({ sku, message: `${info.title} isn't on sale yet.` });
      continue;
    }
    const key = stockKey(parsed);
    const left = stock[key];
    const already = used.get(key) ?? 0;
    if (left !== undefined && already + qty > left) {
      const can = Math.max(0, left - already);
      problems.push({
        sku,
        message: can === 0 ? `${info.title} is sold out.` : `Only ${can} of ${info.title} left.`,
      });
      continue;
    }
    used.set(key, already + qty);
    lines.push({ sku, title: info.title, meta: info.meta, unitPrice: info.unitPrice, qty });
  }

  const subtotal = lines.reduce((a, l) => a + l.unitPrice * l.qty, 0);
  const shipping = shippingFor(subtotal, settings);
  return { lines, subtotal, shipping, total: subtotal + shipping, problems };
}

export const orderNumber = (seq: number) => `HH-${1000 + seq}`;

export type StartedCheckout =
  | {
      ok: true;
      provider: "razorpay" | "sandbox";
      orderId: string;
      orderNumber: string;
      providerOrderId: string;
      amountPaise: number;
      keyId: string | null;
      prefill: { name: string; email: string; contact: string };
    }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; problems?: Quote["problems"] };

export async function startCheckout(raw: unknown): Promise<StartedCheckout> {
  const provider = activeProvider();
  if (provider === "none") {
    return { ok: false, error: "Online payment isn't switched on yet. Please check back soon." };
  }

  const parsed = CheckoutSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = String(issue.path[0] ?? "form");
      fieldErrors[k] ??= issue.message;
    }
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
  }
  const input = parsed.data;

  const quote = await quoteBag(input.items);
  if (quote.problems.length) {
    return { ok: false, error: "Some items in your bag changed. Please review it.", problems: quote.problems };
  }

  const db = await getDb();
  const accessToken = randomBytes(18).toString("base64url");
  const [order] = await db
    .insert(schema.orders)
    .values({
      accessToken,
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      note: input.note || null,
      whatsappOptIn: input.whatsappOptIn,
      subtotal: quote.subtotal * 100,
      shipping: quote.shipping * 100,
      total: quote.total * 100,
      provider,
    })
    .returning();

  await db.insert(schema.orderItems).values(
    quote.lines.map((l) => ({
      orderId: order.id,
      sku: l.sku,
      title: l.title,
      meta: l.meta,
      unitPrice: l.unitPrice * 100,
      qty: l.qty,
    })),
  );

  const number = orderNumber(order.seq);
  let providerOrderId: string;
  try {
    const po = await createProviderOrder({
      amountPaise: order.total,
      receipt: number,
      notes: { order: number, order_id: order.id },
    });
    providerOrderId = po.id;
  } catch (err) {
    console.error("[checkout] provider order failed", err);
    await db
      .update(schema.orders)
      .set({ status: "payment_failed", updatedAt: sql`now()` })
      .where(eq(schema.orders.id, order.id));
    return { ok: false, error: "We couldn't reach the payment service. Please try again in a minute." };
  }

  await db
    .update(schema.orders)
    .set({ providerOrderId, updatedAt: sql`now()` })
    .where(eq(schema.orders.id, order.id));

  return {
    ok: true,
    provider,
    orderId: order.id,
    orderNumber: number,
    providerOrderId,
    amountPaise: order.total,
    keyId: provider === "razorpay" ? process.env.RAZORPAY_KEY_ID! : null,
    prefill: { name: input.name, email: input.email, contact: input.phone },
  };
}

/**
 * Marks an order paid exactly once and takes its items out of stock.
 * Safe to call from both the browser confirmation and the webhook.
 * Returns the order when this call (or an earlier one) marked it paid.
 */
export async function markPaid(providerOrderId: string, providerPaymentId: string) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.providerOrderId, providerOrderId))
      .for("update");
    if (!order) return { order: null, firstTime: false };
    if (order.paidAt) return { order, firstTime: false };

    const items = await tx
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, order.id));

    for (const it of items) {
      const parsed = parseSku(it.sku);
      if (!parsed) continue;
      const key = stockKey(parsed);
      await tx
        .update(schema.stock)
        .set({ qty: sql`greatest(${schema.stock.qty} - ${it.qty}, 0)`, updatedAt: sql`now()` })
        .where(eq(schema.stock.key, key));
    }

    const [updated] = await tx
      .update(schema.orders)
      .set({
        status: "paid",
        providerPaymentId,
        paidAt: sql`now()`,
        stockApplied: true,
        updatedAt: sql`now()`,
      })
      .where(eq(schema.orders.id, order.id))
      .returning();
    return { order: updated, firstTime: true };
  });
}

export async function getOrderForBuyer(id: string, token: string) {
  const db = await getDb();
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(and(eq(schema.orders.id, id), eq(schema.orders.accessToken, token)));
  if (!order) return null;
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, id));
  return { order, items };
}

export async function getOrderByProviderId(providerOrderId: string) {
  const db = await getDb();
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.providerOrderId, providerOrderId));
  return order ?? null;
}

export async function listOrders(limit = 200) {
  const db = await getDb();
  return db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).limit(limit);
}

export type CustomerRow = {
  email: string;
  name: string;
  phone: string;
  city: string;
  orders: number;
  spent: number; // paise
  firstOrder: Date;
  lastOrder: Date;
  whatsappOptIn: boolean;
};

/**
 * Everyone who has completed a paid order, one row per email address.
 * Name, phone and city come from their most recent order; the WhatsApp
 * opt-in reflects their most recent choice at checkout. Unpaid and
 * failed checkouts are left out - those people never became customers.
 */
export async function listCustomers(): Promise<CustomerRow[]> {
  const db = await getDb();
  const o = schema.orders;
  const rows = await db
    .select()
    .from(o)
    .where(sql`${o.paidAt} is not null`)
    .orderBy(desc(o.paidAt));

  const byEmail = new Map<string, CustomerRow>();
  for (const r of rows) {
    const at = new Date(r.paidAt!);
    const c = byEmail.get(r.email);
    if (!c) {
      // Rows are newest first, so the first one seen is the latest order.
      byEmail.set(r.email, {
        email: r.email,
        name: r.name,
        phone: r.phone,
        city: r.city,
        orders: 1,
        spent: r.status === "cancelled" ? 0 : r.total,
        firstOrder: at,
        lastOrder: at,
        whatsappOptIn: r.whatsappOptIn,
      });
    } else {
      c.orders += 1;
      if (r.status !== "cancelled") c.spent += r.total;
      c.firstOrder = at;
    }
  }
  return [...byEmail.values()];
}

export async function getOrderAdmin(id: string) {
  const db = await getDb();
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
  if (!order) return null;
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, id));
  return { order, items };
}
