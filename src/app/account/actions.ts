"use server";

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/server/db";
import { allow } from "@/server/security";
import {
  burnPasswordCheck,
  consumeAuthToken,
  createAuthToken,
  endOtherSessions,
  endSession,
  findUserByEmail,
  getCurrentUser,
  hashPassword,
  requestLoginCode,
  safeNext,
  startSession,
  verifyLoginCode,
  verifyPassword,
} from "@/server/accounts";
import { sendLoginCodeEmail, sendPasswordResetEmail, sendVerifyEmail, sendWelcomeEmail } from "@/server/email";

export type AccountFormResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(120);
const password = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(200, "That password is too long");
const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => v === "" || /^(\+91)?[6-9]\d{9}$/.test(v), "Enter a 10-digit Indian mobile number");

function errors(issues: z.ZodIssue[]) {
  const out: Record<string, string> = {};
  for (const i of issues) out[String(i.path[0] ?? "form")] ??= i.message;
  return out;
}
const checked = (form: FormData, name: string) => form.get(name) === "on";

/* ------------------------------------------------------------------ */
/* Sign up / log in / log out                                           */
/* ------------------------------------------------------------------ */

const SignUpSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email,
  phone,
  password,
});

export async function signUp(_: AccountFormResult | null, form: FormData): Promise<AccountFormResult> {
  if (String(form.get("website") ?? "")) return { ok: false, message: "Something went wrong." }; // honeypot
  const parsed = SignUpSchema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    phone: form.get("phone") ?? "",
    password: form.get("password"),
  });
  if (!parsed.success)
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: errors(parsed.error.issues) };
  if (!(await allow("signup", 6, 15 * 60_000)))
    return { ok: false, message: "Too many attempts. Please wait a few minutes." };

  const d = parsed.data;
  if (await findUserByEmail(d.email))
    return {
      ok: false,
      message: "There's already an account with this email. Log in, or reset your password if you've forgotten it.",
      fieldErrors: { email: "Already registered" },
    };

  const db = await getDb();
  const [user] = await db
    .insert(schema.users)
    .values({
      email: d.email,
      name: d.name,
      phone: d.phone,
      passwordHash: await hashPassword(d.password),
      whatsappOptIn: checked(form, "whatsappOptIn"),
    })
    .onConflictDoNothing()
    .returning();
  if (!user) return { ok: false, message: "There's already an account with this email. Please log in." };

  await startSession(user.id);
  await sendWelcomeEmail(user, await createAuthToken(user.id, "verify"));
  redirect(safeNext(form.get("next")));
}

export async function logIn(_: AccountFormResult | null, form: FormData): Promise<AccountFormResult> {
  const parsed = z.object({ email, password: z.string().min(1).max(200) }).safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });
  const wrong = { ok: false, message: "That email and password don't match. Please try again." };
  if (!parsed.success) return wrong;
  if (!(await allow("login", 10, 15 * 60_000)))
    return { ok: false, message: "Too many attempts. Please wait a few minutes." };

  const user = await findUserByEmail(parsed.data.email);
  if (!user) {
    await burnPasswordCheck(parsed.data.password);
    return wrong;
  }
  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) return wrong;

  await startSession(user.id);
  redirect(safeNext(form.get("next")));
}

export async function logOut() {
  await endSession();
  redirect("/");
}

/* ------------------------------------------------------------------ */
/* Email verification and password reset                               */
/* ------------------------------------------------------------------ */

export async function resendVerification(): Promise<AccountFormResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please log in again." };
  if (user.emailVerified) return { ok: true, message: "Your email is already confirmed." };
  if (!(await allow("resend-verify", 3, 15 * 60_000)))
    return { ok: false, message: "We've just sent one. Please check your inbox (and spam) first." };
  await sendVerifyEmail(user, await createAuthToken(user.id, "verify"));
  return { ok: true, message: `We've sent a new link to ${user.email}.` };
}

export async function requestPasswordReset(_: AccountFormResult | null, form: FormData): Promise<AccountFormResult> {
  const parsed = email.safeParse(form.get("email"));
  if (!parsed.success) return { ok: false, message: "Enter a valid email address.", fieldErrors: { email: "Enter a valid email address" } };
  // Same answer whether or not the account exists, so this can't be used
  // to find out who has an account.
  const done = {
    ok: true,
    message: `If there's an account for ${parsed.data}, we've emailed it a link to reset the password. It works for 1 hour.`,
  };
  if (!(await allow("reset-request", 5, 15 * 60_000))) return done;
  const user = await findUserByEmail(parsed.data);
  if (user) await sendPasswordResetEmail(user, await createAuthToken(user.id, "reset"));
  return done;
}

export async function resetPassword(_: AccountFormResult | null, form: FormData): Promise<AccountFormResult> {
  const parsed = z
    .object({ token: z.string().min(10).max(100), password, confirm: z.string() })
    .refine((v) => v.password === v.confirm, { message: "The two passwords don't match", path: ["confirm"] })
    .safeParse({ token: form.get("token"), password: form.get("password"), confirm: form.get("confirm") });
  if (!parsed.success)
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: errors(parsed.error.issues) };
  if (!(await allow("reset", 10, 15 * 60_000)))
    return { ok: false, message: "Too many attempts. Please wait a few minutes." };

  const userId = await consumeAuthToken(parsed.data.token, "reset");
  if (!userId) return { ok: false, message: "This reset link has expired or was already used. Please ask for a new one." };

  const db = await getDb();
  await db
    .update(schema.users)
    .set({
      passwordHash: await hashPassword(parsed.data.password),
      // They proved they can read this inbox, so the email is confirmed too.
      emailVerifiedAt: sql`coalesce(${schema.users.emailVerifiedAt}, now())`,
      updatedAt: sql`now()`,
    })
    .where(eq(schema.users.id, userId));
  await endOtherSessions(userId, false); // anyone else who was logged in is signed out
  await startSession(userId);
  redirect("/account?reset=1");
}

