"use client";

import { useActionState, useId } from "react";
import { subscribe, type FormResult } from "@/app/actions";

/** Real email sign-up (stored in the database). `list` decides what it's for. */
export function SubscribeForm({
  list,
  label,
  className = "notify",
  placeholder = "Your email",
}: {
  list: string;
  label: string;
  className?: string;
  placeholder?: string;
}) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(subscribe, null);
  const id = useId();
  return (
    <form className={className} action={action} noValidate={false}>
      <label className="lab" htmlFor={id}>
        {label}
      </label>
      <div className="row">
        <input type="email" id={id} name="email" placeholder={placeholder} autoComplete="email" required />
        <input type="hidden" name="list" value={list} />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="sr" aria-hidden="true" />
        <button type="submit" aria-label="Sign up" disabled={pending}>
          →
        </button>
      </div>
      <p className="legal" role="status">
        {state?.message ?? ""}
      </p>
    </form>
  );
}
