import type { Metadata } from "next";
import Link from "next/link";
import { listCustomers } from "@/server/orders";
import { formatINR } from "@/lib/catalogue";

export const metadata: Metadata = { title: "Customers", robots: { index: false, follow: false } };

const fmtDate = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ wa?: string }>;
}) {
  const { wa } = await searchParams;
  const onlyWa = wa === "1";
  const all = await listCustomers();
  const customers = onlyWa ? all.filter((c) => c.whatsappOptIn) : all;
  const optedIn = all.filter((c) => c.whatsappOptIn).length;

  return (
    <div className="col rv">
      <h1 className="disp h2">customers.</h1>
      <p className="lead">
        Everyone who has completed a paid order. {all.length} customer{all.length === 1 ? "" : "s"},{" "}
        {optedIn} opted in to WhatsApp.
      </p>

      <div className="admin-toolbar">
        <nav className="filters" aria-label="Filter customers">
          <Link className="chip-link" href="/admin/customers" aria-current={onlyWa ? undefined : "page"}>
            All
          </Link>
          <Link className="chip-link" href="/admin/customers?wa=1" aria-current={onlyWa ? "page" : undefined}>
            WhatsApp opted in
          </Link>
        </nav>
        {customers.length > 0 && (
          // A plain link (not next/link): this downloads a file rather than navigating.
          <a className="btn btn-ghost" href={`/admin/customers/export${onlyWa ? "?wa=1" : ""}`}>
            Download spreadsheet
          </a>
        )}
      </div>

      {customers.length === 0 ? (
        <p className="lead">{onlyWa ? "No one has opted in to WhatsApp yet." : "No customers yet."}</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>City</th>
                <th>Orders</th>
                <th>Spent</th>
                <th>Last order</th>
                <th>WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.email}>
                  <td>
                    {c.name}
                    <br />
                    <span className="lab dim">{c.email}</span>
                  </td>
                  <td>{c.phone}</td>
                  <td>{c.city}</td>
                  <td>{c.orders}</td>
                  <td>{formatINR(c.spent / 100)}</td>
                  <td>{fmtDate(c.lastOrder)}</td>
                  <td>{c.whatsappOptIn ? "Yes" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
