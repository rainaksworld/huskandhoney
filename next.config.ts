import type { NextConfig } from "next";

/** Old static-site URLs → new routes, so shared links keep working. */
const legacy: [string, string][] = [
  ["/index.html", "/"],
  ["/shop.html", "/shop"],
  ["/find.html", "/find"],
  ["/brew.html", "/brew"],
  ["/story.html", "/story"],
  ["/cafe.html", "/cafe"],
  ["/contact.html", "/contact"],
  ["/faq.html", "/faq"],
  ["/shipping.html", "/shipping"],
  ["/returns.html", "/returns"],
  ["/privacy.html", "/privacy"],
  ["/terms.html", "/terms"],
  ["/arabica-01.html", "/coffee/arabica-01"],
  ["/arabica-02.html", "/coffee/arabica-02"],
  ["/kit-french-press.html", "/kits/kit-french-press"],
  ["/kit-v60.html", "/kits/kit-v60"],
  ["/kit-moka-pot.html", "/kits/kit-moka-pot"],
];

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  serverExternalPackages: ["@electric-sql/pglite"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      ...legacy.map(([source, destination]) => ({ source, destination, permanent: true })),
      { source: "/eq-:slug.html", destination: "/equipment/:slug", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
