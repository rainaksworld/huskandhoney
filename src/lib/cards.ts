import { COFFEES, COFFEE_PRICE, EQUIPMENT, HOUSE_BLEND, KITS, formatINR } from "./catalogue";
import { BAG_IMAGE } from "./bag-images";
import type { CardData } from "@/components/product/ProductCard";

export function shopCards(): CardData[] {
  return [
    ...COFFEES.map<CardData>((c) => ({
      slug: c.slug,
      href: `/coffee/${c.slug}`,
      cat: "coffee",
      tile: "blue",
      tag: "Coffee",
      name: c.name,
      line: c.line,
      price: `From ${formatINR(COFFEE_PRICE["250"])}`,
      // Shop cards show the medium roast by default - it's each coffee's
      // default selection on its own product page too.
      image: BAG_IMAGE.medium,
    })),
    {
      slug: HOUSE_BLEND.slug,
      href: null,
      cat: "coffee",
      tile: "blue",
      tag: "Coffee",
      name: HOUSE_BLEND.name,
      line: HOUSE_BLEND.line,
      price: null,
      soon: true,
    },
    ...KITS.map<CardData>((k) => ({
      slug: k.slug,
      href: `/kits/${k.slug}`,
      cat: "kits",
      tile: "olive",
      tag: "Starter kit",
      name: k.name,
      line: k.line,
      price: k.price === null ? "Price at launch" : formatINR(k.price),
    })),
    ...EQUIPMENT.map<CardData>((e) => ({
      slug: e.slug,
      href: `/equipment/${e.slug}`,
      cat: "equipment",
      tile: "",
      tag: e.category,
      name: e.name,
      line: e.price === null ? "Details and price coming soon." : "",
      price: e.price === null ? null : formatINR(e.price),
    })),
  ];
}
