import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrderAdmin, orderNumber } from "@/server/orders";
import { formatINR } from "@/lib/catalogue";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";

export const metadata: Metadata = { title: "Order", robots: { index: false, follow: false } };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await getOrderAdmin(id);
  if (!found) notFound();
  const { order, items } = found;

  return (
    <div className="col rv">
      <h1 className="disp h2">order {orderNumber(order.seq)}.</h1>

      <div className="checkout-grid">
        <div className="col">
          <p className="lab">Customer</p>
          <p>
            {order.name}
            <br />
            {order.address}
            <br />
            {order.city}, {order.state} {order.pincode}
            <br />
            {order.phone} · {order.email}
          </p>
          {order.note && (
            <>
              <p className="lab" style={{ marginTop: 12 }}>
                Note from buyer
              </p>
              <p>{order.note}</p>
            </>
          )}

          <p className="lab" style={{ marginTop: 20 }}>
            Payment
          </p>
          <p>
            {order.provider} · {order.providerOrderId ?? "—"}
            <br />
            {order.paidAt ? `Paid ${new Date(order.paidAt).toLocaleString("en-IN")}` : "Not paid yet"}
          </p>

          <p className="lab" style={{ marginTop: 20 }}>
            Update order
          </p>
          <OrderStatusForm orderId={order.id} status={order.status} trackingNote={order.trackingNote} />
        </div>

        <div className="cart-sum" aria-label="Order summary">
          <p className="lab">Items</p>
          <ul className="c-list">
            {items.map((it) => (
              <li key={it.id} className="row">
                <span>
                  {it.title} × {it.qty}
                  <br />
                  <span className="lab dim">{it.meta}</span>
                </span>
                <span>{formatINR((it.unitPrice * it.qty) / 100)}</span>
              </li>
            ))}
          </ul>
          <div className="row">
            <span>Subtotal</span>
            <span>{formatINR(order.subtotal / 100)}</span>
          </div>
          <div className="row">
            <span>Shipping</span>
            <span>{order.shipping === 0 ? "Free" : formatINR(order.shipping / 100)}</span>
          </div>
          <div className="row tot">
            <span>Total</span>
            <span>{formatINR(order.total / 100)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
