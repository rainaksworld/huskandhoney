"use client";

import { useRef } from "react";

/** A <details> disclosure with a smooth height animation (native fallback without JS). */
export function Accordion({
  summary,
  children,
  defaultOpen = false,
  className = "acc",
}: {
  summary: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const anim = useRef<Animation | null>(null);

  const onClick = (e: React.MouseEvent) => {
    const d = ref.current;
    const b = body.current;
    if (!d || !b || !b.animate || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    e.preventDefault();
    anim.current?.cancel();
    if (!d.open) {
      d.open = true;
      d.classList.remove("closing");
      const h = b.offsetHeight;
      anim.current = b.animate([{ height: "0px", opacity: 0 }, { height: `${h}px`, opacity: 1 }], {
        duration: 380,
        easing: "cubic-bezier(.2,.7,.2,1)",
      });
    } else {
      d.classList.add("closing");
      const a = b.animate([{ height: `${b.offsetHeight}px`, opacity: 1 }, { height: "0px", opacity: 0 }], {
        duration: 300,
        easing: "cubic-bezier(.4,0,.2,1)",
      });
      a.onfinish = () => {
        d.open = false;
        d.classList.remove("closing");
      };
      a.oncancel = () => d.classList.remove("closing");
      anim.current = a;
    }
  };

  return (
    <details className={className} ref={ref} open={defaultOpen || undefined}>
      <summary onClick={onClick}>{summary}</summary>
      <div className="acc-b" ref={body}>
        <div>{children}</div>
      </div>
    </details>
  );
}
