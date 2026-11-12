import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Admin login", robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  return (
    <section className="sec page" aria-labelledby="al-h">
      <div className="col rv">
        <p className="lab dim">Husk & Honey</p>
        <h1 className="disp h2" id="al-h">
          admin.
        </h1>
      </div>
      <LoginForm />
    </section>
  );
}
