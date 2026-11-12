import type { Metadata } from "next";
import Link from "next/link";
import { listOrders, orderNumber } from "@/server/orders";
import { formatINR } from "@/lib/catalogue";
import { STATUS_LABEL } from "@/lib/order-status";

export const metadata: Metadata = { title: "Orders", robots: { index: false, follow: false } };

export default async function AdminOrdersPage() {
  const orders = await listOrders();

  return (
    <div className="col rv">
      <h1 className="disp h2">orders.</h1>
      {orders.length === 0 ? (
        <p className="lead">No orders yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`}>{orderNumber(o.seq)}</Link>
                  </td>
                  <td>{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                  <td>
                    {o.name}
                    <br />
                    <span className="lab dim">{o.email}</span>
                  </td>
                  <td>{formatINR(o.total / 100)}</td>
                  <td>
                    <span className={`admin-badge admin-badge-${o.status}`}>{STATUS_LABEL[o.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
