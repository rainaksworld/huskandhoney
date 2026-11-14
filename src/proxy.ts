import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PREVIEW_COOKIE = "hh_preview";

/**
 * "Coming soon" gate for the whole site. Controlled by the COMING_SOON env
 * var: set to "false" (or unset the var entirely) to open the real site to
 * everyone. While it's on, visitors see a single placeholder page, but
 * /admin, the API routes (needed for webhooks), and Next.js' own internal
 * assets all pass through untouched so the site can keep being built behind
 * the scenes.
 *
 * Visiting the site with ?preview=<PREVIEW_KEY> once unlocks the real site
 * for that browser (via a cookie) until COMING_SOON is turned off, so the
 * site can be reviewed and tested before launch without visitors seeing it.
 */
export function proxy(request: NextRequest) {
  const comingSoon = (process.env.COMING_SOON ?? "true").toLowerCase() !== "false";
  if (!comingSoon) return NextResponse.next();

  const previewKey = process.env.PREVIEW_KEY;
  const { pathname, searchParams } = request.nextUrl;

  if (previewKey && searchParams.get("preview") === previewKey) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("preview");
    const res = NextResponse.redirect(url);
    res.cookies.set(PREVIEW_COOKIE, previewKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return res;
  }

  const hasPreviewAccess = Boolean(previewKey) && request.cookies.get(PREVIEW_COOKIE)?.value === previewKey;
  if (hasPreviewAccess) return NextResponse.next();

  const allowed =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/img") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/fonts") ||
    pathname.startsWith("/sounds");
  if (allowed) return NextResponse.next();

  return new NextResponse(COMING_SOON_HTML, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

const COMING_SOON_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Husk &amp; Honey — Coming Soon</title>
<meta name="robots" content="noindex" />
<style>
  @font-face {
    font-family: "Fraunces";
    src: url("/fonts/fraunces.woff2") format("woff2");
    font-weight: 100 900;
    font-display: swap;
  }
  @font-face {
    font-family: "Montserrat";
    src: url("/fonts/montserrat.woff2") format("woff2");
    font-weight: 100 900;
    font-display: swap;
  }
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 24px;
    background: #f6eedf;
    color: #1e2a15;
    font-family: "Montserrat", Helvetica, Arial, sans-serif;
    text-align: center;
  }
  .wrap { max-width: 560px; }
  .logo {
    width: min(70vw, 260px);
    height: auto;
    margin: 0 auto 28px;
    display: block;
  }
  h1 {
    font-family: "Fraunces", Georgia, "Times New Roman", serif;
    font-size: clamp(2rem, 6vw, 3rem);
    font-weight: 600;
    margin: 0 0 16px;
    letter-spacing: 0.01em;
    color: #0f1a2e;
  }
  p {
    font-size: 1.05rem;
    line-height: 1.6;
    color: #1e2a15;
    opacity: 0.85;
    margin: 0 0 8px;
  }
  .rule {
    width: 64px;
    height: 2px;
    background: #678bc7;
    opacity: 0.5;
    margin: 28px auto;
  }
  .small {
    font-size: 0.8rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #678bc7;
    opacity: 0.9;
    font-weight: 600;
  }
</style>
</head>
<body>
  <div class="wrap">
    <img class="logo" src="/assets/logo-still.png" alt="Husk & Honey" />
    <h1>Brewing something good.</h1>
    <p>Our Himalayan coffee, grown and roasted near Siliguri, is on its way online.</p>
    <div class="rule"></div>
    <p class="small">Check back soon</p>
  </div>
</body>
</html>`;
