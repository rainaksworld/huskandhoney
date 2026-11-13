import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * "Coming soon" gate for the whole site. Controlled by the COMING_SOON env
 * var: set to "false" (or unset the var entirely) to open the real site to
 * everyone. While it's on, visitors see a single placeholder page, but
 * /admin, the API routes (needed for webhooks), and Next.js' own internal
 * assets all pass through untouched so the site can keep being built behind
 * the scenes.
 */
export function proxy(request: NextRequest) {
  const comingSoon = (process.env.COMING_SOON ?? "true").toLowerCase() !== "false";
  if (!comingSoon) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const allowed =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/img") ||
    pathname.startsWith("/fonts");
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
    font-family: Georgia, "Times New Roman", serif;
    text-align: center;
  }
  .wrap { max-width: 560px; }
  h1 {
    font-size: clamp(2rem, 6vw, 3rem);
    margin: 0 0 16px;
    letter-spacing: 0.02em;
    color: #4b682f;
  }
  p {
    font-family: Helvetica, Arial, sans-serif;
    font-size: 1.05rem;
    line-height: 1.6;
    color: #1e2a15;
    opacity: 0.85;
    margin: 0 0 8px;
  }
  .rule {
    width: 64px;
    height: 2px;
    background: #0f1a2e;
    opacity: 0.25;
    margin: 28px auto;
  }
  .small {
    font-family: Helvetica, Arial, sans-serif;
    font-size: 0.85rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.6;
  }
</style>
</head>
<body>
  <div class="wrap">
    <p class="small">Husk &amp; Honey</p>
    <h1>Brewing something good.</h1>
    <p>Our Himalayan coffee, grown and roasted near Siliguri, is on its way online.</p>
    <div class="rule"></div>
    <p class="small">Check back soon</p>
  </div>
</body>
</html>`;
