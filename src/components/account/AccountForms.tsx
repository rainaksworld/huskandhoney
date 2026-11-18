"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  changePassword,
  logIn,
  logOut,
  requestEmailCode,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  signUp,
  submitEmailCode,
  updateDetails,
  type AccountFormResult,
  type EmailCodeResult,
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

function GoogleG() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function FacebookF() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#fff" d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.5 1.6-1.5h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.3H7.4V14h2.8v8z" />
    </svg>
  );
}

/** "Continue with Google / Facebook" - absent entirely when a provider isn't configured. */
export function SocialButtons({ next, google, facebook }: { next: string; google: boolean; facebook: boolean }) {
  if (!google && !facebook) return null;
  const q = `?next=${encodeURIComponent(next)}`;
  return (
    <div className="social">
      {google && (
        <a className="social-btn" href={`/auth/google${q}`}>
          <GoogleG />
          Continue with Google
        </a>
      )}
      {facebook && (
        <a className="social-btn fb" href={`/auth/facebook${q}`}>
          <FacebookF />
          Continue with Facebook
        </a>
      )}
      <p className="or-line">or with your email</p>
    </div>
  );
}

/** Six boxes that behave like one 6-digit field: typing, backspace, and pasting a whole code all work. */
function OtpBoxes({ value, onChange, autoFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  const setAt = (i: number, d: string) => {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join(""));
  };

  return (
    <div className="otp" role="group" aria-label="6-digit code">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          autoFocus={autoFocus && i === 0}
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={d}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            if (!v) {
              setAt(i, "");
              return;
            }
            setAt(i, v.slice(-1));
            refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i]) refs.current[i - 1]?.focus();
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
            if (!text) return;
            e.preventDefault();
            onChange(text.padEnd(value.length, ""));
            refs.current[Math.min(text.length, 5)]?.focus();
          }}
        />
      ))}
    </div>
  );
}

const RESEND_SECONDS = 30;

/** "Email me a code": emails a 6-digit code, then checks it - no password involved. */
function EmailCodeTab({ next }: { next: string }) {
  const [sendState, sendAction, sending] = useActionState<EmailCodeResult | null, FormData>(requestEmailCode, null);
  const [verifyState, verifyAction, verifying] = useActionState<AccountFormResult | null, FormData>(submitEmailCode, null);
  const [emailVal, setEmailVal] = useState("");
  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const sent = Boolean(sendState?.sent);
  const endAt = useRef(0);

  useEffect(() => {
    if (!sent) return;
    endAt.current = Date.now() + RESEND_SECONDS * 1000;
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000)));
    queueMicrotask(tick);
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [sent, sendState]);

  if (!sent) {
    return (
      <form
        className="order-form auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setEmailVal(String(fd.get("email") ?? ""));
          sendAction(fd);
        }}
      >
        <Field name="email" label="Email" type="email" state={sendState} autoComplete="email" required full />
        <Status state={sendState} />
        <button className="btn btn-fill" type="submit" disabled={sending}>
          {sending ? "Sending…" : "Send me a code"}
        </button>
        <p className="auth-note">No password needed. We email a 6-digit code that works for 10 minutes.</p>
        <p className="legal">New here? An account is made for you the first time you sign in.</p>
      </form>
    );
  }

  return (
    <form
      className="order-form auth-form"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.set("email", emailVal);
        fd.set("code", code);
        fd.set("next", next);
        verifyAction(fd);
      }}
    >
      <p className="otp-step">
        <i>2</i>Check your email
      </p>
      <p className="lead" style={{ fontSize: 16, maxWidth: "none" }}>
        We sent a 6-digit code to <b>{emailVal}</b>. Type it below.
      </p>
      <OtpBoxes value={code} onChange={setCode} autoFocus />
      {verifyState?.fieldErrors?.code && (
        <p className="field-err" role="alert">
          {verifyState.fieldErrors.code}
        </p>
      )}
      <button className="btn btn-fill" type="submit" disabled={verifying || code.length !== 6}>
        {verifying ? "Signing in…" : "Sign in"}
      </button>
      <p className="otp-foot">
        <span>
          Didn&apos;t get it?{" "}
          <button
            type="button"
            disabled={secondsLeft > 0 || sending}
            onClick={() => {
              const fd = new FormData();
              fd.set("email", emailVal);
              sendAction(fd);
              setCode("");
            }}
          >
            {secondsLeft > 0 ? `Resend in 0:${String(secondsLeft).padStart(2, "0")}` : "Resend"}
          </button>
        </span>
        <button type="button" onClick={() => window.location.reload()}>
          Use a different email
        </button>
      </p>
    </form>
  );
}

export function CustomerLoginForm({
  next,
  google = false,
  facebook = false,
}: {
  next: string;
  google?: boolean;
  facebook?: boolean;
}) {
  const [state, onSubmit, pending] = useAccountForm(logIn);
  const [tab, setTab] = useState<"code" | "password">("code");

  return (
    <div className="auth-wrap">
      <SocialButtons next={next} google={google} facebook={facebook} />
      <div className="seg" role="tablist" aria-label="Sign in with">
        <button type="button" role="tab" aria-selected={tab === "code"} onClick={() => setTab("code")}>
          Email me a code
        </button>
        <button type="button" role="tab" aria-selected={tab === "password"} onClick={() => setTab("password")}>
          Use a password
        </button>
      </div>

      {tab === "code" ? (
        <EmailCodeTab next={next} />
      ) : (
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
      )}
    </div>
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

export function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, onSubmit, pending] = useAccountForm(changePassword);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);
  return (
    <form className="order-form auth-form" onSubmit={onSubmit} ref={form}>
      {!hasPassword && (
        <p className="legal full">You signed in with an emailed code or a social account, so there&apos;s no password yet.</p>
      )}
      {hasPassword && (
        <PasswordField name="current" label="Current password" state={state} autoComplete="current-password" required full />
      )}
      <PasswordField
        name="password"
        label={hasPassword ? "New password" : "Set a password"}
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
        {pending ? "Saving…" : hasPassword ? "Change password" : "Set password"}
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
