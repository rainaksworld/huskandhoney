import { connection } from "next/server";
import { isAdmin } from "@/server/security";
import { listOrders } from "@/server/orders";
import { orderNumber } from "@/server/orders";

/**
 * Tells the admin dashboard about the most recent *real* order (anything
 * past the "payment pending" stage), so it can chime when a new one shows
 * up. Admin-only: route handlers don't inherit the (protected) layout's
 * auth check, so it's re-checked here.
 */
export async function GET() {
  await connection();
  if (!(await isAdmin())) return new Response("Not authorized", { status: 401 });

  const orders = await listOrders(50);
  const real = orders.find((o) => o.status !== "pending_payment" && o.status !== "payment_failed");

  return Response.json(
    real ? { id: real.id, number: orderNumber(real.seq), createdAt: real.createdAt } : { id: null },
    { headers: { "cache-control": "no-store" } },
  );
}
