"use client";

import { useEffect, useState } from "react";

/**
 * Keeps a panel in the DOM only while it's open, plus `closeMs` after it
 * closes so its CSS exit transition can finish. `visible` turns on a frame
 * after mounting so the enter transition plays too.
 *
 * Why this exists: a Radix Dialog marks everything else on the page
 * aria-hidden for as long as its Content is mounted - not just while it's
 * open. Permanently mounting the menu/drawer (forceMount, for CSS
 * transitions) therefore hid the whole site from screen readers. Mounting
 * only while open keeps the transitions and lets the page be read again.
 */
export function useTransitionMount(open: boolean, closeMs: number) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      // Mount first, then flip to visible on the next frames so the browser
      // has painted the closed state and the enter transition runs.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      let id = requestAnimationFrame(() => {
        id = requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), closeMs);
    return () => clearTimeout(t);
  }, [open, closeMs]);

  return { mounted, visible };
}
