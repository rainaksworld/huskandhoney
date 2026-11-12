"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Site-wide behaviour that isn't tied to one component:
 * - opens every new page at the top (fixes mobile pages opening scrolled down),
 * - reveals `.rv` elements as they scroll into view, with a short stagger,
 * - hides the first-visit loading screen once the page has loaded.
 */
export function Enhancements() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      history.scrollRestoration = "manual";
    } catch {}
  }, []);

  useEffect(() => {
    if (location.hash) return;
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    requestAnimationFrame(() => (html.style.scrollBehavior = prev));
  }, [pathname]);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = new WeakSet<Element>();
    const io =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (es) =>
              es.forEach((e) => {
                if (e.isIntersecting) {
                  e.target.classList.add("in");
                  io?.unobserve(e.target);
                }
              }),
            { threshold: 0.12 },
          )
        : null;
    const scan = () => {
      document.querySelectorAll(".rv").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        const sibs = Array.from(el.parentElement?.children ?? []).filter((x) => x.classList.contains("rv"));
        const i = sibs.indexOf(el);
        if (i > 0 && !reduce) (el as HTMLElement).style.setProperty("--d", `${Math.min(i, 6) * 0.07}s`);
        if (io) io.observe(el);
        else el.classList.add("in");
      });
    };
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      io?.disconnect();
    };
  }, [pathname]);

  useEffect(() => {
    const boot = document.querySelector<HTMLElement>(".boot");
    if (!boot) return;
    // Hide with CSS only (never detach the node): it's rendered by a React
    // server component, so removing it from the DOM out-of-band would leave
    // React's tree out of sync with the live DOM, which can surface as an
    // unrelated insertBefore/removeChild error the next time React needs to
    // reconcile a sibling (e.g. a route transition).
    if (document.documentElement.classList.contains("hh-seen")) {
      boot.classList.add("out");
      return;
    }
    const start = performance.now();
    const hide = () => boot.classList.add("out");
    const later = () => setTimeout(hide, Math.max(0, 1600 - (performance.now() - start)));
    if (document.readyState === "complete") later();
    else window.addEventListener("load", later, { once: true });
    const cap = setTimeout(hide, 3200);
    return () => clearTimeout(cap);
  }, []);

  return null;
}
