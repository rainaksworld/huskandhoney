"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  COFFEE_PRICE,
  GRIND_LABEL,
  GRINDS,
  KITS,
  ROAST_LABEL,
  ROAST_SWATCH,
  ROASTS,
  SIZES,
  coffeeSku,
  formatINR,
  type Coffee,
  type Grind,
  type Roast,
  type Size,
} from "@/lib/catalogue";
import { BAG_IMAGE } from "@/lib/bag-images";
import { useCart } from "@/components/cart/CartProvider";
import { Accordion } from "@/components/ui/Accordion";

const PAIR: Partial<Record<Grind, string>> = { pour: "v60", moka: "moka", whole: "french" };

export function CoffeeBuy({ coffee }: { coffee: Coffee }) {
  const { add, shop, remaining } = useCart();
  const [roast, setRoast] = useState<Roast>("medium");
  const [grind, setGrind] = useState<Grind>("pour");
  const [size, setSize] = useState<Size>("250");
  const [barOn, setBarOn] = useState(false);
  const addBtn = useRef<HTMLButtonElement>(null);
  const bag = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const notes = useRef<HTMLDivElement>(null);
  const firstPaint = useRef(true);

  // Pre-select from ?roast=&grind=&size= (quiz links) or the last choice.
  // One-time hydration from client-only sources (URL + localStorage); not a sync loop.
  useEffect(() => {
    let last: Record<string, string> = {};
    try {
      last = JSON.parse(localStorage.getItem("hh_last") || "{}");
    } catch {}
    const q = new URLSearchParams(location.search);
    const r = q.get("roast") ?? last.roast;
    const g = q.get("grind") ?? last.grind;
    const s = q.get("size") ?? last.size;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (r && (ROASTS as readonly string[]).includes(r)) setRoast(r as Roast);
    if (g && (GRINDS as readonly string[]).includes(g)) setGrind(g as Grind);
    if (s && (SIZES as readonly string[]).includes(s)) setSize(s as Size);
  }, []);

  // Fade the tasting notes when the roast changes.
  useEffect(() => {
    if (firstPaint.current) {
      firstPaint.current = false;
      return;
    }
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
      notes.current?.animate?.([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], {
        duration: 420,
        easing: "cubic-bezier(.2,.7,.2,1)",
      });
  }, [roast]);

  // Gentle idle float + pointer tilt on the bag.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const st = stage.current;
    const b = bag.current;
    if (!st || !b) return;
    let tx = 0, ty = 0, cx = 0, cy = 0, over = false, tick = 0, raf = 0;
    const move = (e: PointerEvent) => {
      const r = st.getBoundingClientRect();
      over = true;
      ty = ((e.clientX - r.left) / r.width - 0.5) * 18;
      tx = -((e.clientY - r.top) / r.height - 0.5) * 12;
    };
    const leave = () => (over = false);
    st.addEventListener("pointermove", move);
    st.addEventListener("pointerleave", leave);
    const loop = () => {
      tick += 0.012;
      const gx = over ? tx : Math.sin(tick) * 6;
      const gy = over ? ty : Math.cos(tick * 0.8) * 8;
      cx += (gx - cx) * 0.07;
      cy += (gy - cy) * 0.07;
      b.style.setProperty("--rx", `${cx.toFixed(2)}deg`);
      b.style.setProperty("--ry", `${cy.toFixed(2)}deg`);
      b.style.setProperty("--sx", (50 + cy * 3.2).toFixed(1));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      st.removeEventListener("pointermove", move);
      st.removeEventListener("pointerleave", leave);
    };
  }, []);

  // Sticky add bar appears once the main button scrolls out of view.
  useEffect(() => {
    const el = addBtn.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((es) => {
      const show = !es[0].isIntersecting;
      setBarOn(show);
      document.body.classList.toggle("has-addbar", show);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      document.body.classList.remove("has-addbar");
    };
  }, []);

  const sku = coffeeSku(coffee.slug, roast, grind, size);
  const price = COFFEE_PRICE[size];
  const left = remaining(sku);
  const out = left !== null && left <= 0;
  const low = left !== null && shop && left > 0 && left <= shop.lowStockAt;
  const grindText = grind === "whole" ? "whole bean" : `ground for ${GRIND_LABEL[grind].toLowerCase()}`;
  const summary = `${coffee.name}, ${ROAST_LABEL[roast].toLowerCase()}, ${grindText}, ${size} g.`;
  const per100 = (p: number, g: number) => (p / g) * 100;
  const saving = per100(COFFEE_PRICE["250"], 250) - per100(COFFEE_PRICE["500"], 500);
  const note = coffee.notes?.[roast] ?? null;
  const kit = KITS.find((k) => k.key === PAIR[grind]);

  const addCurrent = () => {
    if (add(sku)) {
      try {
        localStorage.setItem("hh_last", JSON.stringify({ roast, grind, size }));
      } catch {}
    }
  };

  return (
    <>
      <div className="reveal prod">
        <div className="col rv">
          <Link className="crumb" href="/shop">
            ← Shop
          </Link>
          <p className="lab dim">Coffee · {coffee.estate} estate</p>
          <h1 className="disp h2" id="coffee-h">
            {coffee.name.toLowerCase()}.
          </h1>
          <p className="lead">From the {coffee.estate} estate. Pick a roast and how you brew.</p>
          <fieldset className="opts" id="f-roast">
            <legend className="lab dim">Roast</legend>
            {ROASTS.map((r) => (
              <label className="chip" key={r}>
                <input type="radio" name="roast" value={r} checked={roast === r} onChange={() => setRoast(r)} />
                <span>
                  <i className="dot" style={{ background: ROAST_SWATCH[r] }} />
                  {ROAST_LABEL[r].replace(" roast", "")}
                </span>
              </label>
            ))}
          </fieldset>
        </div>

        <div className="stage" id="stage" data-roast={roast} ref={stage}>
          <div className="arch" aria-hidden="true" />
          <div className="bag-wrap" id="bagWrap" style={{ ["--sc" as string]: size === "500" ? "1.1" : "1" }}>
            <div className="bag-float">
              <div className="bag" id="bag" data-roast={roast} ref={bag}>
                {ROASTS.map((r) => (
                  <img
                    key={r}
                    className={`b-photo${r === roast ? " on" : ""}`}
                    src={BAG_IMAGE[r]}
                    alt={r === roast ? `${coffee.name} bag, ${summary}` : ""}
                    aria-hidden={r === roast ? undefined : true}
                    loading={r === "medium" ? "eager" : "lazy"}
                  />
                ))}
                <div className="sheen" />
              </div>
            </div>
          </div>
        </div>

        <div className="col rv">
          <fieldset className="opts" id="f-grind">
            <legend className="lab dim">Grind</legend>
            {GRINDS.map((g) => (
              <label className="chip" key={g}>
                <input type="radio" name="grind" value={g} checked={grind === g} onChange={() => setGrind(g)} />
                <span>{GRIND_LABEL[g]}</span>
              </label>
            ))}
          </fieldset>
          <fieldset className="opts" id="f-size">
            <legend className="lab dim">Size</legend>
            {SIZES.map((s) => (
              <label className="chip" key={s}>
                <input type="radio" name="size" value={s} checked={size === s} onChange={() => setSize(s)} />
                <span>{s} g</span>
              </label>
            ))}
          </fieldset>
          <p className="lead summary" aria-live="polite">
            {summary}
          </p>
          <p className="price">
            <span>{formatINR(price)}</span>
            <small>
              {size} g · {formatINR(per100(price, Number(size)))} per 100 g
            </small>
          </p>
          {saving > 0 && (
            <p className="nudge">
              {size === "250"
                ? `The 500 g bag works out about ${formatINR(saving)} less per 100 g.`
                : "Best value per 100 g."}
            </p>
          )}
          {(out || low) && (
            <p className="stock" role="status">
              {out ? "Sold out in this roast and size" : `Only ${left} left in this roast and size`}
            </p>
          )}
          <div className="notes" aria-live="polite" ref={notes}>
            {note ? (
              <>
                <p className="lab">
                  {coffee.estate} · {ROAST_LABEL[roast]}
                </p>
                <p>{note.description}</p>
                <dl>
                  <dt>Flavour</dt>
                  <dd>{note.flavour.join(" • ")}</dd>
                  <dt>Brew as</dt>
                  <dd>{note.brewAs.join(" • ")}</dd>
                  <dt>Best for</dt>
                  <dd>{note.bestFor}</dd>
                </dl>
              </>
            ) : (
              <p className="soon">Tasting notes for this roast will be added soon.</p>
            )}
          </div>
          <div>
            <button className="btn btn-fill" id="addCoffee" type="button" ref={addBtn} disabled={out} onClick={addCurrent}>
              {out ? "Sold out" : "Add to bag"}
            </button>
          </div>
          <p className="legal">Prices are in rupees and may change before launch.</p>
          <div className="accs">
            <Accordion summary="Origin">
              <dl className="facts-dl">
                {(
                  [
                    ["Estate", coffee.estate],
                    ["Process", coffee.facts.process],
                    ["Altitude", coffee.facts.altitude],
                    ["Variety", coffee.facts.variety],
                    ["Harvest", coffee.facts.harvest],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v ?? "To be added"}</dd>
                  </div>
                ))}
              </dl>
            </Accordion>
            <Accordion summary="Grinds">
              <p>Whole bean, Espresso, Moka pot, Pour over, AeroPress.</p>
              <p>
                Not sure which to pick? The <Link href="/brew">brew guide</Link> shows the grind for each method.
              </p>
            </Accordion>
            <Accordion summary="Sizes">
              <p>250 g and 500 g.</p>
            </Accordion>
          </div>
        </div>
      </div>

      <section className="sec page" id="extras" aria-label="More about this coffee" style={{ borderTop: "1px dashed var(--line)" }}>
        <div className="extras">
          <div className="rv">
            <p className="lab dim">Pairs well with</p>
            <div id="pairs">
              {kit ? (
                <Link className="pair" href={`/kits/${kit.slug}`}>
                  <strong>{kit.name}</strong>
                  <span>
                    {kit.line} Includes: {kit.items.join(", ")}.
                  </span>
                  <em>See the kit →</em>
                </Link>
              ) : (
                <p>
                  Browse the <Link href="/shop?c=kits">starter kits</Link> and{" "}
                  <Link href="/shop?c=equipment">equipment</Link> for a brewer that suits{" "}
                  {GRIND_LABEL[grind].toLowerCase()}.
                </p>
              )}
            </div>
          </div>
          <div className="rv">
            <p className="lab dim">Reviews</p>
            <div id="reviews">
              <p>No reviews yet. Reviews from people who bought and brewed this coffee will appear here.</p>
            </div>
          </div>
        </div>
      </section>

      <div className={`addbar${barOn ? " on" : ""}`} inert={!barOn}>
        <span>
          {coffee.name} · {ROAST_LABEL[roast]} · {size} g · {formatINR(price)}
        </span>
        <button className="btn btn-fill" type="button" disabled={out} onClick={addCurrent}>
          Add to bag
        </button>
      </div>
    </>
  );
}
