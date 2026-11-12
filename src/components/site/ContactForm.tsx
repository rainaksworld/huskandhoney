"use client";

import { useActionState } from "react";
import { sendMessage, type FormResult } from "@/app/actions";

export function ContactForm() {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(sendMessage, null);
  if (state?.ok) {
    return (
      <div className="order-form c-form rv" role="status">
        <p className="lead">{state.message}</p>
      </div>
    );
  }
  return (
    <form className="order-form c-form rv" id="contactForm" action={action}>
      <label>
        <span className="lab dim">Name</span>
        <input name="name" required minLength={2} autoComplete="name" placeholder=" " />
      </label>
      <label>
        <span className="lab dim">Email</span>
        <input name="email" type="email" required autoComplete="email" placeholder=" " />
      </label>
      <label>
        <span className="lab dim">Message</span>
        <textarea name="msg" rows={5} required minLength={5} placeholder=" " />
      </label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="sr" aria-hidden="true" />
      <button className="btn btn-fill" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </button>
      <p className="legal" id="contactMsg" role="status">
        {state && !state.ok ? state.message : ""}
      </p>
    </form>
  );
}
