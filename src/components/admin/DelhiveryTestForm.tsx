"use client";

import { useActionState } from "react";
import { testDelhiveryConnection, type FormResult } from "@/app/admin/actions";

export function DelhiveryTestForm({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(testDelhiveryConnection, null);

  return (
    <form className="order-form" action={action} style={{ maxWidth: 480, marginTop: 24 }}>
      <p className="lab">Delhivery (shipping)</p>
      {enabled ? (
        <p className="legal">
          A Delhivery token and pickup location are set, so new paid orders book a shipment automatically. Check the
          connection with a pincode you know Delhivery serves:
        </p>
      ) : (
        <p className="legal">
          Not set up yet - add <code>DELHIVERY_API_TOKEN</code> and <code>DELHIVERY_PICKUP_LOCATION</code> on the
          server to turn this on. See <code>docs/delhivery-setup.md</code> for how to get these from Delhivery.
          Until then, orders ship exactly as they do today, with no shipment booked automatically.
        </p>
      )}
      <label className="full">
        <span className="lab dim">Pincode to test</span>
        <input name="pincode" type="text" inputMode="numeric" pattern="\d{6}" maxLength={6} placeholder="734001" />
      </label>
      {state && (
        <p className={state.ok ? "legal" : "stock"} role="status">
          {state.message}
        </p>
      )}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Checking…" : "Test connection"}
      </button>
    </form>
  );
}
