"use server";

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { getDb, schema } from "@/server/db";
import { allow, checkAdminPassword, endAdminSession, isAdmin, startAdminSession } from "@/server/security";
import { ORDER_STATUSES_LIST } from "@/lib/order-status";
import { allStockKeys } from "@/lib/catalogue";
import { SettingsSchema, saveSettings } from "@/server/store";
import { setStock } from "@/server/store";
import { notifyOrderStatus } from "@/server/notify";
import { CouponFormSchema, createCoupon, setCouponActive } from "@/server/coupons";
import { getOrderAdmin } from "@/server/orders";
import { autoBookShipment, checkServiceability, delhiveryEnabled, trackShipment } from "@/server/delhivery";

export type FormResult = { ok: boolean; message: string };

/* ------------------------------------------------------------------ */
/* Login / logout                                                      */
/* ------------------------------------------------------------------ */

export async function adminLogin(_: FormResult | null, form: FormData): Promise<FormResult> {
  if (!(await allow("admin-login", 10, 10 * 60_000)))
    return { ok: false, message: "Too many attempts. Please wait a few minutes." };

  const pw = String(form.get("password") ?? "");
  if (!pw || !checkAdminPassword(pw)) return { ok: false, message: "Wrong password." };

  await startAdminSession();
  redirect("/admin/orders");
}

export async function adminLogout() {
  await endAdminSession();
  redirect("/admin/login");
}

/* ------------------------------------------------------------------ */
/* Orders                                                               */
/* ------------------------------------------------------------------ */

const OrderUpdateSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(ORDER_STATUSES_LIST as [string, ...string[]]),
  trackingNote: z.string().trim().max(300).optional().default(""),
});

export async function updateOrder(_: FormResult | null, form: FormData): Promise<FormResult> {
  if (!(await isAdmin())) return { ok: false, message: "Session expired. Please log in again." };

  const parsed = OrderUpdateSchema.safeParse({
    orderId: form.get("orderId"),
    status: form.get("status"),
    trackingNote: form.get("trackingNote") ?? "",
  });
  if (!parsed.success) return { ok: false, message: "That didn't look right. Please try again." };

  const db = await getDb();
  const [before] = await db
    .select({ status: schema.orders.status })
    .from(schema.orders)
    .where(eq(schema.orders.id, parsed.data.orderId));
  if (!before) return { ok: false, message: "We couldn't find that order." };

  const [updated] = await db
    .update(schema.orders)
    .set({
      status: parsed.data.status as (typeof ORDER_STATUSES_LIST)[number],
      trackingNote: parsed.data.trackingNote || null,
      updatedAt: sql`now()`,
    })
    .where(eq(schema.orders.id, parsed.data.orderId))
    .returning();

  // Only tell the buyer when the status really moved - re-saving the same
  // status (e.g. to fix a typo in the tracking note) shouldn't re-notify.
  // Re-render the order page so the WhatsApp message below the form matches the new status.
  refresh();
  if (updated && updated.status !== before.status) {
    const sent = await notifyOrderStatus(updated);
    if (sent.length) return { ok: true, message: `Order updated. Customer notified by ${sent.join(" and ")}.` };
  }
  return { ok: true, message: "Order updated." };
}

/* ------------------------------------------------------------------ */
/* Courier (Delhivery)                                                 */
/* ------------------------------------------------------------------ */

/** Books (or re-books) the shipment for a paid order. Used for the first automatic attempt's retry. */
export async function retryShipment(_: FormResult | null, form: FormData): Promise<FormResult> {
  if (!(await isAdmin())) return { ok: false, message: "Session expired. Please log in again." };
  if (!delhiveryEnabled()) return { ok: false, message: "Delhivery isn't set up yet - see docs/delhivery-setup.md." };
  const orderId = z.string().uuid().safeParse(form.get("orderId"));
  if (!orderId.success) return { ok: false, message: "We couldn't find that order." };

  const found = await getOrderAdmin(orderId.data);
  if (!found) return { ok: false, message: "We couldn't find that order." };

  await autoBookShipment(found.order, found.items);
  refresh();
  const after = await getOrderAdmin(orderId.data);
  if (after?.order.courierStatus === "failed") {
    return { ok: false, message: after.order.courierError ?? "Delhivery couldn't book this shipment." };
  }
  return { ok: true, message: `Shipment booked. Waybill ${after?.order.courierWaybill ?? ""}.` };
}

/** Pulls the latest status from Delhivery for an order that already has a waybill. */
export async function refreshTracking(_: FormResult | null, form: FormData): Promise<FormResult> {
  if (!(await isAdmin())) return { ok: false, message: "Session expired. Please log in again." };
  const orderId = z.string().uuid().safeParse(form.get("orderId"));
  if (!orderId.success) return { ok: false, message: "We couldn't find that order." };

  const found = await getOrderAdmin(orderId.data);
  if (!found?.order.courierWaybill) return { ok: false, message: "This order has no shipment yet." };

  const result = await trackShipment(found.order.courierWaybill);
  if (!result.ok) return { ok: false, message: result.error };

  const db = await getDb();
  await db
    .update(schema.orders)
    .set({ courierStatus: result.status, courierUpdatedAt: sql`now()` })
    .where(eq(schema.orders.id, orderId.data));
  refresh();
  return { ok: true, message: `Tracking updated: ${result.detail}` };
}

