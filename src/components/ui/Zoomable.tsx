"use client";

import { Dialog } from "radix-ui";
import { useState } from "react";

/**
 * Wraps a picture so a click or Enter opens it large in an accessible dialog.
 * On small screens the enlarged view is wider than the screen; drag to look around.
 */
export function Zoomable({
  className,
  caption,
  label = "Enlarge picture",
  large,
  children,
  style,
}: {
  className: string;
  caption?: string;
  label?: string;
  /** What to show enlarged. Defaults to the children. */
  large?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <div className={`${className} zoomable`} role="button" tabIndex={0} aria-label={label} style={style}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen(true);
            }
          }}
        >
          {children}
        </div>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content className="zoom open zoom-content" aria-describedby={undefined}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <Dialog.Title className="sr">{caption ?? "Enlarged picture"}</Dialog.Title>
          <Dialog.Close className="btn btn-ghost zoom-x">Close</Dialog.Close>
          <div
            className="zoom-in"
            ref={(el) => {
              if (el) requestAnimationFrame(() => (el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2));
            }}
          >
            {large ?? children}
          </div>
          {caption && <p className="zoom-cap">{caption}</p>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
