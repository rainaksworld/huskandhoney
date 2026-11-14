import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser, safeNext } from "@/server/accounts";
import { CustomerLoginForm } from "@/components/account/AccountForms";

export const metadata: Metadata = { title: "Log in", robots: { index: false, follow: true } };

// Reads the login cookie, so it can't have a prerendered shell.
export const instant = false;

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  await connection();
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return (
    <section className="sec page" aria-labelledby="li-h">
      <div className="col rv">
        <p className="lab dim">Your account</p>
        <h1 className="disp h2" id="li-h">
          welcome back.
        </h1>
      </div>
      <CustomerLoginForm next={next} />
    </section>
  );
}
