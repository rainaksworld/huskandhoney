import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fraunces, montserrat } from "./fonts";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Enhancements } from "@/components/site/Enhancements";
import { Sprites } from "@/components/site/Sprites";

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Husk & Honey", template: "%s | Husk & Honey" },
  description:
    "Husk & Honey is a Himalayan coffee brand from Siliguri. Shop coffee, starter kits and brew equipment.",
  openGraph: {
    siteName: "Husk & Honey",
    type: "website",
    locale: "en_IN",
    images: [{ url: "/img/kits.jpg", width: 1076, height: 717, alt: "Husk & Honey coffee bags" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#F6EEDF",
  viewportFit: "cover",
};

/** Runs before first paint: show the logo loading screen only once per visit. */
const bootScript = `try{if(sessionStorage.getItem('hh_boot'))document.documentElement.classList.add('hh-seen');else sessionStorage.setItem('hh_boot','1')}catch(e){document.documentElement.classList.add('hh-seen')}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <div className="boot" aria-hidden="true">
          <div className="boot-logo" />
        </div>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <Sprites />
        <CartProvider>
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
        <Enhancements />
      </body>
    </html>
  );
}
