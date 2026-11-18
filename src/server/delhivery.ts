import "server-only";
import { eq } from "drizzle-orm";
import { parseSku } from "@/lib/catalogue";
import { getSettings } from "./store";
import { getDb, schema } from "./db";
import { sendShipmentFailedEmail } from "./email";
import type { orderItems, orders } from "./schema";
import type { CourierStatus } from "./schema";

/**
 * Delhivery shipping - NOT ACTIVE until DELHIVERY_API_TOKEN and
 * DELHIVERY_PICKUP_LOCATION are both set (see docs/delhivery-setup.md).
 * Until then, `delhiveryEnabled()` is false and every call below is a
 * silent no-op, so orders keep working exactly as they do today.
 *
 * IMPORTANT FOR WHOEVER CONNECTS THIS FOR REAL: this is written against
 * Delhivery's commonly documented "cmu/create", tracking and packing-slip
 * endpoints, but Delhivery's exact field names can vary a little by
 * account and API generation, and this was built without live credentials
 * to test against. The first real test (see "Test connection" in
 * /admin/settings, and the first real order) may come back with a
 * response shape slightly different from what's expected here. That's
 * expected, not a sign everything is wrong: `courierError` on the order
 * stores whatever Delhivery actually said (sometimes the raw reply), so
 * open an affected order in /admin, read that message, and adjust the
 * one or two lines in `parseCreateResponse` / `parseTrackResponse` below
 * that extract the waybill/status. Everything else (the shipment payload,
 * the retry button, the emails) doesn't need to change.
 */

function token() {
  return process.env.DELHIVERY_API_TOKEN ?? "";
}
function pickupLocation() {
  return process.env.DELHIVERY_PICKUP_LOCATION ?? "";
}
export function delhiveryEnabled() {
  return Boolean(token() && pickupLocation());
}
function baseUrl() {
  return process.env.DELHIVERY_ENV === "staging"
    ? "https://staging-express.delhivery.com"
    : "https://track.delhivery.com";
}
function authHeader() {
  return { authorization: `Token ${token()}` };
}

type Order = typeof orders.$inferSelect;
type Item = typeof orderItems.$inferSelect;

/** Total shipment weight in grams: each coffee's real size, plus a default for kits/equipment, plus packaging. */
export async function shipmentWeightGrams(items: Pick<Item, "sku" | "qty">[]) {
  const s = await getSettings();
  const itemWeight = items.reduce((sum, it) => {
    const p = parseSku(it.sku);
    const unitGrams = p?.kind === "coffee" ? Number(p.size) : s.defaultItemWeightGrams;
    return sum + unitGrams * it.qty;
  }, 0);
  return itemWeight + s.packagingWeightGrams;
}

/* ------------------------------------------------------------------ */
/* Pincode serviceability - also used by the admin "Test connection"   */
/* ------------------------------------------------------------------ */

export type Serviceability =
  | { ok: true; serviceable: boolean; cod: boolean; prepaid: boolean }
  | { ok: false; error: string };

export async function checkServiceability(pincode: string): Promise<Serviceability> {
  if (!token()) return { ok: false, error: "No Delhivery API token is set." };
  try {
    const res = await fetch(`${baseUrl()}/c/api/pin-codes/json/?filter_codes=${encodeURIComponent(pincode)}`, {
      headers: authHeader(),
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, error: `Delhivery said: ${text.slice(0, 300)}` };
    const data = JSON.parse(text) as {
      delivery_codes?: { postal_code?: Record<string, unknown> }[];
    };
    const pc = data.delivery_codes?.[0]?.postal_code;
    if (!pc) return { ok: true, serviceable: false, cod: false, prepaid: false };
    const yes = (v: unknown) => v === "Y" || v === true || v === "1";
    return {
      ok: true,
      serviceable: true,
      cod: yes(pc.cod),
      prepaid: yes(pc.pre_paid) || yes(pc.prepaid),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not reach Delhivery." };
  }
}

/* ------------------------------------------------------------------ */
/* Create shipment                                                     */
/* ------------------------------------------------------------------ */

export type CreateShipmentResult =
  | { ok: true; waybill: string }
  | { ok: false; error: string };

function parseCreateResponse(raw: string): CreateShipmentResult {
  let data: {
    success?: boolean;
    packages?: { waybill?: string; status?: string; remarks?: unknown }[];
    rmk?: string;
    error?: string;
  };
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: `Delhivery sent back something we couldn't read: ${raw.slice(0, 300)}` };
  }
  const pkg = data.packages?.[0];
  const waybill = pkg?.waybill;
  const failed = data.success === false || !waybill || (pkg?.status && pkg.status !== "Success");
  if (failed) {
    const remarks = Array.isArray(pkg?.remarks) ? pkg!.remarks.join("; ") : pkg?.remarks;
    const error = String(remarks || data.rmk || data.error || raw.slice(0, 300) || "Delhivery rejected the shipment.");
    return { ok: false, error };
  }
  return { ok: true, waybill: String(waybill) };
}

