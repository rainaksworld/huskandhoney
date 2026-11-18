import { isAdmin } from "@/server/security";
import { getOrderAdmin, orderNumber } from "@/server/orders";
import { fetchShippingLabel } from "@/server/delhivery";

/**
 * Streams the Delhivery shipping label PDF for an order. Separate from the
 * main admin pages (not inside the `(protected)` group, whose layout only
 * wraps pages, not routes like this one) so it checks the admin session
 * cookie itself before touching the Delhivery token.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return new Response("Not authorized.", { status: 401 });

  const { id } = await params;
  const found = await getOrderAdmin(id);
  if (!found?.order.courierWaybill) return new Response("This order has no shipment yet.", { status: 404 });

  const result = await fetchShippingLabel(found.order.courierWaybill);
  if (!result.ok) return new Response(result.error, { status: 502 });

  return new Response(new Uint8Array(result.pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${orderNumber(found.order.seq)}-label.pdf"`,
    },
  });
}
