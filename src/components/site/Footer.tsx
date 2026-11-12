import Link from "next/link";
import { FOOTER_NAV, SITE } from "@/lib/site";
import { SubscribeForm } from "./SubscribeForm";

export function Footer() {
  return (
    <footer className="foot t-blue">
      <div className="col">
        <span className="pill">
          <span className="logo" role="img" aria-label="Husk and Honey" />
        </span>
        <p className="lab">{SITE.tagline}</p>
        <address className="foot-contact">
          <span>{SITE.address}</span>
          <a href={SITE.phoneHref}>{SITE.phoneDisplay}</a>
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          <span>{SITE.hours}</span>
        </address>
      </div>
      <nav className="foot-nav" aria-label="Footer">
        {FOOTER_NAV.map((n) => (
          <Link key={n.href} href={n.href}>
            {n.label}
          </Link>
        ))}
      </nav>
      <SubscribeForm list="cafe" label="Get a note when the café opens" />
      <div className="foot-legal">
        <p className="legal">
          FSSAI Lic. No. {SITE.fssai} · GSTIN {SITE.gstin}
        </p>
        <p className="legal">{SITE.placeholderNote}</p>
        <p className="legal">© 2026 Husk &amp; Honey, Siliguri.</p>
      </div>
    </footer>
  );
}
