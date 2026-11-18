import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { consumeOAuthState, googleEnabled, googleProfile } from "@/server/oauth";
import { findOrCreateSocialUser, startSession } from "@/server/accounts";

export async function GET(req: NextRequest) {
  if (!googleEnabled()) return new Response("Google sign-in isn't set up yet.", { status: 404 });
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const failed = (why: string) => redirect(`/login?error=${encodeURIComponent(why)}`);

  if (!code || !state) failed("google_cancelled");
  const payload = await consumeOAuthState("google", state!);
  if (!payload || !payload.verifier) failed("google_state");

  try {
    const profile = await googleProfile(code!, payload!.verifier!);
    const user = await findOrCreateSocialUser("google", profile.id, profile.email, profile.name);
    if (!user) failed("google_account");
    await startSession(user!.id);
  } catch (err) {
    console.error("[auth/google]", err);
    failed("google_failed");
  }
  redirect(payload!.next);
}
