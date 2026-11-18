"use client";

import { useActionState } from "react";
import { refreshTracking, retryShipment, type FormResult } from "@/app/admin/actions";
import type { CourierStatus } from "@/server/schema";

const STATUS_LABEL: Record<CourierStatus, string> = {
  created: "Booked",
  manifested: "Manifested",
  in_transit: "In transit",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  rto: "Returned to origin",
  cancelled: "Cancelled",
  failed: "Booking failed",
};

export function CourierPanel({
  orderId,
  waybill,
  status,
  error,
  updatedAt,
  enabled,
}: {
  orderId: string;
  waybill: string | null;
  status: CourierStatus | null;
  error: string | null;
  updatedAt: Date | null;
  enabled: boolean;
}) {
  const [retryState, retryAction, retryPending] = useActionState<FormResult | null, FormData>(retryShipment, null);
  const [trackState, trackAction, trackPending] = useActionState<FormResult | null, FormData>(refreshTracking, null);

  return (
    <div className="courier-panel">
      <p className="lab" style={{ marginTop: 20 }}>
        Shipping (Delhivery)
      </p>

      {waybill ? (
        <p>
          Waybill <strong>{waybill}</strong>
          {status && <> · {STATUS_LABEL[status]}</>}
          {updatedAt && <span className="lab dim"> · updated {new Date(updatedAt).toLocaleString("en-IN")}</span>}
        </p>
      ) : (
        <p className="legal">
          {!enabled
            ? "Delhivery isn't set up yet, so no shipment was booked. See docs/delhivery-setup.md."
            : status === "failed"
              ? "The automatic booking failed when this order was paid - see below."
              : "No shipment booked yet."}
        </p>
      )}

      {status === "failed" && error && <p className="stock">{error}</p>}

      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        {waybill && (
          <a className="btn" href={`/admin/orders/${orderId}/label`} target="_blank" rel="noopener noreferrer">
            Download label
          </a>
        )}
        {waybill && (
          <form action={trackAction}>
            <input type="hidden" name="orderId" value={orderId} />
            <button className="btn" type="submit" disabled={trackPending}>
              {trackPending ? "Checking…" : "Refresh tracking"}
            </button>
          </form>
        )}
        {enabled && (!waybill || status === "failed") && (
          <form action={retryAction}>
            <input type="hidden" name="orderId" value={orderId} />
            <button className="btn btn-fill" type="submit" disabled={retryPending}>
              {retryPending ? "Booking…" : waybill ? "Retry booking" : "Book shipment"}
            </button>
          </form>
        )}
      </div>

      {retryState && (
        <p className={retryState.ok ? "legal" : "stock"} role="status">
          {retryState.message}
        </p>
      )}
      {trackState && (
        <p className={trackState.ok ? "legal" : "stock"} role="status">
          {trackState.message}
        </p>
      )}
    </div>
  );
}
