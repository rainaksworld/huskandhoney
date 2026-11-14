"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Dialog } from "radix-ui";
import { useCart } from "./CartProvider";
import { useTransitionMount } from "@/components/ui/useTransitionMount";
import { COFFEES, COFFEE_PRICE, coffeeSku, formatINR, parseSku } from "@/lib/catalogue";

export function CartDrawer() {
  const { lines, subtotal, open, setOpen, setQty, add, shop, ready } = useCart();
  // Mounted only while open (+ the 0.4s slide-out); see useTransitionMount for why.
  const drawer = useTransitionMount(open, 400);
  // Once the drawer is actually showing, put keyboard focus on its Close button;
  // when it closes, hand focus back to the Bag button that opened it.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && drawer.visible) {
      wasOpen.current = true;
      document.getElementById("drawerX")?.focus();
    } else if (!open && wasOpen.current) {
      wasOpen.current = false;
      document.getElementById("bagBtn")?.focus();
    }
  }, [open, drawer.visible]);

  const freeOver = shop?.freeShippingOver ?? null;
  const fee = shop?.shippingFee ?? 0;

  // One gentle cross-sell: the other estate, same roast/grind/size as the first coffee in the bag.
  const firstCoffee = lines.map((l) => parseSku(l.sku)).find((p) => p?.kind === "coffee");
  const inBag = new Set(
    lines.map((l) => parseSku(l.sku)).flatMap((p) => (p?.kind === "coffee" ? [p.coffee.slug] : [])),
  );
  const other =
    firstCoffee && firstCoffee.kind === "coffee"
      ? COFFEES.find((c) => c.available && !inBag.has(c.slug))
      : undefined;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {/*
        The Portal is force-mounted so the drawer can slide out after closing
        (otherwise Radix removes it instantly). The Overlay and Content only
        exist while the drawer is open or sliding out (useTransitionMount):
        while mounted, Radix locks page scroll and hides the page from screen
        readers - correct for an open drawer, but it used to happen
        permanently, blocking scrolling and hiding the whole site from
        assistive technology.
      */}
      <Dialog.Portal forceMount>
        {drawer.mounted && <Dialog.Overlay className={`scrim${drawer.visible ? " open" : ""}`} />}
        {drawer.mounted && (
          <Dialog.Content
            forceMount
            className={`drawer${drawer.visible ? " open" : ""}`}
            aria-describedby={undefined}
            // The drawer is still invisible when Radix asks for focus, and hidden
            // things can't take focus - so focus is set below, once it shows.
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="drawer-head">
              <Dialog.Title className="lab">Your bag</Dialog.Title>
              <Dialog.Close className="btn btn-ghost" id="drawerX">
                Close
              </Dialog.Close>
            </div>

            <ul className="cart" id="cart">
              {ready && lines.length === 0 && (
                <li className="empty">
                  Your bag is empty.{" "}
                  <Link href="/shop" onClick={() => setOpen(false)}>
                    Browse the shop
                  </Link>
                </li>
              )}
              {lines.map((l) => (
                <li key={l.sku} data-sku={l.sku}>
                  <div className="t">{l.info.title}</div>
                  <div className="m">{l.info.meta}</div>
                  <div className="qty">
                    <button type="button" aria-label={`One fewer ${l.info.title}`} onClick={() => setQty(l.sku, l.qty - 1)}>
                      −
                    </button>
                    <span aria-label="Quantity">{l.qty}</span>
                    <button type="button" aria-label={`One more ${l.info.title}`} onClick={() => setQty(l.sku, l.qty + 1)}>
                      +
                    </button>
                  </div>
                  <div className="pr">{formatINR((l.info.unitPrice ?? 0) * l.qty)}</div>
                </li>
              ))}
            </ul>

            {other && firstCoffee?.kind === "coffee" && (
              <div className="cart-up">
                <p>
                  Curious about the other estate? Try {other.name} ({other.estate}) in the same roast and grind.
                </p>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    add(coffeeSku(other.slug, firstCoffee.roast, firstCoffee.grind, firstCoffee.size))
                  }
                >
                  Add {other.name} · {formatINR(COFFEE_PRICE[firstCoffee.size])}
                </button>
              </div>
            )}

            {lines.length > 0 && (
              <div className="col" style={{ gap: 14 }}>
                <div className="cart-sum">
                  <div className="row">
                    <span>Subtotal</span>
                    <span>{formatINR(subtotal)}</span>
                  </div>
                  {shop && (
                    <div className="row">
                      <span>Shipping</span>
                      <span>
                        {freeOver !== null && subtotal >= freeOver
                          ? "Free"
                          : fee > 0
                            ? formatINR(fee)
                            : "Free"}
                      </span>
                    </div>
                  )}
                  {freeOver !== null && fee > 0 && subtotal < freeOver && (
                    <>
                      <p className="hint">Add {formatINR(freeOver - subtotal)} more for free shipping.</p>
                      <div className="meter">
                        <i style={{ width: `${Math.min(100, (subtotal / freeOver) * 100)}%` }} />
                      </div>
                    </>
                  )}
                </div>
                <Link href="/checkout" className="btn btn-fill" onClick={() => setOpen(false)}>
                  Checkout
                </Link>
                <p className="legal">Prices are in rupees. Shipping is confirmed at checkout.</p>
              </div>
            )}
          </Dialog.Content>
        )}
      </Dialog.Portal>
    </Dialog.Root>
  );
}
