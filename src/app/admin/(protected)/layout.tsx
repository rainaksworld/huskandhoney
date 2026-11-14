import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isAdmin, adminEnabled } from "@/server/security";
import { LogoutButton } from "@/components/admin/LogoutButton";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// The whole admin area reads the session cookie and is owner-only, so there's
// no static shell worth prerendering here — block instead of streaming.
export const instant = false;

const NAV = [
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/stock", label: "Stock" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await connection(); // the session cookie is only known at request time
  if (!adminEnabled()) {
    return (
      <section className="sec page">
        <div className="col rv">
          <p className="lab dim">Admin</p>
          <h1 className="disp h2">not set up yet.</h1>
          <p className="lead">
            Set an <code>ADMIN_PASSWORD</code> (10+ characters) and <code>SESSION_SECRET</code> environment
            variable on the server to turn the admin area on.
          </p>
        </div>
      </section>
    );
  }
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <section className="sec page admin-shell" aria-label="Admin">
      <nav className="admin-nav" aria-label="Admin sections">
        <span className="admin-nav-title">Admin</span>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href}>
            {n.label}
          </Link>
        ))}
        <span className="admin-nav-spacer" />
        <Link href="/">View site</Link>
        <LogoutButton />
      </nav>
      <div className="admin-body">{children}</div>
    </section>
  );
}
