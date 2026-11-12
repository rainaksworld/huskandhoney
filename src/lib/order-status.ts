import type { OrderStatus } from "@/server/schema";

export const ORDER_STATUSES_LIST: OrderStatus[] = [
  "pending_payment",
  "paid",
  "payment_failed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Payment pending",
  paid: "Paid",
  payment_failed: "Payment failed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
