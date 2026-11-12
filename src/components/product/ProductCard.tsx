import Link from "next/link";
import { ViewTransition } from "react";
import { ART } from "@/lib/art";

export type CardData = {
  slug: string;
  href: string | null;
  cat: "coffee" | "kits" | "equipment";
  tile: "blue" | "olive" | "";
  tag: string;
  name: string;
  line: string;
  price: string | null;
  soon?: boolean;
};

/** Product tile with line-illustration art that comes alive on hover. */
export function ProductCard({ c }: { c: CardData }) {
  const art = (
    <div className={`tile ${c.tile}`.trim()}>
      <svg viewBox="0 0 240 190" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ART[c.slug] ?? "" }} />
    </div>
  );
  const body = (
    <div className="pt">
      <span className={`tag${c.soon ? " soon" : ""}`}>{c.soon ? `${c.tag} · Soon` : c.tag}</span>
      <h3 className="disp">{c.name}</h3>
      <p>{c.line}</p>
      {c.price && <span className="pfrom">{c.price}</span>}
    </div>
  );
  if (!c.href) {
    return (
      <div className="pcard rv" data-cat={c.cat} aria-disabled="true">
        {art}
        {body}
      </div>
    );
  }
  return (
    <Link className="pcard rv" href={c.href} data-cat={c.cat}>
      <ViewTransition name={`tile-${c.slug}`} share="morph" default="none">
        {art}
      </ViewTransition>
      {body}
    </Link>
  );
}