/** Checks a pincode against Delhivery - a quick way to confirm the token and account are working. */
export async function testDelhiveryConnection(_: FormResult | null, form: FormData): Promise<FormResult> {
  if (!(await isAdmin())) return { ok: false, message: "Session expired. Please log in again." };
  const pincode = z
    .string()
    .trim()
    .regex(/^\d{6}$/)
    .safeParse(form.get("pincode"));
  if (!pincode.success) return { ok: false, message: "Enter a 6-digit pincode." };

  const result = await checkServiceability(pincode.data);
  if (!result.ok) return { ok: false, message: result.error };
  if (!result.serviceable) return { ok: false, message: "Connected, but Delhivery doesn't deliver to that pincode." };
  return {
    ok: true,
    message: `Connected. Delhivery serves ${pincode.data} (${result.prepaid ? "prepaid" : "no prepaid"}${result.cod ? ", COD" : ""}).`,
  };
}

/* ------------------------------------------------------------------ */
/* Stock                                                                */
/* ------------------------------------------------------------------ */

export async function updateStock(_: FormResult | null, form: FormData): Promise<FormResult> {
  if (!(await isAdmin())) return { ok: false, message: "Session expired. Please log in again." };

  const keys = new Set(allStockKeys().map((k) => k.key));
  let changed = 0;
  for (const [name, raw] of form.entries()) {
    if (!name.startsWith("qty:")) continue;
    const key = name.slice("qty:".length);
    if (!keys.has(key)) continue;
    const v = String(raw).trim();
    if (v === "") {
      await setStock(key, null); // blank = not tracked
      changed++;
      continue;
    }
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0 || n > 100000) continue;
    await setStock(key, n);
    changed++;
  }
  return { ok: true, message: changed ? `Saved stock for ${changed} item${changed === 1 ? "" : "s"}.` : "Nothing to save." };
}

/* ------------------------------------------------------------------ */
/* Settings                                                             */
/* ------------------------------------------------------------------ */

const SettingsFormSchema = z.object({
  shippingFee: z.coerce.number().int().min(0).max(100000),
  lowStockAt: z.coerce.number().int().min(0).max(1000),
  packagingWeightGrams: z.coerce.number().int().min(0).max(5000),
  boxLengthCm: z.coerce.number().int().min(1).max(200),
  boxWidthCm: z.coerce.number().int().min(1).max(200),
  boxHeightCm: z.coerce.number().int().min(1).max(200),
  defaultItemWeightGrams: z.coerce.number().int().min(1).max(20000),
});

export async function updateSettings(_: FormResult | null, form: FormData): Promise<FormResult> {
  if (!(await isAdmin())) return { ok: false, message: "Session expired. Please log in again." };

  const freeOverRaw = String(form.get("freeShippingOver") ?? "").trim();
  const parsed = SettingsFormSchema.safeParse({
    shippingFee: form.get("shippingFee"),
    lowStockAt: form.get("lowStockAt"),
    packagingWeightGrams: form.get("packagingWeightGrams"),
    boxLengthCm: form.get("boxLengthCm"),
    boxWidthCm: form.get("boxWidthCm"),
    boxHeightCm: form.get("boxHeightCm"),
    defaultItemWeightGrams: form.get("defaultItemWeightGrams"),
  });
  if (!parsed.success) return { ok: false, message: "Please check the values and try again." };

  const next = SettingsSchema.safeParse({
    shippingFee: parsed.data.shippingFee,
    freeShippingOver: freeOverRaw === "" ? null : Number(freeOverRaw),
    lowStockAt: parsed.data.lowStockAt,
    shippingConfirmed: true, // saving from this form counts as reviewing it
    packagingWeightGrams: parsed.data.packagingWeightGrams,
    boxLengthCm: parsed.data.boxLengthCm,
    boxWidthCm: parsed.data.boxWidthCm,
    boxHeightCm: parsed.data.boxHeightCm,
    defaultItemWeightGrams: parsed.data.defaultItemWeightGrams,
  });
  if (!next.success) return { ok: false, message: "Please check the values and try again." };

  await saveSettings(next.data);
  return { ok: true, message: "Settings saved." };
}

/* ------------------------------------------------------------------ */
/* Coupons                                                              */
/* ------------------------------------------------------------------ */

export type CouponFormResult = FormResult & { fieldErrors?: Record<string, string> };

export async function addCoupon(_: CouponFormResult | null, form: FormData): Promise<CouponFormResult> {
  if (!(await isAdmin())) return { ok: false, message: "Session expired. Please log in again." };

  const parsed = CouponFormSchema.safeParse({
    code: form.get("code"),
    kind: form.get("kind"),
    value: form.get("value") ?? "",
    freeShipping: form.get("freeShipping") === "on",
    minOrder: form.get("minOrder") ?? "",
    endsAt: form.get("endsAt") ?? "",
    maxUses: form.get("maxUses") ?? "",
    perCustomer: form.get("perCustomer") ?? "1",
    firstOrderOnly: form.get("firstOrderOnly") === "on",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors };
  }

  const row = await createCoupon(parsed.data);
  if (!row) return { ok: false, message: "A coupon with that code already exists.", fieldErrors: { code: "Already used" } };
  refresh();
  return { ok: true, message: `Coupon ${row.code} created.` };
}

export async function toggleCoupon(id: number, active: boolean): Promise<FormResult> {
  if (!(await isAdmin())) return { ok: false, message: "Session expired. Please log in again." };
  await setCouponActive(id, active);
  refresh();
  return { ok: true, message: active ? "Coupon turned back on." : "Coupon turned off." };
}
