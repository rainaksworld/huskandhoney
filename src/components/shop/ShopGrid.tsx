"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ProductCard, type CardData } from "@/components/product/ProductCard";

type Filter = "all" | "coffee" | "kits" | "equipment";
type Layout = "showcase" | "grid" | "list";
const FILTERS: { v: Filter; label: string }[] = [
  { v: "all", label: "All" },
  { v: "coffee", label: "Coffee" },
  { v: "kits", label: "Starter kits" },
  { v: "equipment", label: "Equipment" },
];
const LAYOUTS: { v: Layout; label: string }[] = [
  { v: "showcase", label: "Showcase" },
  { v: "grid", label: "Grid" },
  { v: "list", label: "List" },
];
const EASE = "cubic-bezier(.2,.7,.2,1)";

export function ShopGrid({ cards }: { cards: CardData[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [layout, setLayout] = useState<Layout>("showcase");
  const grid = useRef<HTMLDivElement>(null);
  const before = useRef<Map<string, DOMRect> | null>(null);

  // Read ?c= and the remembered layout after mount (keeps the page static).
  useEffect(() => {
    const c = new URLSearchParams(location.search).get("c");
    if (c === "coffee" || c === "kits" || c === "equipment") setFilter(c);
    try {
      const l = localStorage.getItem("hh_layout");
      if (l === "showcase" || l === "grid" || l === "list") setLayout(l);
    } catch {}
  }, []);

  const snapshot = () => {
    const m = new Map<string, DOMRect>();
    grid.current?.querySelectorAll<HTMLElement>("[data-key]").forEach((el) => {
      if (!el.hidden) m.set(el.dataset.key!, el.getBoundingClientRect());
    });
    before.current = m;
  };

  const choose = (v: Filter) => {
    snapshot();
    setFilter(v);
    const url = new URL(location.href);
    if (v === "all") url.searchParams.delete("c");
    else url.searchParams.set("c", v);
    history.replaceState(history.state, "", url);
  };

  // FLIP: slide kept cards to their new place, fade new ones in.
  useLayoutEffect(() => {
    const prev = before.current;
    before.current = null;
    if (!prev || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let n = 0;
    grid.current?.querySelectorAll<HTMLElement>("[data-key]").forEach((el) => {
      if (el.hidden) return;
      const card = el.firstElementChild as HTMLElement | null;
      if (!card?.animate) return;
      const f = prev.get(el.dataset.key!);
      const l = el.getBoundingClientRect();
      if (f) {
        const dx = f.left - l.left;
        const dy = f.top - l.top;
        if (dx || dy)
          card.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: "none" }], {
            duration: 520,
            easing: EASE,
          });
      } else {
        card.classList.add("in");
        card.animate(
          [{ opacity: 0, transform: "translateY(16px) scale(.97)" }, { opacity: 1, transform: "none" }],
          { duration: 480, delay: 120 + n++ * 50, easing: EASE, fill: "backwards" },
        );
      }
    });
  }, [filter]);

  const pickLayout = (v: Layout) => {
    setLayout(v);
    try {
      localStorage.setItem("hh_layout", v);
    } catch {}
  };

  return (
    <>
      <div className="shop-bar">
        <fieldset className="filters" id="filters" aria-label="Filter products">
          {FILTERS.map((f) => (
            <label className="chip" key={f.v}>
              <input type="radio" name="f" value={f.v} checked={filter === f.v} onChange={() => choose(f.v)} />
              <span>{f.label}</span>
            </label>
          ))}
        </fieldset>
        <fieldset className="filters layout" id="layout" aria-label="Choose layout">
          {LAYOUTS.map((l) => (
            <label className="chip" key={l.v}>
              <input type="radio" name="l" value={l.v} checked={layout === l.v} onChange={() => pickLayout(l.v)} />
              <span>{l.label}</span>
            </label>
          ))}
        </fieldset>
      </div>
      <div className="shop-grid" id="grid" data-layout={layout} ref={grid}>
        {cards.map((c) => {
          const hidden = filter !== "all" && c.cat !== filter;
          // Both estates get the same large tile in Showcase, so neither reads as "the hero".
          const feat = layout === "showcase" && c.cat === "coffee" && Boolean(c.href);
          return (
            <div key={c.slug} data-key={c.slug} hidden={hidden} className={`cell${feat ? " feat" : ""}`}>
              <ProductCard c={c} />
            </div>
          );
        })}
      </div>
    </>
  );
}
