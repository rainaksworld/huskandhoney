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
      createdAt: u.createdAt,
    })
    .from(schema.sessions)
    .innerJoin(u, eq(u.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, id), gt(schema.sessions.expiresAt, sql`now()`)));
  if (!row) return null;
  const { emailVerifiedAt, ...rest } = row;
  return { ...rest, emailVerified: Boolean(emailVerifiedAt) };
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
