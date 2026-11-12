"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { describeSku, parseSku, stockKey, type LineInfo } from "@/lib/catalogue";

export type BagLine = { sku: string; qty: number };
export type ShopState = {
  stock: Record<string, number>;
  lowStockAt: number;
  shippingFee: number;
  freeShippingOver: number | null;
};

type Ctx = {
  lines: (BagLine & { info: LineInfo })[];
  count: number;
  subtotal: number;
  ready: boolean;
  shop: ShopState | null;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (sku: string, qty?: number) => boolean;
  setQty: (sku: string, qty: number) => void;
  clear: () => void;
  /** Units still available for a SKU after what's already in the bag. null = not tracked. */
  remaining: (sku: string) => number | null;
  toast: (msg: string) => void;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = "hh_bag_v2";

function readBag(): BagLine[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v
      .filter((l) => l && typeof l.sku === "string" && Number.isInteger(l.qty) && l.qty > 0)
      .filter((l) => describeSku(l.sku)?.unitPrice != null)
      .map((l) => ({ sku: l.sku, qty: Math.min(l.qty, 20) }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [bag, setBag] = useState<BagLine[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [shop, setShop] = useState<ShopState | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setBag(readBag());
    setReady(true);
    const onStorage = (e: StorageEvent) => e.key === KEY && setBag(readBag());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(KEY, JSON.stringify(bag));
      } catch {}
    }
  }, [bag, ready]);

  const loadShop = useCallback(() => {
    fetch("/api/shop-state", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setShop(d))
      .catch(() => {});
  }, []);
  useEffect(() => {
    loadShop();
    const onFocus = () => loadShop();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadShop]);
  useEffect(() => {
    if (open) loadShop();
  }, [open, loadShop]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastOn(false), 2400);
  }, []);

  const remainingIn = useCallback(
    (sku: string, current: BagLine[]) => {
      const p = parseSku(sku);
      if (!p || !shop) return null;
      const key = stockKey(p);
      const left = shop.stock[key];
      if (left === undefined) return null;
      const inBag = current
        .filter((l) => {
          const q = parseSku(l.sku);
          return q && stockKey(q) === key;
        })
        .reduce((a, l) => a + l.qty, 0);
      return Math.max(0, left - inBag);
    },
    [shop],
  );

  const add = useCallback(
    (sku: string, qty = 1) => {
      const info = describeSku(sku);
      if (!info || info.unitPrice === null) return false;
      const rem = remainingIn(sku, bag);
      if (rem !== null && rem < qty) {
        toast(rem === 0 ? "Sold out" : `Only ${rem} left`);
        return false;
      }
      setBag((b) => {
        const i = b.findIndex((l) => l.sku === sku);
        if (i === -1) return [...b, { sku, qty }];
        const next = b.slice();
        next[i] = { sku, qty: Math.min(20, next[i].qty + qty) };
        return next;
      });
      toast("Added to bag");
      document.getElementById("bagBtn")?.animate?.(
        [{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }],
        { duration: 320, easing: "cubic-bezier(.2,.7,.2,1)" },
      );
      return true;
    },
    [bag, remainingIn, toast],
  );

  const setQty = useCallback(
    (sku: string, qty: number) => {
      setBag((b) => {
        const cur = b.find((l) => l.sku === sku)?.qty ?? 0;
        if (qty > cur) {
          const rem = remainingIn(sku, b);
          if (rem !== null && rem < qty - cur) {
            toast(rem === 0 ? "No more in stock" : `Only ${rem} more available`);
            return b;
          }
        }
        if (qty <= 0) return b.filter((l) => l.sku !== sku);
        return b.map((l) => (l.sku === sku ? { sku, qty: Math.min(qty, 20) } : l));
      });
    },
    [remainingIn, toast],
  );

  const value = useMemo<Ctx>(() => {
    const lines = bag
      .map((l) => ({ ...l, info: describeSku(l.sku)! }))
      .filter((l) => l.info && l.info.unitPrice !== null);
    return {
      lines,
      count: lines.reduce((a, l) => a + l.qty, 0),
      subtotal: lines.reduce((a, l) => a + (l.info.unitPrice ?? 0) * l.qty, 0),
      ready,
      shop,
      open,
      setOpen,
      add,
      setQty,
      clear: () => setBag([]),
      remaining: (sku: string) => remainingIn(sku, bag),
      toast,
    };
  }, [bag, ready, shop, open, add, setQty, remainingIn, toast]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <div className={`toast${toastOn ? " show" : ""}`} role="status" aria-live="polite">
        {toastMsg}
      </div>
    </CartContext.Provider>
  );
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart must be used inside <CartProvider>");
  return c;
}
