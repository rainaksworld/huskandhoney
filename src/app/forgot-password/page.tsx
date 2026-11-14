import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/account/AccountForms";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false, follow: true } };

export default function ForgotPasswordPage() {
  return (
    <section className="sec page" aria-labelledby="fp-h">
      <div className="col rv">
        <p className="lab dim">Your account</p>
        <h1 className="disp h2" id="fp-h">
          forgot your password?
        </h1>
        <p className="lead">Enter the email you signed up with and we&apos;ll send you a link to choose a new one.</p>
      </div>
      <ForgotPasswordForm />
    </section>
  );
}
