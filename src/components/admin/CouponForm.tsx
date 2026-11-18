"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addCoupon, toggleCoupon, type CouponFormResult, type FormResult } from "@/app/admin/actions";

export function NewCouponForm() {
  const [state, action, pending] = useActionState<CouponFormResult | null, FormData>(addCoupon, null);
  const [kind, setKind] = useState<"percent" | "flat" | "none">("percent");
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);
  const err = (name: string) => state?.fieldErrors?.[name];

  return (
    <form className="order-form" action={action} ref={form}>
      <label className="full">
        <span className="lab dim">Code</span>
        <input
          name="code"
          placeholder="MONSOON15"
          maxLength={30}
          style={{ textTransform: "uppercase" }}
          required
          aria-invalid={Boolean(err("code"))}
        />
        {err("code") && <span className="field-err">{err("code")}</span>}
      </label>

      <label>
        <span className="lab dim">Type</span>
        <select name="kind" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
          <option value="percent">% off</option>
          <option value="flat">₹ off</option>
          <option value="none">No discount (shipping only)</option>
        </select>
      </label>
      {kind !== "none" && (
        <label>
          <span className="lab dim">{kind === "percent" ? "Discount (%)" : "Discount (₹)"}</span>
          <input
            name="value"
            type="number"
            min={1}
            max={kind === "percent" ? 90 : 100000}
            required
            aria-invalid={Boolean(err("value"))}
          />
          {err("value") && <span className="field-err">{err("value")}</span>}
        </label>
      )}

      <label>
        <span className="lab dim">Minimum order (₹, optional)</span>
        <input name="minOrder" type="number" min={0} placeholder="None" />
      </label>
      <label>
        <span className="lab dim">Ends on (optional)</span>
        <input name="endsAt" type="date" />
      </label>
      <label>
        <span className="lab dim">Total uses (optional)</span>
        <input name="maxUses" type="number" min={1} placeholder="Unlimited" />
      </label>
      <label>
        <span className="lab dim">Uses per customer</span>
        <input name="perCustomer" type="number" min={1} defaultValue={1} />
      </label>
      <label className="full chk">
        <input type="checkbox" name="freeShipping" />
        <span>Free shipping too</span>
      </label>
      <label className="full chk">
        <input type="checkbox" name="firstOrderOnly" />
        <span>First order only</span>
      </label>

      {err("kind") && (
        <p className="field-err full" role="alert">
          {err("kind")}
        </p>
      )}
      {state && !state.fieldErrors && (
        <p className={state.ok ? "legal" : "stock"} role="status">
          {state.message}
        </p>
      )}
      <button className="btn btn-fill" type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create coupon"}
      </button>
    </form>
  );
}

export function CouponToggle({ id, active }: { id: number; active: boolean }) {
  const [msg, setMsg] = useState<FormResult | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      className="admin-nav-logout"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        setMsg(await toggleCoupon(id, !active));
        setPending(false);
      }}
      title={msg && !msg.ok ? msg.message : undefined}
    >
      {active ? "Turn off" : "Turn on"}
    </button>
  );
}
