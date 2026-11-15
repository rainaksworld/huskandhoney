import Link from "next/link";
import { FOOTER_GROUPS, SITE } from "@/lib/site";
import { SubscribeForm } from "./SubscribeForm";

export function Footer() {
  return (
    <footer className="foot t-blue">
      <div className="foot-in">
        <div className="foot-brand">
          <div className="foot-id">
            <span className="pill">
              <span className="logo" role="img" aria-label="Husk and Honey" />
            </span>
            <p className="lab">{SITE.tagline}</p>
          </div>
          <address className="foot-contact">
            <span>{SITE.address}</span>
            <span>
              <a href={SITE.phoneHref}>{SITE.phoneDisplay}</a>
              <i aria-hidden="true"> · </i>
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </span>
            <span>{SITE.hours}</span>
          </address>
        </div>

        <nav className="foot-nav" aria-label="Footer">
          {FOOTER_GROUPS.map((g) => (
            <div className="foot-grp" key={g.title}>
              <p className="foot-h">{g.title}</p>
              <ul>
                {g.links.map((n) => (
                  <li key={n.href}>
                    <Link href={n.href}>{n.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="foot-news">
          <SubscribeForm list="cafe" label="Get a note when the café opens" />
          <p className="foot-small">One email when we open. Nothing else.</p>
        </div>

        <div className="foot-legal">
          <p className="legal">
            © 2026 Husk &amp; Honey, Siliguri · FSSAI Lic. No. {SITE.fssai} · GSTIN {SITE.gstin}
          </p>
          <p className="legal foot-note">{SITE.placeholderNote}</p>
        </div>
      </div>
    </footer>
  );
}
