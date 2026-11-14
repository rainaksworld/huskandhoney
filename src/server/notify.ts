import "server-only";
import { formatINR } from "@/lib/catalogue";
import { sendOrderEmails, sendStatusEmail } from "./email";
import { appendOrderToSheet } from "./sheet";
import { sendWhatsApp, waNumber, type WaEvent } from "./whatsapp";
import { orderNumber } from "./orders";
import type { OrderStatus, orderItems, orders } from "./schema";

type Order = typeof orders.$inferSelect;
type Item = typeof orderItems.$inferSelect;

const firstName = (name: string) => name.split(" ")[0];

/**
 * Everything that should happen once an order is paid: confirmation email to
 * the buyer and owner, a row in the orders sheet, and WhatsApp messages.
 * Each channel swallows its own errors, so one failing never blocks the
 * others or the buyer's order confirmation.
 */
export async function notifyOrderPaid(order: Order, items: Item[]) {
  const number = orderNumber(order.seq);
  const total = formatINR(order.total / 100);
  const jobs: Promise<unknown>[] = [sendOrderEmails(order, items), appendOrderToSheet(order, items)];
  if (order.whatsappOptIn) {
    jobs.push(
      sendWhatsApp({
        to: waNumber(order.phone),
        event: "order_confirmed",
        values: { name: firstName(order.name), order: number, total },
      }),
    );
  }
  if (process.env.OWNER_WHATSAPP) {
    jobs.push(
      sendWhatsApp({
        to: waNumber(process.env.OWNER_WHATSAPP),
        event: "owner_new_order",
        values: { order: number, name: order.name, total, phone: order.phone },
      }),
    );
  }
  await Promise.allSettled(jobs);
}

/** Statuses the buyer is told about after payment. */
const BUYER_UPDATES: Partial<Record<OrderStatus, WaEvent>> = {
  packed: "order_packed",
  shipped: "order_shipped",
  delivered: "order_delivered",
  cancelled: "order_cancelled",
};

/**
 * Logistics update to the buyer when the owner moves an order along in
 * /admin. Returns the channels that actually delivered, so the admin screen
 * can say truthfully whether the customer heard about it.
 */
export async function notifyOrderStatus(order: Order): Promise<string[]> {
  const event = BUYER_UPDATES[order.status];
  if (!event) return [];
  const [mail, wa] = await Promise.all([
    sendStatusEmail(order, order.status, order.trackingNote),
    order.whatsappOptIn
      ? sendWhatsApp({
          to: waNumber(order.phone),
          event,
          values: {
            name: firstName(order.name),
            order: orderNumber(order.seq),
            tracking: order.trackingNote ?? "",
          },
        })
      : Promise.resolve({ sent: false }),
  ]);
  const sent: string[] = [];
  if (mail.sent) sent.push("email");
  if (wa.sent) sent.push("WhatsApp");
  return sent;
}
