"use client";

import { useActionState } from "react";
import { updateOrder, type FormResult } from "@/app/admin/actions";
import { ORDER_STATUSES_LIST, STATUS_LABEL } from "@/lib/order-status";
import type { OrderStatus } from "@/server/schema";

export function OrderStatusForm({
  orderId,
  status,
  trackingNote,
}: {
  orderId: string;
  status: OrderStatus;
  trackingNote: string | null;
}) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(updateOrder, null);
  return (
    <form className="order-form" action={action}>
      <input type="hidden" name="orderId" value={orderId} />
      <label>
        <span className="lab dim">Status</span>
        <select name="status" defaultValue={status}>
          {ORDER_STATUSES_LIST.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="full">
        <span className="lab dim">Tracking / note for the buyer (optional)</span>
        <input name="trackingNote" defaultValue={trackingNote ?? ""} maxLength={300} />
      </label>
      {state && (
        <p className={state.ok ? "legal" : "stock"} role="status">
          {state.message}
        </p>
      )}
      <button className="btn btn-fill" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
