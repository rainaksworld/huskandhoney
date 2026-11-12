import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { ContactForm } from "@/components/site/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Husk & Honey: address, phone, email and a message form.",
};

export default function ContactPage() {
  return (
    <section className="sec page" aria-labelledby="c-h">
      <div className="contact">
        <div className="doc rv">
          <p className="lab dim">Contact</p>
          <h1 className="disp h2" id="c-h">
            say hello.
          </h1>
          <p className="lead">Questions about coffee, orders or the café? Write to us.</p>
          <address className="c-list">
            <span className="lab dim">Address</span>
            <span>{SITE.address}</span>
            <span className="lab dim">Phone</span>
            <a href={SITE.phoneHref}>{SITE.phoneDisplay}</a>
            <span className="lab dim">Email</span>
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            <span className="lab dim">Hours</span>
            <span>{SITE.hours}</span>
          </address>
          <p className="legal">Placeholder details until launch.</p>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
