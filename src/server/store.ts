import "server-only";
import { inArray, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { getDb, schema } from "./db";

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export const SettingsSchema = z.object({
  /** Flat shipping fee in rupees. 0 = free shipping. */
  shippingFee: z.number().int().min(0).max(100000),
  /** Orders at or above this subtotal (rupees) ship free. null = no threshold. */
  freeShippingOver: z.number().int().min(0).max(10000000).nullable(),
  /** Show "only N left" when a tracked count is at or below this. */
  lowStockAt: z.number().int().min(0).max(1000),
  /** Set once the owner has reviewed the shipping rule in the admin. */
  shippingConfirmed: z.boolean(),
});
export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  shippingFee: 0,
  freeShippingOver: null,
  lowStockAt: 10,
  shippingConfirmed: false,
};

export async function getSettings(): Promise<Settings> {
  "use cache";
  cacheTag("settings");
  cacheLife("hours");
  const db = await getDb();
  const rows = await db.select().from(schema.settings);
  const raw = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const parsed = SettingsSchema.safeParse({ ...DEFAULT_SETTINGS, ...raw });
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

export async function saveSettings(next: Settings) {
  const db = await getDb();
  const entries = Object.entries(SettingsSchema.parse(next));
  for (const [key, value] of entries) {
    await db
      .insert(schema.settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedAt: sql`now()` } });
  }
}

/** Shipping in rupees for a subtotal in rupees. */
export function shippingFor(subtotal: number, s: Settings): number {
  if (subtotal <= 0) return 0;
  if (s.freeShippingOver !== null && subtotal >= s.freeShippingOver) return 0;
  return s.shippingFee;
}

/* ------------------------------------------------------------------ */
/* Stock                                                               */
/* ------------------------------------------------------------------ */

/** Map of stock bucket → count. Buckets without a row are not tracked. */
export async function getStockMap(): Promise<Record<string, number>> {
  "use cache";
  cacheTag("stock");
  cacheLife("minutes");
  const db = await getDb();
  const rows = await db.select().from(schema.stock);
  return Object.fromEntries(rows.map((r) => [r.key, r.qty]));
}

export async function setStock(key: string, qty: number | null) {
  const db = await getDb();
  if (qty === null) {
    await db.delete(schema.stock).where(inArray(schema.stock.key, [key]));
    return;
  }
  await db
    .insert(schema.stock)
    .values({ key, qty })
    .onConflictDoUpdate({ target: schema.stock.key, set: { qty, updatedAt: sql`now()` } });
}
