"use client";

import { useActionState } from "react";
import { updateStock, type FormResult } from "@/app/admin/actions";

export function StockForm({ items }: { items: { key: string; label: string; qty: number | null }[] }) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(updateStock, null);
  return (
    <form className="order-form admin-stock-form" action={action}>
      {items.map((it) => (
        <label key={it.key} className="full admin-stock-row">
          <span>{it.label}</span>
          <input
            name={`qty:${it.key}`}
            type="number"
            min={0}
            max={100000}
            step={1}
            defaultValue={it.qty ?? ""}
            placeholder="untracked"
          />
        </label>
      ))}
      {state && (
        <p className={state.ok ? "legal" : "stock"} role="status">
          {state.message}
        </p>
      )}
      <button className="btn btn-fill" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save stock"}
      </button>
      <p className="legal">Leave a count blank for an item not tracked yet — it will always show as in stock.</p>
    </form>
  );
}
