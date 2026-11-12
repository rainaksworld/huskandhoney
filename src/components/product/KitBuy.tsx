"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  COFFEES,
  ROAST_LABEL,
  ROAST_SWATCH,
  ROASTS,
  formatINR,
  kitSku,
  type Kit,
  type Roast,
} from "@/lib/catalogue";
import { ART } from "@/lib/art";
import { useCart } from "@/components/cart/CartProvider";
import { Accordion } from "@/components/ui/Accordion";
import { SubscribeForm } from "@/components/site/SubscribeForm";

export function KitBuy({ kit }: { kit: Kit }) {
  const { add, shop, remaining } = useCart();
  const [coffeeSlug, setCoffeeSlug] = useState(COFFEES[0]?.slug ?? "");
  const [roast, setRoast] = useState<Roast>("medium");

  // One-time hydration from localStorage; not a sync loop.
  useEffect(() => {
    try {
      const last = JSON.parse(localStorage.getItem("hh_last") || "{}");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (last.roast && (ROASTS as readonly string[]).includes(last.roast)) setRoast(last.roast);
    } catch {}
  }, []);

  const coffee = COFFEES.find((c) => c.slug === coffeeSlug) ?? COFFEES[0];
  const sku = kitSku(kit.slug, coffee.slug, roast);
  const left = remaining(sku);
  const out = kit.price === null ? false : left !== null && left <= 0;
  const low = left !== null && shop && left > 0 && left <= shop.lowStockAt;

  return (
    <>
      <div className="reveal prod">
        <div className="col rv">
          <Link className="crumb" href="/shop">
            ← Shop
          </Link>
          <p className="lab dim">Starter kit</p>
          <h1 className="disp h2">{kit.name.toLowerCase()}.</h1>
          <p className="lead">{kit.line}</p>
        </div>

        <div className="stage" aria-hidden="true">
          <div className="tile olive" style={{ width: "100%", maxWidth: 360 }}>
            <svg viewBox="0 0 240 190" dangerouslySetInnerHTML={{ __html: ART[kit.slug] ?? "" }} />
          </div>
        </div>

        <div className="col rv">
          <fieldset className="opts">
            <legend className="lab dim">Coffee</legend>
            {COFFEES.filter((c) => c.available).map((c) => (
              <label className="chip" key={c.slug}>
                <input
                  type="radio"
                  name="kit-coffee"
                  value={c.slug}
                  checked={coffeeSlug === c.slug}
                  onChange={() => setCoffeeSlug(c.slug)}
                />
                <span>{c.name}</span>
              </label>
            ))}
          </fieldset>
          <fieldset className="opts">
            <legend className="lab dim">Roast</legend>
            {ROASTS.map((r) => (
              <label className="chip" key={r}>
                <input type="radio" name="kit-roast" value={r} checked={roast === r} onChange={() => setRoast(r)} />
                <span>
                  <i className="dot" style={{ background: ROAST_SWATCH[r] }} />
                  {ROAST_LABEL[r].replace(" roast", "")}
                </span>
              </label>
            ))}
          </fieldset>
          <p className="lead summary" aria-live="polite">
            {kit.name}, with {coffee.name} ({kit.grindNote}).
          </p>
          <p className="price">
            <span>{kit.price === null ? "Price at launch" : formatINR(kit.price)}</span>
          </p>
          {(out || low) && (
            <p className="stock" role="status">
              {out ? "Sold out" : `Only ${left} left`}
            </p>
          )}
          <div>
            {kit.price === null ? (
              <SubscribeForm list={`product:${kit.slug}`} label="Get notified when it's available" />
            ) : (
              <button className="btn btn-fill" type="button" disabled={out} onClick={() => add(sku)}>
                {out ? "Sold out" : "Add to bag"}
              </button>
            )}
          </div>
          <p className="legal">Prices are in rupees and may change before launch.</p>
          <div className="accs">
            <Accordion summary="What's in the box" defaultOpen>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
                {kit.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </Accordion>
            <Accordion summary="Add an extra bag">
              <p>
                Want a second bag in the bag? Head to the{" "}
                <Link href={`/coffee/${coffee.slug}?roast=${roast}&grind=${kit.grind}`}>
                  {coffee.name} page
                </Link>{" "}
                and add one in the matching grind.
              </p>
            </Accordion>
          </div>
        </div>
      </div>
    </>
  );
}
