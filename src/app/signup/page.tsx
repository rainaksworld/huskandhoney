import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser, safeNext } from "@/server/accounts";
import { SignUpForm } from "@/components/account/AccountForms";

export const metadata: Metadata = { title: "Create an account", robots: { index: false, follow: true } };

export const instant = false;

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  await connection();
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return (
    <section className="sec page" aria-labelledby="su-h">
      <div className="col rv">
        <p className="lab dim">Your account</p>
        <h1 className="disp h2" id="su-h">
          create an account.
        </h1>
        <p className="lead">Save your delivery details, see your orders, and check out faster next time.</p>
      </div>
      <SignUpForm next={next} />
    </section>
  );
}
