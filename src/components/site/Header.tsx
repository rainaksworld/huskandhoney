"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import { MENU, NAV } from "@/lib/site";
import { useCart } from "@/components/cart/CartProvider";

function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/shop")
    return ["/shop", "/coffee", "/kits", "/equipment"].some((p) => pathname.startsWith(p));
  return pathname.startsWith(href);
}

export function Header() {
  const pathname = usePathname();
  const { count, setOpen } = useCart();
  const [stuck, setStuck] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = pathname === "/";

  useEffect(() => {
    const on = () => setStuck(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // Close the mobile menu on navigation.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <>
      <header className={`nav${stuck ? " stuck" : ""}`} id="nav">
        <div className="nav-left">
          {!isHome && <Link className="nav-logo" href="/" aria-label="Husk and Honey, home" />}
          <nav className="nav-links" aria-label="Main">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={isCurrent(pathname, n.href) ? "page" : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="nav-r">
          <button className="btn btn-ghost" id="bagBtn" type="button" aria-haspopup="dialog" onClick={() => setOpen(true)}>
            Bag (<span id="bagCount">{count}</span>)
          </button>
          <button
            className="btn btn-ghost menu-btn"
            id="menuBtn"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="menu"
            onClick={() => setMenuOpen(true)}
          >
            Menu
          </button>
        </div>
      </header>

      <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Dialog.Portal forceMount>
          <Dialog.Content
            forceMount
            id="menu"
            className={`menu${menuOpen ? " open" : ""}`}
            aria-describedby={undefined}
          >
            <Dialog.Title className="sr">Menu</Dialog.Title>
            <Dialog.Close className="btn btn-ghost x" id="menuX">
              Close
            </Dialog.Close>
            {MENU.map((m) => (
              <Link key={m.href} href={m.href} onClick={() => setMenuOpen(false)}>
                {m.label}
              </Link>
            ))}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
