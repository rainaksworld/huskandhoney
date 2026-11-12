import type { Metadata } from "next";
import Link from "next/link";
import { ShopGrid } from "@/components/shop/ShopGrid";
import { shopCards } from "@/lib/cards";

export const metadata: Metadata = {
  title: "Shop",
  description: "Shop Husk & Honey coffee, starter kits and brew equipment.",
};

export default function ShopPage() {
  return (
    <section className="sec page" aria-labelledby="sh-h">
      <div className="page-head rv">
        <p className="lab dim">Shop</p>
        <h1 className="disp h2" id="sh-h">
          the full range.
        </h1>
        <p className="lead">Coffee, starter kits and equipment for brewing at home.</p>
        <div>
          <Link className="btn btn-ghost" href="/find">
            Not sure? Find your coffee
          </Link>
        </div>
      </div>
      <ShopGrid cards={shopCards()} />
      <p className="legal">Equipment shown is a placeholder range. Details, photos and prices are added at launch.</p>
    </section>
  );
}
