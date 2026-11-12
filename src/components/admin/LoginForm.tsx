"use client";

import { useActionState } from "react";
import { adminLogin, type FormResult } from "@/app/admin/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(adminLogin, null);
  return (
    <form className="order-form" action={action} style={{ maxWidth: 360 }}>
      <label className="full">
        <span className="lab dim">Admin password</span>
        <input name="password" type="password" required autoComplete="current-password" autoFocus />
      </label>
      {state && !state.ok && (
        <p className="stock" role="alert">
          {state.message}
        </p>
      )}
      <button className="btn btn-fill" type="submit" disabled={pending}>
        {pending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}
