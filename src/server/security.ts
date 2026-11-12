import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";

/* ------------------------------------------------------------------ */
/* Simple per-IP rate limit (single server process, e.g. one VPS).     */
/* ------------------------------------------------------------------ */

const buckets = new Map<string, { n: number; reset: number }>();

export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
}

/** Returns true when the caller is within `limit` requests per `windowMs`. */
export async function allow(name: string, limit: number, windowMs: number) {
  const key = `${name}:${await clientIp()}`;
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    return true;
  }
  b.n += 1;
  return b.n <= limit;
}

/* ------------------------------------------------------------------ */
/* Owner admin session                                                 */
/* ------------------------------------------------------------------ */

const ADMIN_COOKIE = "hh_admin";
const SESSION_HOURS = 12;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be set (32+ chars)");
  return "dev-only-session-secret-change-me-0000";
}

function sign(v: string) {
  return createHmac("sha256", secret()).update(v).digest("base64url");
}

function eq(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function adminEnabled() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 10);
}

export function checkAdminPassword(pw: string) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  return eq(sign(`pw:${pw}`), sign(`pw:${real}`));
}

export async function startAdminSession() {
  const exp = String(Date.now() + SESSION_HOURS * 3600_000);
  (await cookies()).set(ADMIN_COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function endAdminSession() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
}

export async function isAdmin() {
  if (!adminEnabled()) return false;
  const v = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!v) return false;
  const [exp, sig] = v.split(".");
  if (!exp || !sig || !eq(sig, sign(exp))) return false;
  return Number(exp) > Date.now();
}
