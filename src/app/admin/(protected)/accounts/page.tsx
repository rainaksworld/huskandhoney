import type { Metadata } from "next";
import { listAccounts } from "@/server/orders";
import { formatINR } from "@/lib/catalogue";
import { connection } from "next/server";

export const metadata: Metadata = { title: "Accounts", robots: { index: false, follow: false } };

const fmtDate = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default async function AdminAccountsPage() {
  await connection(); // live data only, never at build time (the layout's own connection() doesn't hold the page back)
  const accounts = await listAccounts();
  const verified = accounts.filter((a) => a.emailVerified).length;
  const withOrders = accounts.filter((a) => a.orders > 0).length;

  return (
    <div className="col rv">
      <h1 className="disp h2">accounts.</h1>
      <p className="lead">
        Everyone who has created an account on the site. {accounts.length} account{accounts.length === 1 ? "" : "s"},{" "}
        {verified} with a confirmed email, {withOrders} who have ordered.
      </p>

      {accounts.length > 0 && (
        <div className="admin-toolbar">
          <span />
          {/* A plain link (not next/link): this downloads a file rather than navigating. */}
          <a className="btn btn-ghost" href="/admin/accounts/export">
            Download spreadsheet
          </a>
        </div>
      )}

      {accounts.length === 0 ? (
        <p className="lead">No accounts yet.</p>
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
                <th>Joined</th>
                <th>Last login</th>
                <th>WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.name}
                    <br />
                    <span className="lab dim">
                      {a.email}
                      {!a.emailVerified && " · not confirmed"}
                    </span>
                  </td>
                  <td>{a.phone || "—"}</td>
                  <td>{a.city || "—"}</td>
                  <td>{a.orders}</td>
                  <td>{formatINR(a.spent / 100)}</td>
                  <td>{fmtDate(a.joined)}</td>
                  <td>{a.lastLogin ? fmtDate(a.lastLogin) : "—"}</td>
                  <td>{a.whatsappOptIn ? "Yes" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
