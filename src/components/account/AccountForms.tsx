"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  changePassword,
  logIn,
  logOut,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  signUp,
  updateDetails,
  type AccountFormResult,
} from "@/app/account/actions";

type Action = (prev: AccountFormResult | null, form: FormData) => Promise<AccountFormResult>;

/**
 * Like useActionState, but submitted through onSubmit instead of the form's
 * `action` prop. React resets a form after an `action` submission, which
 * would wipe everything someone typed when the server finds a mistake.
 */
function useAccountForm(fn: Action) {
  const [state, action, pending] = useActionState<AccountFormResult | null, FormData>(fn, null);
  const [, start] = useTransition();
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(() => action(fd));
  };
  return [state, onSubmit, pending] as const;
}

type FieldProps = {
  name: string;
  label: string;
  state: AccountFormResult | null;
  type?: string;
  autoComplete?: string;
  defaultValue?: string;
  full?: boolean;
  required?: boolean;
  hint?: string;
  minLength?: number;
};

function Field({ name, label, state, type = "text", autoComplete, defaultValue, full, required, hint, minLength }: FieldProps) {
  const err = state?.fieldErrors?.[name];
  return (
    <label className={full ? "full" : undefined}>
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        placeholder=" " /* lets the CSS tell "empty" from "typed something wrong" */
        required={required}
        minLength={minLength}
        aria-invalid={Boolean(err)}
        aria-describedby={hint ? `${name}-hint` : undefined}
      />
      {hint && !err && (
        <span className="field-hint" id={`${name}-hint`}>
          {hint}
        </span>
      )}
      {err && <span className="field-err">{err}</span>}
    </label>
  );
}

function Status({ state }: { state: AccountFormResult | null }) {
  if (!state) return null;
  return (
    <p className={state.ok ? "legal ok-msg" : "stock"} role={state.ok ? "status" : "alert"}>
      {state.message}
    </p>
  );
}

