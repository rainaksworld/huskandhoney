"use client";

import { useActionState } from "react";
import { updateSettings, type FormResult } from "@/app/admin/actions";
import type { Settings } from "@/server/store";

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(updateSettings, null);
  return (
    <form className="order-form" action={action} style={{ maxWidth: 480 }}>
      <label className="full">
        <span className="lab dim">Flat shipping fee (₹)</span>
        <input name="shippingFee" type="number" min={0} max={100000} step={1} defaultValue={settings.shippingFee} />
      </label>
      <label className="full">
        <span className="lab dim">Free shipping over (₹) — leave blank for no threshold</span>
        <input
          name="freeShippingOver"
          type="number"
          min={0}
          max={10000000}
          step={1}
          defaultValue={settings.freeShippingOver ?? ""}
        />
      </label>
      <label className="full">
        <span className="lab dim">Show &quot;only N left&quot; at or below this count</span>
        <input name="lowStockAt" type="number" min={0} max={1000} step={1} defaultValue={settings.lowStockAt} />
      </label>
      {state && (
        <p className={state.ok ? "legal" : "stock"} role="status">
          {state.message}
        </p>
      )}
      <button className="btn btn-fill" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
