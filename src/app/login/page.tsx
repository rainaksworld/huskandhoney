import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser, safeNext } from "@/server/accounts";
import { facebookEnabled, googleEnabled } from "@/server/oauth";
import { CustomerLoginForm } from "@/components/account/AccountForms";

export const metadata: Metadata = { title: "Log in", robots: { index: false, follow: true } };

// Reads the login cookie, so it can't have a prerendered shell.
export const instant = false;

const ERROR_MESSAGE: Record<string, string> = {
  google_cancelled: "Google sign-in was cancelled.",
  google_state: "That Google sign-in link had expired. Please try again.",
  google_failed: "We couldn't sign you in with Google. Please try again.",
  google_account: "We couldn't create your account. Please try again.",
  facebook_cancelled: "Facebook sign-in was cancelled.",
  facebook_state: "That Facebook sign-in link had expired. Please try again.",
  facebook_failed: "We couldn't sign you in with Facebook. This can happen if your Facebook account has no email on it.",
  facebook_account: "We couldn't create your account. Please try again.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  await connection();
  const { next: nextRaw, error } = await searchParams;
  const next = safeNext(nextRaw);
  if (await getCurrentUser()) redirect(next);
  return (
    <section className="sec page" aria-labelledby="li-h">
      <div className="col rv">
        <p className="lab dim">Your account</p>
        <h1 className="disp h2" id="li-h">
          welcome back.
        </h1>
        {error && ERROR_MESSAGE[error] && (
          <p className="stock" role="alert">
            {ERROR_MESSAGE[error]}
          </p>
        )}
      </div>
      <CustomerLoginForm next={next} google={googleEnabled()} facebook={facebookEnabled()} />
    </section>
  );
}
