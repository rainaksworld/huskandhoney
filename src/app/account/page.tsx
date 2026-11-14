import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ordersForUser, requireUser } from "@/server/accounts";
import { orderNumber } from "@/server/orders";
import { formatINR } from "@/lib/catalogue";
import { STATUS_LABEL } from "@/lib/order-status";
import {
  ChangePasswordForm,
  CustomerLogoutButton,
  DetailsForm,
  ResendVerifyButton,
} from "@/components/account/AccountForms";

export const metadata: Metadata = { title: "Your account", robots: { index: false, follow: false } };

// Personal page: always read live for whoever is logged in.
export const instant = false;

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  await connection();
  const user = await requireUser("/account");
  const { reset } = await searchParams;
  const orders = await ordersForUser(user);
  const first = user.name.split(" ")[0];

  return (
    <section className="sec page acct" aria-labelledby="ac-h">
      <div className="col rv acct-head">
        <div>
          <p className="lab dim">Your account</p>
          <h1 className="disp h2" id="ac-h">
            hi, {first.toLowerCase()}.
          </h1>
          <p className="lead">{user.email}</p>
        </div>
        <CustomerLogoutButton />
      </div>

      {reset === "1" && (
        <p className="acct-note" role="status">
          Your password has been changed and you&apos;re logged in.
        </p>
      )}

      {!user.emailVerified && (
        <div className="acct-note">
          <p>
            <strong>Please confirm your email.</strong> We sent a link to {user.email}. Once it&apos;s confirmed,
            any orders you placed with this email before signing up will show here too.
          </p>
          <ResendVerifyButton />
        </div>
      )}

      <div className="acct-sec">
        <h2 className="lab">Your orders</h2>
        {orders.length === 0 ? (
          <p>
            No orders yet. <Link href="/shop">Browse the shop</Link>.
          </p>
        ) : (
          <ul className="acct-orders">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/order/${o.id}?t=${o.accessToken}`}>
                  <span className="ao-num">{orderNumber(o.seq)}</span>
                  <span className="ao-date">
                    {new Date(o.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className={`admin-badge admin-badge-${o.status}`}>{STATUS_LABEL[o.status]}</span>
                  <span className="ao-total">{formatINR(o.total / 100)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="acct-sec">
        <h2 className="lab">Delivery details</h2>
        <p className="legal">Saved details are filled in for you at checkout.</p>
        <DetailsForm
          d={{
            name: user.name,
            phone: user.phone,
            address: user.address,
            city: user.city,
            state: user.state,
            pincode: user.pincode,
            whatsappOptIn: user.whatsappOptIn,
          }}
        />
      </div>

      <div className="acct-sec">
        <h2 className="lab">Password</h2>
        <ChangePasswordForm />
      </div>
    </section>
  );
}
