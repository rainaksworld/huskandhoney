import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { consumeOAuthState, facebookEnabled, facebookProfile } from "@/server/oauth";
import { findOrCreateSocialUser, startSession } from "@/server/accounts";

export async function GET(req: NextRequest) {
  if (!facebookEnabled()) return new Response("Facebook sign-in isn't set up yet.", { status: 404 });
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const failed = (why: string) => redirect(`/login?error=${encodeURIComponent(why)}`);

  if (!code || !state) failed("facebook_cancelled");
  const payload = await consumeOAuthState("facebook", state!);
  if (!payload) failed("facebook_state");

  try {
    const profile = await facebookProfile(code!);
    const user = await findOrCreateSocialUser("facebook", profile.id, profile.email, profile.name);
    if (!user) failed("facebook_account");
    await startSession(user!.id);
  } catch (err) {
    console.error("[auth/facebook]", err);
    failed("facebook_failed");
  }
  redirect(payload!.next);
}
