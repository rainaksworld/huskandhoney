import type { Metadata } from "next";
import { connection } from "next/server";
import { listCoupons, describeCoupon } from "@/server/coupons";
import { formatINR } from "@/lib/catalogue";
import { NewCouponForm, CouponToggle } from "@/components/admin/CouponForm";

export const metadata: Metadata = { title: "Coupons", robots: { index: false, follow: false } };

function rules(c: Awaited<ReturnType<typeof listCoupons>>[number], now: number) {
  const bits: string[] = [];
  if (c.minOrder > 0) bits.push(`Orders above ${formatINR(c.minOrder)}`);
  if (c.endsAt) bits.push(c.endsAt.getTime() < now ? "Ended" : `Until ${c.endsAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`);
  if (c.firstOrderOnly) bits.push("First order only");
  if (c.perCustomer === 1) bits.push("Once per customer");
  else if (c.perCustomer) bits.push(`${c.perCustomer}× per customer`);
  return bits.join(" · ") || "No limits";
}

export default async function AdminCouponsPage() {
  await connection(); // live data only, never at build time (the layout's own connection() doesn't hold the page back)
  const coupons = await listCoupons();
  // eslint-disable-next-line react-hooks/purity -- connection() above already forces this page dynamic
  const now = Date.now();

  return (
    <div className="col rv">
      <h1 className="disp h2">coupons.</h1>

      {coupons.length === 0 ? (
        <p className="lead">No coupons yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table admin-cards">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Rules</th>
                <th>Used</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const ended = c.endsAt && c.endsAt.getTime() < now;
                const usedUp = c.maxUses !== null && c.used >= c.maxUses;
                const status = !c.active ? "Off" : ended ? "Ended" : usedUp ? "Used up" : "Active";
                return (
                  <tr key={c.id}>
                    <td>{c.code}</td>
                    <td>{describeCoupon(c)}</td>
                    <td>{rules(c, now)}</td>
                    <td>
                      {c.used}
                      {c.maxUses ? ` / ${c.maxUses}` : ""}
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge-${status === "Active" ? "paid" : "cancelled"}`}>
                        {status}
                      </span>
                      <br />
                      <CouponToggle id={c.id} active={c.active} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="legal">
        Every order shows which coupon was used and how much it took off — on the order page, in emails, and on the
        orders sheet. The same screen is in the Android admin app.
      </p>

      <div className="acct-sec">
        <h2 className="lab">New coupon</h2>
        <NewCouponForm />
      </div>
    </div>
  );
}