/**
 * Books a pickup with Delhivery for a paid order and returns its waybill
 * (AWB) number. Never throws - a failure comes back as `{ ok: false }`
 * with Delhivery's own explanation, so the order stays "paid" and the
 * owner can see what went wrong in /admin and retry once it's fixed
 * (a bad pincode or address most often).
 */
export async function createShipment(order: Order, items: Item[]): Promise<CreateShipmentResult> {
  if (!delhiveryEnabled()) return { ok: false, error: "Delhivery isn't set up yet." };

  const weight = await shipmentWeightGrams(items);
  const s = await getSettings();
  const productsDesc = items.map((i) => `${i.qty} x ${i.sku}`).join(", ").slice(0, 500);

  const shipment: Record<string, string> = {
    name: order.name,
    add: order.address,
    pin: order.pincode,
    city: order.city,
    state: order.state,
    country: "India",
    phone: order.phone.replace(/\D/g, "").slice(-10),
    order: order.id, // our order number is assigned after this call returns, so the row id is stable and unique
    payment_mode: "Prepaid",
    products_desc: productsDesc || "Coffee",
    cod_amount: "0",
    total_amount: String(order.total / 100),
    quantity: String(items.reduce((n, i) => n + i.qty, 0)),
    weight: String(weight),
    shipment_width: String(s.boxWidthCm),
    shipment_height: String(s.boxHeightCm),
    shipment_length: String(s.boxLengthCm),
    shipping_mode: process.env.DELHIVERY_SHIPPING_MODE === "Express" ? "Express" : "Surface",
    address_type: "home",
  };
  if (process.env.DELHIVERY_CLIENT_NAME) shipment.seller_name = process.env.DELHIVERY_CLIENT_NAME;

  const body = new URLSearchParams({
    format: "json",
    data: JSON.stringify({ shipments: [shipment], pickup_location: { name: pickupLocation() } }),
  });

  try {
    const res = await fetch(`${baseUrl()}/api/cmu/create.json`, {
      method: "POST",
      headers: { ...authHeader(), "content-type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, error: `Delhivery (${res.status}): ${text.slice(0, 300)}` };
    return parseCreateResponse(text);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not reach Delhivery." };
  }
}

/* ------------------------------------------------------------------ */
/* Tracking                                                             */
/* ------------------------------------------------------------------ */

const STATUS_MAP: Record<string, CourierStatus> = {
  Manifested: "manifested",
  "Not Picked": "manifested",
  "In Transit": "in_transit",
  Pending: "in_transit",
  Dispatched: "out_for_delivery",
  "Out for Delivery": "out_for_delivery",
  Delivered: "delivered",
  RTO: "rto",
  "RTO In Transit": "rto",
  "RTO Delivered": "rto",
  Cancelled: "cancelled",
  Destroyed: "cancelled",
};

export type TrackResult =
  | { ok: true; status: CourierStatus; detail: string }
  | { ok: false; error: string };

/** The buyer's own courier tracking page - no login, no token needed. */
export function publicTrackingUrl(waybill: string) {
  return `https://www.delhivery.com/track-v2/package/${encodeURIComponent(waybill)}`;
}

export async function trackShipment(waybill: string): Promise<TrackResult> {
  if (!token()) return { ok: false, error: "No Delhivery API token is set." };
  try {
    const res = await fetch(`${baseUrl()}/api/v1/packages/json/?waybill=${encodeURIComponent(waybill)}&verbose=1`, {
      headers: authHeader(),
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, error: `Delhivery (${res.status}): ${text.slice(0, 300)}` };
    const data = JSON.parse(text) as {
      ShipmentData?: { Shipment?: { Status?: { Status?: string; StatusDateTime?: string; Instructions?: string } } }[];
    };
    const status = data.ShipmentData?.[0]?.Shipment?.Status;
    if (!status?.Status) return { ok: false, error: `No tracking yet: ${text.slice(0, 300)}` };
    return {
      ok: true,
      status: STATUS_MAP[status.Status] ?? "manifested",
      detail: status.Instructions ? `${status.Status} - ${status.Instructions}` : status.Status,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not reach Delhivery." };
  }
}

/* ------------------------------------------------------------------ */
/* Shipping label (packing slip)                                       */
/* ------------------------------------------------------------------ */

export type LabelResult = { ok: true; pdf: Buffer } | { ok: false; error: string };

/** Fetches the printable shipping label as a PDF. The token stays server-side. */
export async function fetchShippingLabel(waybill: string): Promise<LabelResult> {
  if (!token()) return { ok: false, error: "No Delhivery API token is set." };
  try {
    const res = await fetch(`${baseUrl()}/api/p/packing_slip?wbns=${encodeURIComponent(waybill)}&pdf=true`, {
      headers: authHeader(),
      cache: "no-store",
    });
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("pdf")) {
      if (!res.ok) return { ok: false, error: `Delhivery (${res.status}) couldn't make the label.` };
      return { ok: true, pdf: Buffer.from(await res.arrayBuffer()) };
    }
    // Some accounts get back JSON with a link to fetch instead of the PDF directly.
    const text = await res.text();
    let link: string | undefined;
    try {
      const data = JSON.parse(text) as { packages?: { pdf_download_link?: string }[]; pdf_download_link?: string };
      link = data.packages?.[0]?.pdf_download_link ?? data.pdf_download_link;
    } catch {
      /* not JSON either - fall through to the error below */
    }
    if (link) {
      const pdfRes = await fetch(link, { headers: authHeader(), cache: "no-store" });
      if (pdfRes.ok) return { ok: true, pdf: Buffer.from(await pdfRes.arrayBuffer()) };
    }
    return { ok: false, error: `Delhivery didn't send a label we recognise: ${text.slice(0, 300)}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not reach Delhivery." };
  }
}

/* ------------------------------------------------------------------ */
/* Auto-booking - called right after a payment is confirmed            */
/* ------------------------------------------------------------------ */

/**
 * Books the shipment for a just-paid order and writes the result onto the
 * order row. Never throws: if Delhivery isn't set up yet, or the booking
 * fails, the order stays exactly as "paid" (nothing here blocks checkout
 * or the webhook), the reason is saved to `courierError` for the admin
 * order page's retry button, and - since there's no manual review step
 * before this runs - the owner gets an email so a failed booking doesn't
 * go unnoticed.
 */
export async function autoBookShipment(order: Order, items: Item[]) {
  if (!delhiveryEnabled()) return;
  const db = await getDb();
  try {
    const result = await createShipment(order, items);
    if (result.ok) {
      await db
        .update(schema.orders)
        .set({
          courierWaybill: result.waybill,
          courierStatus: "created",
          courierError: null,
          courierUpdatedAt: new Date(),
          trackingNote: `Courier: Delhivery, tracking number ${result.waybill}. Track at ${publicTrackingUrl(result.waybill)}`,
        })
        .where(eq(schema.orders.id, order.id));
    } else {
      await db
        .update(schema.orders)
        .set({ courierStatus: "failed", courierError: result.error, courierUpdatedAt: new Date() })
        .where(eq(schema.orders.id, order.id));
      await sendShipmentFailedEmail(order, result.error);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something unexpected went wrong.";
    await db
      .update(schema.orders)
      .set({ courierStatus: "failed", courierError: message, courierUpdatedAt: new Date() })
      .where(eq(schema.orders.id, order.id));
    await sendShipmentFailedEmail(order, message).catch(() => {});
  }
}

/* ------------------------------------------------------------------ */
/* Cancel                                                               */
/* ------------------------------------------------------------------ */

export async function cancelShipment(waybill: string): Promise<{ ok: boolean; error?: string }> {
  if (!token()) return { ok: false, error: "No Delhivery API token is set." };
  try {
    const res = await fetch(`${baseUrl()}/api/p/edit`, {
      method: "POST",
      headers: { ...authHeader(), "content-type": "application/json" },
      body: JSON.stringify({ waybill, cancellation: true }),
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, error: `Delhivery (${res.status}): ${text.slice(0, 300)}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not reach Delhivery." };
  }
}
