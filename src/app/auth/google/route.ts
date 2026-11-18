import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { googleAuthorizeUrl, googleEnabled, pkceChallenge, startOAuthState } from "@/server/oauth";
import { safeNext } from "@/server/accounts";

/** Starting point for "Continue with Google": sends the visitor to Google. */
export async function GET(req: NextRequest) {
  if (!googleEnabled()) return new Response("Google sign-in isn't set up yet.", { status: 404 });
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  const { state, verifier } = await startOAuthState("google", next, true);
  redirect(googleAuthorizeUrl(state, pkceChallenge(verifier!)));
}