/* ------------------------------------------------------------------ */
/* Account details                                                      */
/* ------------------------------------------------------------------ */

const DetailsSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone,
  address: z.string().trim().max(300),
  city: z.string().trim().max(60),
  state: z.string().trim().max(60),
  pincode: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[1-9]\d{5}$/.test(v), "Enter a 6-digit pincode"),
});

export async function updateDetails(_: AccountFormResult | null, form: FormData): Promise<AccountFormResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please log in again." };
  const parsed = DetailsSchema.safeParse({
    name: form.get("name"),
    phone: form.get("phone") ?? "",
    address: form.get("address") ?? "",
    city: form.get("city") ?? "",
    state: form.get("state") ?? "",
    pincode: form.get("pincode") ?? "",
  });
  if (!parsed.success)
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: errors(parsed.error.issues) };

  const db = await getDb();
  await db
    .update(schema.users)
    .set({ ...parsed.data, whatsappOptIn: checked(form, "whatsappOptIn"), updatedAt: sql`now()` })
    .where(eq(schema.users.id, user.id));
  return { ok: true, message: "Saved." };
}

export async function changePassword(_: AccountFormResult | null, form: FormData): Promise<AccountFormResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please log in again." };
  const row = await findUserByEmail(user.email);
  if (!row) return { ok: false, message: "Please log in again." };
  // An account made by an emailed code, Google or Facebook has no password
  // yet - this sets one for the first time, so there's no "current" to check.
  const hasPassword = row.passwordHash !== "";

  const parsed = z
    .object({ current: z.string().max(200).optional().default(""), password, confirm: z.string() })
    .refine((v) => v.password === v.confirm, { message: "The two passwords don't match", path: ["confirm"] })
    .safeParse({ current: form.get("current") ?? "", password: form.get("password"), confirm: form.get("confirm") });
  if (!parsed.success)
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: errors(parsed.error.issues) };
  if (!(await allow("change-password", 8, 15 * 60_000)))
    return { ok: false, message: "Too many attempts. Please wait a few minutes." };

  if (hasPassword) {
    if (!parsed.data.current) return { ok: false, message: "Enter your current password.", fieldErrors: { current: "Required" } };
    if (!(await verifyPassword(parsed.data.current, row.passwordHash)))
      return { ok: false, message: "Your current password isn't right.", fieldErrors: { current: "Not right" } };
  }

  const db = await getDb();
  await db
    .update(schema.users)
    .set({ passwordHash: await hashPassword(parsed.data.password), updatedAt: sql`now()` })
    .where(eq(schema.users.id, user.id));
  await endOtherSessions(user.id, true); // other devices are signed out, this one stays in
  return {
    ok: true,
    message: hasPassword
      ? "Password changed. Any other devices you were logged in on have been signed out."
      : "Password set. You can now log in with your email and this password too.",
  };
}

/* ------------------------------------------------------------------ */
/* Checkout                                                             */
/* ------------------------------------------------------------------ */

/** Saved details to pre-fill checkout, or null for guests. */
export async function getCheckoutPrefill() {
  const user = await getCurrentUser();
  if (!user) return null;
  const { name, email, phone, address, city, state, pincode, whatsappOptIn } = user;
  return { name, email, phone, address, city, state, pincode, whatsappOptIn };
}

/* ------------------------------------------------------------------ */
/* Email sign-in code ("email me a code")                              */
/* ------------------------------------------------------------------ */

export type EmailCodeResult = AccountFormResult & { sent?: boolean };

/** Step 1 of the code tab: emails a fresh 6-digit code. */
export async function requestEmailCode(_: EmailCodeResult | null, form: FormData): Promise<EmailCodeResult> {
  const parsed = email.safeParse(form.get("email"));
  if (!parsed.success) return { ok: false, message: "Enter a valid email address.", fieldErrors: { email: "Not a valid email" } };
  if (!(await allow("login-code-request", 6, 15 * 60_000)))
    return { ok: false, message: "Too many attempts. Please wait a few minutes." };

  const code = await requestLoginCode(parsed.data);
  await sendLoginCodeEmail(parsed.data, code);
  return { ok: true, message: `We've emailed a code to ${parsed.data}.`, sent: true };
}

/** Step 2: checks the code, signs in (making the account if it's new), and redirects. */
export async function submitEmailCode(_: AccountFormResult | null, form: FormData): Promise<AccountFormResult> {
  const parsed = z
    .object({ email, code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code") })
    .safeParse({ email: form.get("email"), code: form.get("code") });
  if (!parsed.success)
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: errors(parsed.error.issues) };
  if (!(await allow("login-code-verify", 10, 15 * 60_000)))
    return { ok: false, message: "Too many attempts. Please wait a few minutes." };

  const result = await verifyLoginCode(parsed.data.email, parsed.data.code);
  if (!result.ok) return { ok: false, message: result.message, fieldErrors: { code: result.message } };

  await startSession(result.userId);
  redirect(safeNext(form.get("next")));
}
