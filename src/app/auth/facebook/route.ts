import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { facebookAuthorizeUrl, facebookEnabled, startOAuthState } from "@/server/oauth";
import { safeNext } from "@/server/accounts";

/** Starting point for "Continue with Facebook": sends the visitor to Facebook. */
export async function GET(req: NextRequest) {
  if (!facebookEnabled()) return new Response("Facebook sign-in isn't set up yet.", { status: 404 });
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  const { state } = await startOAuthState("facebook", next, false);
  redirect(facebookAuthorizeUrl(state));
}
