import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { orderNumber } from "@/server/orders";
import { getOrderForBuyer } from "@/server/orders";
import { formatINR } from "@/lib/catalogue";

export const metadata: Metadata = { title: "Your order" };

// Order IDs aren't known at build time (no generateStaticParams covers
// them), so this route can't ship an instant static shell anyway — block
// instead of streaming a fallback, which avoids wrapping the shared Header
// in a global <Suspense> just for this one page.
export const instant = false;

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Payment pending",
  paid: "Paid",
  payment_failed: "Payment failed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  await connection(); // always read the live order, never at build time
  const { id } = await params;
  const { t } = await searchParams;
  if (!t) notFound();

  const found = await getOrderForBuyer(id, t);
  if (!found) notFound();
  const { order, items } = found;
  const number = orderNumber(order.seq);

  return (
    <section className="sec page" aria-labelledby="ord-h">
      <div className="col rv">
        <p className="lab dim">{STATUS_LABEL[order.status] ?? order.status}</p>
        <h1 className="disp h2" id="ord-h">
          order {number}.
        </h1>
        <p className="lead">
          {order.status === "paid"
            ? `Thanks, ${order.name.split(" ")[0]}. We've got your order and will start getting it ready.`
            : "We're still confirming your payment. This page will update once it's through."}
        </p>
      </div>

      <div className="checkout-grid">
        <div className="col">
          <p className="lab">Delivering to</p>
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
                Note
              </p>
              <p>{order.note}</p>
            </>
          )}
          <p className="legal" style={{ marginTop: 16 }}>
            Questions about this order? <Link href="/contact">Contact us</Link> with order number {number}.
          </p>
        </div>

        <div className="cart-sum" aria-label="Order summary">
          <p className="lab">What you ordered</p>
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
    </section>
  );
}
