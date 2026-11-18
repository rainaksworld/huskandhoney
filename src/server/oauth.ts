import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Google and Facebook sign-in, as plain "authorization code" OAuth - no
 * extra package needed. Each provider is simply absent (buttons hidden,
 * routes answer 404) until its two environment variables are set.
 */

function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be set (32+ chars)");
  return "dev-only-session-secret-change-me-0000";
}
const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("base64url");
const timingEq = (a: string, b: string) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
};

export function siteUrl() {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export const googleEnabled = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
export const facebookEnabled = () => Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET);

/* ------------------------------------------------------------------ */
/* CSRF state + PKCE, carried in a short-lived cookie                  */
/* ------------------------------------------------------------------ */

type StateCookie = { state: string; next: string; verifier?: string };

export async function startOAuthState(provider: "google" | "facebook", next: string, withPkce: boolean) {
  const state = randomBytes(16).toString("base64url");
  const verifier = withPkce ? randomBytes(32).toString("base64url") : undefined;
  const payload: StateCookie = { state, next, verifier };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  (await cookies()).set(`hh_oauth_${provider}`, `${body}.${sign(body)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return payload;
}

/** Reads and clears the state cookie, checking it matches what came back. */
export async function consumeOAuthState(provider: "google" | "facebook", returnedState: string) {
  const jar = await cookies();
  const raw = jar.get(`hh_oauth_${provider}`)?.value;
  jar.delete({ name: `hh_oauth_${provider}`, path: "/" });
  if (!raw) return null;
  const [body, sig] = raw.split(".");
  if (!body || !sig || !timingEq(sig, sign(body))) return null;
  let payload: StateCookie;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    return null;
  }
  if (!payload.state || !timingEq(payload.state, returnedState)) return null;
  return payload;
}

/** S256 PKCE code challenge for a verifier. */
export const pkceChallenge = (verifier: string) => createHash("sha256").update(verifier).digest("base64url");

/* ------------------------------------------------------------------ */
/* Google                                                               */
/* ------------------------------------------------------------------ */

export function googleAuthorizeUrl(state: string, challenge: string) {
  const redirectUri = `${siteUrl()}/auth/google/callback`;
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`;
}

export async function googleProfile(code: string, verifier: string) {
  const redirectUri = `${siteUrl()}/auth/google/callback`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
    cache: "no-store",
  });
  if (!tokenRes.ok) throw new Error(`google token exchange failed: ${tokenRes.status}`);
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { authorization: `Bearer ${access_token}` },
    cache: "no-store",
  });
  if (!userRes.ok) throw new Error(`google userinfo failed: ${userRes.status}`);
  const u = (await userRes.json()) as { sub: string; email?: string; email_verified?: boolean; name?: string };
  if (!u.email || !u.email_verified) throw new Error("google account has no verified email");
  return { id: u.sub, email: u.email, name: u.name ?? "" };
}

/* ------------------------------------------------------------------ */
/* Facebook                                                             */
/* ------------------------------------------------------------------ */

export function facebookAuthorizeUrl(state: string) {
  const redirectUri = `${siteUrl()}/auth/facebook/callback`;
  const p = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "email public_profile",
    state,
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${p.toString()}`;
}

export async function facebookProfile(code: string) {
  const redirectUri = `${siteUrl()}/auth/facebook/callback`;
  const p = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    client_secret: process.env.FACEBOOK_APP_SECRET!,
    code,
    redirect_uri: redirectUri,
  });
  const tokenRes = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?${p.toString()}`, { cache: "no-store" });
  if (!tokenRes.ok) throw new Error(`facebook token exchange failed: ${tokenRes.status}`);
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  const userRes = await fetch(
    `https://graph.facebook.com/v21.0/me?fields=id,name,email&access_token=${encodeURIComponent(access_token)}`,
    { cache: "no-store" },
  );
  if (!userRes.ok) throw new Error(`facebook /me failed: ${userRes.status}`);
  const u = (await userRes.json()) as { id: string; email?: string; name?: string };
  if (!u.email) throw new Error("facebook account has no email (often no email on the account, or permission not granted)");
  return { id: u.id, email: u.email, name: u.name ?? "" };
}
