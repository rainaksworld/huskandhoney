import { updateTag } from "next/cache";
import { getDb, schema } from "@/server/db";
import { verifyWebhookSignature } from "@/server/payments";
import { markPaid } from "@/server/orders";
import { notifyOrderPaid } from "@/server/notify";
import { eq } from "drizzle-orm";

/**
 * Razorpay webhook: the fallback path for payments confirmed outside the
 * browser (bank redirects, app flows, retried UPI). `markPaid` is the same
 * idempotent function the browser confirmation calls, guarded by a DB row
 * lock and a `paidAt`-is-null check, so this can never double-process an
 * order the browser already confirmed, or vice versa.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const eventId = req.headers.get("x-razorpay-event-id");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return new Response("invalid signature", { status: 400 });
  }

  const db = await getDb();

  // Idempotency: Razorpay retries webhooks, and may send the same event
  // more than once even without a failure. Claim the event id once.
  if (eventId) {
    const inserted = await db.insert(schema.webhookEvents).values({ id: eventId }).onConflictDoNothing().returning();
    if (inserted.length === 0) {
      return Response.json({ ok: true, deduped: true });
    }
  }

  let body: { event?: string; payload?: { payment?: { entity?: { order_id?: string; id?: string } } } };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response("invalid body", { status: 400 });
  }

  const payment = body.payload?.payment?.entity;
  const isPaidEvent = body.event === "payment.captured" || body.event === "order.paid";
  if (isPaidEvent && payment?.order_id && payment?.id) {
    const { order, firstTime } = await markPaid(payment.order_id, payment.id);
    if (order && firstTime) {
      updateTag("stock");
      const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
      await notifyOrderPaid(order, items);
    }
  }

  return Response.json({ ok: true });
}
