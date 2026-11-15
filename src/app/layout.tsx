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
  // No pinch or double-tap zoom on phones (Android honours these; iPhones
  // also need the gesture listener in noZoomScript below).
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

/**
 * Blocks zooming wherever the browser lets a page do so: iPhone pinch
 * (gesture events, which ignore user-scalable=no), two-finger pinch on touch
 * screens, Ctrl/Cmd + plus/minus/0 and Ctrl + scroll / trackpad pinch on
 * computers. The browser's own menu zoom can't be blocked by any website.
 */
const noZoomScript = `(function(){var o={passive:false};function no(e){e.preventDefault()}
document.addEventListener('gesturestart',no,o);document.addEventListener('gesturechange',no,o);document.addEventListener('gestureend',no,o);
document.addEventListener('touchmove',function(e){if(e.touches&&e.touches.length>1)e.preventDefault()},o);
document.addEventListener('wheel',function(e){if(e.ctrlKey)e.preventDefault()},o);
document.addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&['+','=','-','_','0'].indexOf(e.key)>-1)e.preventDefault()});})();`;

/** Runs before first paint: mark the Android admin app (so the shop chrome can be hidden), and show the logo loading screen only once per visit. */
const bootScript = `try{if(navigator.userAgent.indexOf('HuskHoneyAdminApp')>-1)document.documentElement.classList.add('hh-app')}catch(e){}try{if(sessionStorage.getItem('hh_boot'))document.documentElement.classList.add('hh-seen');else sessionStorage.setItem('hh_boot','1')}catch(e){document.documentElement.classList.add('hh-seen')}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <script dangerouslySetInnerHTML={{ __html: noZoomScript }} />
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
