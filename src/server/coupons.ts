import "server-only";
import { and, desc, eq, isNotNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { formatINR } from "@/lib/catalogue";
import { getDb, schema } from "./db";

export type Coupon = typeof schema.coupons.$inferSelect;

/** Codes are stored and compared in capitals, so "welcome10" works too. */
export const normaliseCode = (v: unknown) =>
  String(v ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

export const CODE_RE = /^[A-Z0-9][A-Z0-9_-]{2,29}$/;

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "numeric", month: "long", timeZone: "Asia/Kolkata" });

/** What a coupon does, in a few words, for the admin list and the checkout. */
export function describeCoupon(c: Pick<Coupon, "kind" | "value" | "freeShipping">) {
  const parts: string[] = [];
  if (c.kind === "percent") parts.push(`${c.value}% off`);
  if (c.kind === "flat") parts.push(`${formatINR(c.value)} off`);
  if (c.freeShipping) parts.push("free shipping");
  return parts.join(" + ") || "no discount";
}

export type CouponResult =
  | {
      ok: true;
      code: string;
      /** Rupees taken off the coffee. */
      discount: number;
      freeShipping: boolean;
      label: string;
    }
  | { ok: false; message: string };

/**
 * Checks a code against a bag and works out the saving. Used both when the
 * buyer taps Apply (email may still be blank) and again, for real, when the
 * order is created. Amounts are in rupees.
 */
export async function evaluateCoupon(
  rawCode: unknown,
  ctx: { subtotal: number; shipping: number; email?: string; userId?: string | null },
): Promise<CouponResult> {
  const code = normaliseCode(rawCode);
  if (!code) return { ok: false, message: "Type a coupon code first." };
  if (!CODE_RE.test(code)) return { ok: false, message: "We don't recognise that code. Check the spelling?" };

  const db = await getDb();
  const [c] = await db.select().from(schema.coupons).where(eq(schema.coupons.code, code));
  if (!c || !c.active) return { ok: false, message: "We don't recognise that code. Check the spelling?" };

  if (c.endsAt && c.endsAt.getTime() < Date.now())
    return { ok: false, message: `This code ended on ${fmtDate(c.endsAt)}. Try another one.` };
  if (c.maxUses !== null && c.used >= c.maxUses)
    return { ok: false, message: "This code has been fully used up. Try another one." };
  if (c.minOrder > 0 && ctx.subtotal < c.minOrder)
    return {
      ok: false,
      message: `This code works on orders of ${formatINR(c.minOrder)} or more. Add ${formatINR(c.minOrder - ctx.subtotal)} more to use it.`,
    };

  const email = ctx.email?.trim().toLowerCase();
  if (email || ctx.userId) {
    const o = schema.orders;
    const mine = or(
      email ? eq(o.email, email) : undefined,
      ctx.userId ? eq(o.userId, ctx.userId) : undefined,
    );
    const paid = and(mine, isNotNull(o.paidAt), sql`${o.status} <> 'cancelled'`);
    if (c.firstOrderOnly) {
      const [prev] = await db.select({ id: o.id }).from(o).where(paid).limit(1);
      if (prev) return { ok: false, message: "This code is only for a first order." };
    }
    if (c.perCustomer !== null) {
      const [{ n }] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(o)
        .where(and(paid, eq(o.couponCode, code)));
      if (n >= c.perCustomer)
        return {
          ok: false,
          message: c.perCustomer === 1 ? "You've already used this code." : "You've used this code as many times as it allows.",
        };
    }
  }

  let discount = 0;
  if (c.kind === "percent") discount = Math.round((ctx.subtotal * c.value) / 100);
  if (c.kind === "flat") discount = c.value;
  // Never more than the coffee itself, and always leave at least ₹1 to pay
  // (the payment service can't take a ₹0 order).
  const shipping = c.freeShipping ? 0 : ctx.shipping;
  discount = Math.max(0, Math.min(discount, ctx.subtotal, ctx.subtotal + shipping - 1));

  return { ok: true, code, discount, freeShipping: c.freeShipping, label: describeCoupon(c) };
}

/* ------------------------------------------------------------------ */
/* Admin                                                                */
/* ------------------------------------------------------------------ */

export async function listCoupons() {
  const db = await getDb();
  return db.select().from(schema.coupons).orderBy(desc(schema.coupons.createdAt));
}

const optInt = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? null : Number(v)), z.number().int().min(min).max(max).nullable());

export const CouponFormSchema = z
  .object({
    code: z.preprocess(normaliseCode, z.string().regex(CODE_RE, "3–30 letters or numbers, no spaces")),
    kind: z.enum(["percent", "flat", "none"]),
    value: optInt(0, 100000),
    freeShipping: z.boolean(),
    minOrder: optInt(0, 1000000),
    endsAt: z.preprocess(
      (v) => (v ? String(v) : null),
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable(),
    ),
    maxUses: optInt(1, 1000000),
    perCustomer: optInt(1, 1000),
    firstOrderOnly: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.kind === "percent" && (!v.value || v.value < 1 || v.value > 90))
      ctx.addIssue({ code: "custom", path: ["value"], message: "Between 1 and 90 (%)" });
    if (v.kind === "flat" && (!v.value || v.value < 1))
      ctx.addIssue({ code: "custom", path: ["value"], message: "Enter the rupees off" });
    if (v.kind === "none" && !v.freeShipping)
      ctx.addIssue({ code: "custom", path: ["kind"], message: "Pick a discount or tick free shipping" });
  });

export async function createCoupon(v: z.output<typeof CouponFormSchema>) {
  const db = await getDb();
  const [row] = await db
    .insert(schema.coupons)
    .values({
      code: v.code,
      kind: v.kind,
      value: v.kind === "none" ? 0 : (v.value ?? 0),
      freeShipping: v.freeShipping,
      minOrder: v.minOrder ?? 0,
      // The whole end day counts, India time.
      endsAt: v.endsAt ? new Date(`${v.endsAt}T23:59:59+05:30`) : null,
      maxUses: v.maxUses,
      perCustomer: v.perCustomer,
      firstOrderOnly: v.firstOrderOnly,
    })
    .onConflictDoNothing()
    .returning();
  return row ?? null;
}

export async function setCouponActive(id: number, active: boolean) {
  const db = await getDb();
  await db.update(schema.coupons).set({ active }).where(eq(schema.coupons.id, id));
}
