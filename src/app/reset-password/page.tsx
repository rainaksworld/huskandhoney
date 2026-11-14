import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { peekAuthToken } from "@/server/accounts";
import { ResetPasswordForm } from "@/components/account/AccountForms";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

export const instant = false;

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  await connection();
  const token = (await searchParams).t ?? "";
  const live = await peekAuthToken(token, "reset");
  return (
    <section className="sec page" aria-labelledby="rp-h">
      <div className="col rv">
        <p className="lab dim">Your account</p>
        <h1 className="disp h2" id="rp-h">
          {live ? "choose a new password." : "this link has expired."}
        </h1>
        {!live && (
          <p className="lead">
            Reset links work for 1 hour and only once. <Link href="/forgot-password">Ask for a new one</Link>.
          </p>
        )}
      </div>
      {live && <ResetPasswordForm token={token} />}
    </section>
  );
}