/** Show/hide toggle so people can check what they typed on a phone keyboard. */
function PasswordField(props: Omit<FieldProps, "type">) {
  const [show, setShow] = useState(false);
  return (
    <div className={`pw-wrap${props.full ? " full" : ""}`}>
      <Field {...props} full type={show ? "text" : "password"} />
      <button type="button" className="pw-toggle" onClick={() => setShow((s) => !s)} aria-pressed={show}>
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export function SignUpForm({ next }: { next: string }) {
  const [state, onSubmit, pending] = useAccountForm(signUp);
  return (
    <form className="order-form auth-form" onSubmit={onSubmit} noValidate>
      <input type="hidden" name="next" value={next} />
      {/* Honeypot: hidden from people, filled in by bots. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="sr" aria-hidden="true" />
      <Field name="name" label="Full name" state={state} autoComplete="name" required full />
      <Field name="email" label="Email" type="email" state={state} autoComplete="email" required full />
      <Field
        name="phone"
        label="Mobile (optional)"
        type="tel"
        state={state}
        autoComplete="tel"
        full
        hint="For delivery updates. 10 digits."
      />
      <PasswordField
        name="password"
        label="Password"
        state={state}
        autoComplete="new-password"
        required
        minLength={8}
        full
        hint="At least 8 characters."
      />
      <label className="full chk">
        <input type="checkbox" name="whatsappOptIn" defaultChecked />
        <span>Send order updates and offers on WhatsApp</span>
      </label>
      <Status state={state} />
      <button className="btn btn-fill" type="submit" disabled={pending}>
        {pending ? "Creating your account…" : "Create account"}
      </button>
      <p className="legal">
        Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`}>Log in</Link>
      </p>
    </form>
  );
}

export function CustomerLoginForm({ next }: { next: string }) {
  const [state, onSubmit, pending] = useAccountForm(logIn);
  return (
    <form className="order-form auth-form" onSubmit={onSubmit}>
      <input type="hidden" name="next" value={next} />
      <Field name="email" label="Email" type="email" state={state} autoComplete="email" required full />
      <PasswordField name="password" label="Password" state={state} autoComplete="current-password" required full />
      <Status state={state} />
      <button className="btn btn-fill" type="submit" disabled={pending}>
        {pending ? "Logging in…" : "Log in"}
      </button>
      <p className="legal">
        <Link href="/forgot-password">Forgot your password?</Link>
        <br />
        New here? <Link href={`/signup?next=${encodeURIComponent(next)}`}>Create an account</Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, onSubmit, pending] = useAccountForm(requestPasswordReset);
  if (state?.ok)
    return (
      <div className="auth-form">
        <p className="lead" role="status">
          {state.message}
        </p>
        <p className="legal">
          Nothing arrived? Check your spam folder, or <Link href="/forgot-password">try again</Link>.
        </p>
      </div>
    );
  return (
    <form className="order-form auth-form" onSubmit={onSubmit}>
      <Field name="email" label="Email" type="email" state={state} autoComplete="email" required full />
      <Status state={state} />
      <button className="btn btn-fill" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Email me a reset link"}
      </button>
      <p className="legal">
        Remembered it? <Link href="/login">Log in</Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, onSubmit, pending] = useAccountForm(resetPassword);
  return (
    <form className="order-form auth-form" onSubmit={onSubmit}>
      <input type="hidden" name="token" value={token} />
      <PasswordField
        name="password"
        label="New password"
        state={state}
        autoComplete="new-password"
        required
        minLength={8}
        full
        hint="At least 8 characters."
      />
      <PasswordField name="confirm" label="Type it again" state={state} autoComplete="new-password" required full />
      <Status state={state} />
      <button className="btn btn-fill" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}

type Details = {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  whatsappOptIn: boolean;
};

export function DetailsForm({ d }: { d: Details }) {
  const [state, onSubmit, pending] = useAccountForm(updateDetails);
  return (
    <form className="order-form acct-grid" onSubmit={onSubmit} noValidate>
      <Field name="name" label="Full name" state={state} autoComplete="name" defaultValue={d.name} required full />
      <Field name="phone" label="Mobile" type="tel" state={state} autoComplete="tel" defaultValue={d.phone} />
      <Field name="pincode" label="Pincode" state={state} autoComplete="postal-code" defaultValue={d.pincode} />
      <Field
        name="address"
        label="Street address"
        state={state}
        autoComplete="street-address"
        defaultValue={d.address}
        full
      />
      <Field name="city" label="City" state={state} autoComplete="address-level2" defaultValue={d.city} />
      <Field name="state" label="State" state={state} autoComplete="address-level1" defaultValue={d.state} />
      <label className="full chk">
        <input type="checkbox" name="whatsappOptIn" defaultChecked={d.whatsappOptIn} />
        <span>Send order updates and offers on WhatsApp</span>
      </label>
      <Status state={state} />
      <button className="btn btn-fill" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save details"}
      </button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, onSubmit, pending] = useAccountForm(changePassword);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);
  return (
    <form className="order-form auth-form" onSubmit={onSubmit} ref={form}>
      <PasswordField name="current" label="Current password" state={state} autoComplete="current-password" required full />
      <PasswordField
        name="password"
        label="New password"
        state={state}
        autoComplete="new-password"
        required
        minLength={8}
        full
        hint="At least 8 characters."
      />
      <PasswordField name="confirm" label="Type it again" state={state} autoComplete="new-password" required full />
      <Status state={state} />
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}

export function ResendVerifyButton() {
  const [msg, setMsg] = useState<AccountFormResult | null>(null);
  const [pending, start] = useTransition();
  return (
    <>
      <button
        className="btn btn-ghost"
        type="button"
        disabled={pending}
        onClick={() => start(async () => setMsg(await resendVerification()))}
      >
        {pending ? "Sending…" : "Send the link again"}
      </button>
      <Status state={msg} />
    </>
  );
}

export function CustomerLogoutButton() {
  return (
    <form action={logOut}>
      <button className="btn btn-ghost" type="submit">
        Log out
      </button>
    </form>
  );
}
