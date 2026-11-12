"use client";

import { useCart } from "@/components/cart/CartProvider";

export function AddEquipmentButton({ sku }: { sku: string }) {
  const { add, shop, remaining } = useCart();
  const left = remaining(sku);
  const out = left !== null && left <= 0;
  const low = left !== null && shop && left > 0 && left <= shop.lowStockAt;
  return (
    <>
      {(out || low) && (
        <p className="stock" role="status">
          {out ? "Sold out" : `Only ${left} left`}
        </p>
      )}
      <button className="btn btn-fill" type="button" disabled={out} onClick={() => add(sku)}>
        {out ? "Sold out" : "Add to bag"}
      </button>
    </>
  );
}
