import "server-only";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, desc, eq, gt, isNull, ne, or, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, schema } from "./db";

/* ------------------------------------------------------------------ */
/* Passwords: scrypt, stored as scrypt$<salt>$<hash> (base64url).       */
/* ------------------------------------------------------------------ */

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const KEYLEN = 64;

export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(pw.normalize("NFKC"), salt, KEYLEN);
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export async function verifyPassword(pw: string, stored: string) {
  const [alg, saltB64, hashB64] = stored.split("$");
  if (alg !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64url");
  const actual = await scrypt(pw.normalize("NFKC"), Buffer.from(saltB64, "base64url"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Used when no account matches, so a wrong email takes as long as a wrong password. */
let dummyHash: Promise<string> | null = null;
export async function burnPasswordCheck(pw: string) {
  dummyHash ??= hashPassword("not-a-real-password-just-for-timing");
  await verifyPassword(pw, await dummyHash);
}

/* ------------------------------------------------------------------ */
/* Sessions: random token in an httpOnly cookie, sha256 of it in the DB. */
/* ------------------------------------------------------------------ */

const COOKIE = "hh_session";
const SESSION_DAYS = 30;
const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

export async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const db = await getDb();
  await db.insert(schema.sessions).values({
    id: sha256(token),
    userId,
    expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000),
  });
  await db.update(schema.users).set({ lastLoginAt: sql`now()` }).where(eq(schema.users.id, userId));
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
}

async function currentSessionId() {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? sha256(token) : null;
}

export async function endSession() {
  const id = await currentSessionId();
  if (id) {
    const db = await getDb();
    await db.delete(schema.sessions).where(eq(schema.sessions.id, id));
  }
  (await cookies()).delete({ name: COOKIE, path: "/" });
}

/** Signs the user out everywhere except (optionally) this browser. */
export async function endOtherSessions(userId: string, keepCurrent: boolean) {
  const db = await getDb();
  const current = keepCurrent ? await currentSessionId() : null;
  await db
    .delete(schema.sessions)
    .where(
      current
        ? and(eq(schema.sessions.userId, userId), ne(schema.sessions.id, current))
        : eq(schema.sessions.userId, userId),
    );
}

export type Account = {
  id: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  emailVerified: boolean;
  whatsappOptIn: boolean;
  /** False for an account made by an emailed code, Google or Facebook that never set one. */
  hasPassword: boolean;
  createdAt: Date;
};

/** The logged-in customer, or null. Never cached: always a fresh request read. */
export async function getCurrentUser(): Promise<Account | null> {
  const id = await currentSessionId();
  if (!id) return null;
  const db = await getDb();
  const u = schema.users;
  const [row] = await db
    .select({
      id: u.id,
      email: u.email,
      name: u.name,
      phone: u.phone,
      address: u.address,
      city: u.city,
      state: u.state,
      pincode: u.pincode,
      emailVerifiedAt: u.emailVerifiedAt,
      whatsappOptIn: u.whatsappOptIn,
      passwordHash: u.passwordHash,
      createdAt: u.createdAt,
    })
    .from(schema.sessions)
    .innerJoin(u, eq(u.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, id), gt(schema.sessions.expiresAt, sql`now()`)));
  if (!row) return null;
  const { emailVerifiedAt, passwordHash, ...rest } = row;
  return { ...rest, emailVerified: Boolean(emailVerifiedAt), hasPassword: passwordHash !== "" };
}

/** For account pages: the user, or off to the login page (and back here after). */
export async function requireUser(returnTo = "/account") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

/** Only same-site paths are allowed as a post-login destination. */
export function safeNext(v: unknown, fallback = "/account") {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : fallback;
}

/* ------------------------------------------------------------------ */
/* One-time email links                                                */
/* ------------------------------------------------------------------ */

const TOKEN_TTL = { verify: 7 * 86_400_000, reset: 3_600_000 } as const;

export async function createAuthToken(userId: string, kind: "verify" | "reset") {
  const token = randomBytes(32).toString("base64url");
  const db = await getDb();
  // A new link replaces any earlier unused one of the same kind.
  await db
    .update(schema.authTokens)
    .set({ usedAt: sql`now()` })
    .where(
      and(eq(schema.authTokens.userId, userId), eq(schema.authTokens.kind, kind), isNull(schema.authTokens.usedAt)),
    );
  await db.insert(schema.authTokens).values({
    id: sha256(token),
    userId,
    kind,
    expiresAt: new Date(Date.now() + TOKEN_TTL[kind]),
  });
  return token;
}

/** Uses up a link and returns its user id, or null if it's wrong, used or expired. */
export async function consumeAuthToken(token: string, kind: "verify" | "reset") {
  if (!token || token.length > 100) return null;
  const db = await getDb();
  const t = schema.authTokens;
  const [row] = await db
    .update(t)
    .set({ usedAt: sql`now()` })
    .where(and(eq(t.id, sha256(token)), eq(t.kind, kind), isNull(t.usedAt), gt(t.expiresAt, sql`now()`)))
    .returning({ userId: t.userId });
  return row?.userId ?? null;
}

/** Checks a link without using it up (to show the reset form only for a live link). */
export async function peekAuthToken(token: string, kind: "verify" | "reset") {
  if (!token || token.length > 100) return false;
  const db = await getDb();
  const t = schema.authTokens;
  const [row] = await db
    .select({ id: t.id })
    .from(t)
    .where(and(eq(t.id, sha256(token)), eq(t.kind, kind), isNull(t.usedAt), gt(t.expiresAt, sql`now()`)));
  return Boolean(row);
}

/* ------------------------------------------------------------------ */
/* Lookups                                                              */
/* ------------------------------------------------------------------ */

export async function findUserByEmail(email: string) {
  const db = await getDb();
  const [row] = await db.select().from(schema.users).where(eq(schema.users.email, email.trim().toLowerCase()));
  return row ?? null;
}

/**
 * A customer's orders: everything placed while logged in, plus guest
 * orders under the same email - but only once the email is verified, so
 * signing up with someone else's address never reveals their orders.
 */
export async function ordersForUser(user: Account) {
  const db = await getDb();
  const o = schema.orders;
  const mine = user.emailVerified ? or(eq(o.userId, user.id), eq(o.email, user.email)) : eq(o.userId, user.id);
  return db
    .select()
    .from(o)
    .where(and(mine, sql`${o.paidAt} is not null`))
    .orderBy(desc(o.createdAt));
}

/* ------------------------------------------------------------------ */
/* Email sign-in codes (no password needed)                            */
/* ------------------------------------------------------------------ */

const CODE_TTL_MS = 10 * 60_000;
const CODE_MAX_ATTEMPTS = 6;

/** Six random digits, as a string so a leading zero is kept. */
function randomCode() {
  return String(randomBytes(4).readUInt32BE() % 1_000_000).padStart(6, "0");
}

/** Creates and emails a fresh sign-in code, replacing any earlier unused one. */
export async function requestLoginCode(email: string) {
  const db = await getDb();
  const clean = email.trim().toLowerCase();
  await db.update(schema.loginCodes).set({ usedAt: sql`now()` }).where(and(eq(schema.loginCodes.email, clean), isNull(schema.loginCodes.usedAt)));
  const code = randomCode();
  await db.insert(schema.loginCodes).values({
    email: clean,
    codeHash: sha256(code),
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  });
  return code;
}

export type LoginCodeResult = { ok: true; userId: string; isNewUser: boolean } | { ok: false; message: string };

/**
 * Checks a code and, if it's right, signs the visitor in - creating the
 * account on the spot if this is the first time this email has been seen.
 * An account made this way starts with no password (passwordHash "") and
 * a confirmed email, since receiving the code proves the address.
 */
export async function verifyLoginCode(email: string, codeInput: string): Promise<LoginCodeResult> {
  const db = await getDb();
  const clean = email.trim().toLowerCase();
  const c = schema.loginCodes;
  const [row] = await db
    .select()
    .from(c)
    .where(and(eq(c.email, clean), isNull(c.usedAt), gt(c.expiresAt, sql`now()`)))
    .orderBy(desc(c.createdAt))
    .limit(1);
  if (!row) return { ok: false, message: "That code has expired. Request a new one." };
  if (row.attempts >= CODE_MAX_ATTEMPTS) {
    await db.update(c).set({ usedAt: sql`now()` }).where(eq(c.id, row.id));
    return { ok: false, message: "Too many wrong tries. Request a new code." };
  }
  if (sha256(codeInput.trim()) !== row.codeHash) {
    await db.update(c).set({ attempts: row.attempts + 1 }).where(eq(c.id, row.id));
    return { ok: false, message: "That code isn't right. Please check and try again." };
  }
  await db.update(c).set({ usedAt: sql`now()` }).where(eq(c.id, row.id));

  const existing = await findUserByEmail(clean);
  if (existing) {
    if (!existing.emailVerifiedAt) await db.update(schema.users).set({ emailVerifiedAt: sql`now()` }).where(eq(schema.users.id, existing.id));
    return { ok: true, userId: existing.id, isNewUser: false };
  }
  const [user] = await db
    .insert(schema.users)
    .values({ email: clean, name: "", passwordHash: "", emailVerifiedAt: sql`now()` })
    .onConflictDoNothing()
    .returning();
  if (user) return { ok: true, userId: user.id, isNewUser: true };
  // Someone else's request created the account a moment ago - just sign in.
  const row2 = await findUserByEmail(clean);
  if (row2) return { ok: true, userId: row2.id, isNewUser: false };
  return { ok: false, message: "Something went wrong. Please try again." };
}

/* ------------------------------------------------------------------ */
/* Google / Facebook sign-in - find or create by email, link by provider id */
/* ------------------------------------------------------------------ */

/**
 * One account per email: if this Google/Facebook id is already linked, use
 * that account; otherwise find or create by email and attach the id. This
 * is how a customer who signed up with a password, then later taps
 * "Continue with Google" using the same address, ends up as one account.
 */
export async function findOrCreateSocialUser(
  provider: "google" | "facebook",
  providerId: string,
  email: string,
  name?: string,
) {
  const db = await getDb();
  const clean = email.trim().toLowerCase();
  const col = provider === "google" ? schema.users.googleId : schema.users.facebookId;

  const [byProvider] = await db.select().from(schema.users).where(eq(col, providerId));
  if (byProvider) return byProvider;

  const byEmail = await findUserByEmail(clean);
  if (byEmail) {
    const [updated] = await db
      .update(schema.users)
      .set({ [provider === "google" ? "googleId" : "facebookId"]: providerId, emailVerifiedAt: byEmail.emailVerifiedAt ?? sql`now()`, updatedAt: sql`now()` })
      .where(eq(schema.users.id, byEmail.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(schema.users)
    .values({
      email: clean,
      name: name ?? "",
      passwordHash: "",
      emailVerifiedAt: sql`now()`,
      [provider === "google" ? "googleId" : "facebookId"]: providerId,
    })
    .onConflictDoNothing()
    .returning();
  if (created) return created;
  // A parallel request (or a plain email sign-up) won the race - try again.
  return (await findUserByEmail(clean)) ?? byEmail;
}
