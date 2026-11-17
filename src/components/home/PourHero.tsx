"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { HeroLogo } from "./HeroLogo";
import { LOGO_PATH } from "@/lib/logo-path";
import { createPourScene } from "./pourScene";

/**
 * Home hero. As the visitor scrolls, a gooseneck kettle pours water into a
 * pour-over dripper and coffee drips into a glass Husk & Honey mug on a
 * coffee scale. The pour follows the scroll at a calm pace, the page waits
 * until the cup is ready, and a gentle nudge appears if the visitor stops
 * scrolling mid-brew.
 */
export function PourHero() {
  const trackRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const nudgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const canvas = canvasRef.current;
    if (!track || !canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let scene: ReturnType<typeof createPourScene> | null = null;
    try {
      scene = createPourScene(canvas, { logoPath: LOGO_PATH, logoColor: "#678BC7", scale: true });
    } catch {
      return;
    }
    if (reduce) scene.jump(1);

    const total = () => track.offsetHeight - 2 * window.innerHeight;
    const lockY = () => track.getBoundingClientRect().top + window.scrollY + total();
    const progress = () => {
      const t = total();
      return t > 0 ? Math.min(1, Math.max(0, -track.getBoundingClientRect().top / t)) : 0;
    };
    // Hold the page on the hero until the pour has finished, so the next
    // section doesn't slide in over a half-poured cup. Only applies once the
    // visitor has been in the hero (not when they arrive on a #link lower down).
    let armed = !window.location.hash && window.scrollY <= lockY();
    // "Scroll a bit more to finish brewing": only for someone who started
    // scrolling, then stopped before the cup was ready.
    let started = false, lastScroll = 0;
    const showNudge = (on: boolean) => nudgeRef.current?.classList.toggle("on", on);
    const nudgeTimer = window.setInterval(() => {
      if (!scene || reduce) return;
      showNudge(armed && started && !scene.isDone() && scene.isIdle() && Date.now() - lastScroll > 1500 && window.scrollY >= track.offsetTop);
    }, 300);
    let ticking = false;
    const update = () => {
      ticking = false;
      const p = progress();
      if (!reduce) scene?.setProgress(p);
      if (pctRef.current) pctRef.current.textContent = String(Math.round(p * 100));
      if (hintRef.current) hintRef.current.style.opacity = String(Math.max(0, 1 - p / 0.06));
    };
    const onScroll = () => {
      const ly = lockY();
      lastScroll = Date.now();
      if (window.scrollY > 4) started = true;
      showNudge(false);
      if (window.scrollY < ly - 1) armed = true;
      if (!reduce && armed && scene && !scene.isDone() && window.scrollY > ly + 1) {
        window.scrollTo({ top: ly, behavior: "instant" });
      }
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    let lastW = canvas.clientWidth;
    const onResize = () => {
      if (Math.abs(canvas.clientWidth - lastW) > 2) { lastW = canvas.clientWidth; scene?.resize(); }
      onScroll();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    if (!reduce) scene.jump(progress());
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      scene?.stop();
      window.clearInterval(nudgeTimer);
    };
  }, []);

  return (
    <section className="hero-track" id="top" aria-label="Husk and Honey" ref={trackRef}>
      <div className="hero-sticky">
        <div className="hero-top">
          <p className="lab">Coffee. Food. A little time well spent.</p>
          <h1 className="sr">Husk &amp; Honey</h1>
          <HeroLogo />
          <div className="hero-cta">
            <Link className="btn btn-fill" href="/shop?c=coffee">Shop coffee</Link>
            <Link className="btn btn-ghost" href="/shop?c=kits">Starter kits</Link>
          </div>
          <p className="lab hint" ref={hintRef}><i aria-hidden="true"></i>Scroll to pour</p>
        </div>

        <div className="pour-wrap">
          <canvas
            ref={canvasRef}
            className="pour-cv"
            role="img"
            aria-label="A gooseneck kettle pours hot water into a pour-over dripper, and coffee drips into a glass Husk and Honey mug"
          />
          <svg className="seal" viewBox="0 0 200 200" role="img" aria-label="Himalayan, rare coffee, 100% Arabica">
            <defs>
              <path id="seal-ring" d="M100 100m-74 0a74 74 0 1 1 148 0a74 74 0 1 1-148 0" />
            </defs>
            <circle cx="100" cy="100" r="97" fill="#F0E2B3" stroke="#1E2A15" strokeWidth="2" />
            <circle cx="100" cy="100" r="56" fill="none" stroke="#1E2A15" strokeWidth="1.2" strokeDasharray="2 4" />
            <g className="seal-spin">
              <text fontFamily="var(--f-ui), Montserrat, Arial, sans-serif" fontSize="14.5" fontWeight="700" letterSpacing="2.6" fill="#1E2A15">
                <textPath href="#seal-ring">HIMALAYAN · RARE COFFEE · 100% ARABICA ·</textPath>
              </text>
            </g>
            <path d="M70 120l20-32 10 14 10-14 20 32z" fill="#678BC7" stroke="#678BC7" strokeWidth="5" strokeLinejoin="round" />
            <ellipse cx="100" cy="72" rx="9" ry="6" fill="#4B682F" transform="rotate(-25 100 72)" />
          </svg>
          <div className="pour-nudge" ref={nudgeRef} role="status" aria-live="polite">
            <span aria-hidden="true">↓</span>Scroll a bit more to finish brewing
          </div>
        </div>

        <ul className="hero-facts" aria-label="Why Husk and Honey">
          <li>
            <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M3 33l11-18 6 9 5-7 12 16z" /><path d="M11 20l3 2 3-3" /></svg>
            <div><p className="hf-t">Himalayan single origin</p><p className="hf-d">Two estates, never blended.</p></div>
          </li>
          <li>
            <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 32C8 18 18 8 33 8c0 15-10 25-25 24z" /><path d="M8 32L24 16" /></svg>
            <div><p className="hf-t">Rare coffee from tea country</p><p className="hf-d">Grown where nearly every slope grows tea.</p></div>
          </li>
          <li>
            <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M5 16l3-9h24l3 9" /><path d="M5 16c0 3 3 4 5 4s5-1 5-4c0 3 3 4 5 4s5-1 5-4c0 3 3 4 5 4s5-1 5-4" /><path d="M8 20v13h24V20M17 33v-8h6v8" /></svg>
            <div><p className="hf-t">Café coming to Pradhan Nagar</p><p className="hf-d">Order the coffee now, visit us soon.</p></div>
          </li>
        </ul>
        <p className="lab side" aria-hidden="true">Husk &amp; Honey  /  Siliguri  /  26.72° N 88.39° E  /  Poured <span ref={pctRef}>0</span>%</p>
      </div>
    </section>
  );
}
