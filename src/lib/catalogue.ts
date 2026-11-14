/**
 * The single source of truth for what Husk & Honey sells.
 *
 * Rules (from the brand brief):
 * - Never invent origin, specs, prices, blend ratios or tasting notes.
 *   Anything not yet supplied is `null` and the UI says so ("coming soon").
 * - Prices are whole rupees. A product with `price: null` cannot be bought;
 *   its page offers a real "notify me" sign-up instead.
 * - Stock counts live in the database (owner admin), not here.
 */

export const ROASTS = ["light", "medium", "dark"] as const;
export type Roast = (typeof ROASTS)[number];

export const GRINDS = ["whole", "espresso", "moka", "pour", "aero"] as const;
export type Grind = (typeof GRINDS)[number];

export const SIZES = ["250", "500"] as const;
export type Size = (typeof SIZES)[number];

export const ROAST_LABEL: Record<Roast, string> = {
  light: "Light roast",
  medium: "Medium roast",
  dark: "Dark roast",
};

export const GRIND_LABEL: Record<Grind, string> = {
  whole: "Whole bean",
  espresso: "Espresso",
  moka: "Moka pot",
  pour: "Pour over",
  aero: "AeroPress",
};

/** Bag colour, used for swatches and the bag preview. */
export const ROAST_SWATCH: Record<Roast, string> = {
  light: "#F1E4D3",
  medium: "#678BC7",
  dark: "#4B682F",
};

/** Coffee prices in rupees per bag size. Decided 2026-11-06; may change. */
export const COFFEE_PRICE: Record<Size, number> = { "250": 799, "500": 1299 };

export type TastingNotes = {
  description: string;
  flavour: string[];
  brewAs: string[];
  bestFor: string;
};

export type Coffee = {
  kind: "coffee";
  slug: string;
  name: string;
  estate: string;
  line: string;
  /** Per-roast notes. `null` = not supplied yet. */
  notes: Record<Roast, TastingNotes> | null;
  /** Origin facts. `null` fields are shown as "coming soon". */
  facts: {
    process: string | null;
    altitude: string | null;
    variety: string | null;
    harvest: string | null;
  };
  available: boolean;
};

const KALEBUNG_NOTES: Record<Roast, TastingNotes> = {
  light: {
    description:
      "Carefully roasted to keep the coffee’s natural character. A light brown colour, a bright and clean cup, delicate floral aromas, fruity sweetness and lively citrus-like acidity. This roast shows off the bean’s origin and terroir, for anyone who enjoys vibrant, complex, refreshing coffee.",
    flavour: ["Floral", "Citrus", "Berry", "Honey", "Bright & elegant"],
    brewAs: ["Pour over", "Filter", "AeroPress", "Cold brew"],
    bestFor:
      "People who value origin character, clarity and a refined specialty coffee.",
  },
  medium: {
    description:
      "Crafted for the balance between brightness and body. Roasted to a rich brown, it has a smooth, well-rounded character that keeps the coffee’s natural sweetness and complexity. A versatile roast, and a favourite among coffee enthusiasts.",
    flavour: [
      "Caramel",
      "Milk chocolate",
      "Roasted nuts",
      "Balanced sweetness",
      "Smooth body",
      "Clean finish",
    ],
    brewAs: ["Espresso", "Moka pot", "French press", "Drip coffee", "Pour over"],
    bestFor:
      "People who want a versatile roast with balanced sweetness, a smooth body and broad appeal.",
  },
  dark: {
    description:
      "Crafted for those who enjoy a bold, intense cup. Roasted to a deep, dark colour, it gives a rich, full-bodied cup with low acidity, pronounced roast character and a smooth, lingering finish. Balanced for a strong, satisfying brew.",
    flavour: [
      "Dark chocolate",
      "Cocoa",
      "Toasted nuts",
      "Smoky",
      "Bold body",
      "Low acidity",
    ],
    brewAs: ["Espresso", "Moka pot", "French press", "South Indian filter coffee"],
    bestFor:
      "People who like bold espresso and milk-based drinks, and a rich, intense, full-bodied cup.",
  },
};

const NO_FACTS = { process: null, altitude: null, variety: null, harvest: null };

export const COFFEES: Coffee[] = [
  {
    kind: "coffee",
    slug: "arabica-01",
    name: "Darjeeling Specialty",
    estate: "Darjeeling",
    line: "Darjeeling estate. Light, medium or dark; beans or ground.",
    notes: null,
    facts: NO_FACTS,
    available: true,
  },
  {
    kind: "coffee",
    slug: "arabica-02",
    name: "Kalebung Specialty",
    estate: "Kalebung",
    line: "Kalebung estate. Light, medium or dark; beans or ground.",
    notes: KALEBUNG_NOTES,
    facts: NO_FACTS,
    available: true,
  },
];

/** Shown as a disabled "Soon" card. Not purchasable. */
export const HOUSE_BLEND = {
  slug: "house-blend",
  name: "House Blend",
  line: "On hold for now.",
};

export type Kit = {
  kind: "kit";
  slug: string;
  key: "french" | "v60" | "moka";
  name: string;
  line: string;
  grind: Grind;
  grindNote: string;
  items: string[];
  price: number | null;
};

export const KITS: Kit[] = [
  {
    kind: "kit",
    slug: "kit-french-press",
    key: "french",
    name: "French Press Kit",
    line: "Full, rich and forgiving. Nothing to learn but the timer.",
    grind: "whole",
    grindNote: "250 g whole beans",
    items: ["French press", "H&H mug", "Coffee, 250 g whole beans"],
    price: null,
  },
  {
    kind: "kit",
    slug: "kit-v60",
    key: "v60",
    name: "V60 Kit",
    line: "Clean and bright. Slow pours and a small ritual.",
    grind: "pour",
    grindNote: "250 g, ground for pour over",
    items: [
      "V60 dripper",
      "Beaker or server",
      "Paper filters",
      "H&H mug",
      "Coffee, 250 g, ground for pour over",
    ],
    price: null,
  },
  {
    kind: "kit",
    slug: "kit-moka-pot",
    key: "moka",
    name: "Moka Pot Kit",
    line: "Strong, stovetop and simple. No power needed.",
    grind: "moka",
    grindNote: "250 g, ground for moka pot",
    items: ["Moka pot", "H&H mug", "Coffee, 250 g, ground for moka pot"],
    price: null,
  },
];

export type Equipment = {
  kind: "equipment";
  slug: string;
  name: string;
  category: "Grinders" | "Kettles" | "Scales" | "Brewers" | "Accessories";
  price: number | null;
};

export const EQUIPMENT: Equipment[] = [
  { kind: "equipment", slug: "grinder", name: "Hand grinder", category: "Grinders", price: null },
  { kind: "equipment", slug: "gooseneck-kettle", name: "Gooseneck kettle", category: "Kettles", price: null },
  { kind: "equipment", slug: "scale", name: "Brew scale", category: "Scales", price: null },
  { kind: "equipment", slug: "v60-dripper", name: "V60 dripper", category: "Brewers", price: null },
  { kind: "equipment", slug: "french-press", name: "French press", category: "Brewers", price: null },
  { kind: "equipment", slug: "moka-pot", name: "Moka pot", category: "Brewers", price: null },
  { kind: "equipment", slug: "aeropress", name: "AeroPress", category: "Brewers", price: null },
  { kind: "equipment", slug: "paper-filters", name: "Paper filters", category: "Accessories", price: null },
  { kind: "equipment", slug: "mug", name: "H&H mug", category: "Accessories", price: null },
];

/* ------------------------------------------------------------------ */
/* Brew methods (brew guide, quiz, kit pages)                          */
/* ------------------------------------------------------------------ */

export type MethodKey = "pour" | "french" | "aero" | "moka" | "espresso";
export type Method = {
  label: string;
  ratio: number | null;
  grind: string;
  time: string;
  secs: number;
  fixed?: string;
  steps: string[];
};

export const METHODS: Record<MethodKey, Method> = {
  pour: {
    label: "Pour over",
    ratio: 16,
    grind: "Medium-fine, like table salt",
    time: "2 to 3 minutes",
    secs: 180,
    steps: [
      "Rinse the paper filter with hot water and empty the server.",
      "Add the coffee and level it. Pour twice its weight in water just off the boil, and wait 30 seconds.",
      "Pour the rest in slow circles until the scale reads your water weight.",
      "Let it drain, swirl, and drink.",
    ],
  },
  french: {
    label: "French press",
    ratio: 15,
    grind: "Coarse, like sea salt",
    time: "4 minutes",
    secs: 240,
    steps: [
      "Add the coffee to the press and pour in all the water, just off the boil.",
      "Stir once and rest the lid on top without pressing.",
      "At four minutes, press down slowly.",
      "Pour it all out right away so it does not keep brewing.",
    ],
  },
  moka: {
    label: "Moka pot",
    ratio: null,
    grind: "Medium-fine, a little coarser than espresso",
    time: "4 to 5 minutes",
    secs: 300,
    fixed: "Your pot sets the dose. Fill the basket level with coffee.",
    steps: [
      "Fill the base with hot water to just below the valve.",
      "Fill the basket level with coffee. Do not tamp it.",
      "Screw the top on tight and set it on medium-low heat with the lid open.",
      "When it starts to gurgle, take it off the heat and run the base under cold water.",
    ],
  },
  aero: {
    label: "AeroPress",
    ratio: 15,
    grind: "Medium-fine",
    time: "1½ to 2 minutes",
    secs: 120,
    steps: [
      "Rinse the paper filter and seat the cap on the chamber.",
      "Add the coffee, pour in the water, and stir for ten seconds.",
      "Fit the plunger and let it steep.",
      "Press gently for about 30 seconds and stop at the hiss.",
    ],
  },
  espresso: {
    label: "Espresso",
    ratio: 2,
    fixed: "18 g of coffee in, 36 g of espresso out.",
    grind: "Fine",
    time: "25 to 30 seconds",
    secs: 30,
    steps: [
      "Weigh 18 g of ground coffee into the portafilter and level it.",
      "Tamp evenly and lock it into the machine.",
      "Start the shot and stop at 36 g in the cup.",
      "Taste it, then adjust the grind finer or coarser.",
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Lookups and SKUs                                                    */
/* ------------------------------------------------------------------ */

export const getCoffee = (slug: string) => COFFEES.find((c) => c.slug === slug);
export const getKit = (slug: string) => KITS.find((k) => k.slug === slug);
export const getEquipment = (slug: string) => EQUIPMENT.find((e) => e.slug === slug);

/**
 * Cart line SKUs. The server re-derives every price and label from the SKU,
 * so nothing the browser sends about price is trusted.
 *   coffee:    c:<slug>:<roast>:<grind>:<size>
 *   kit:       k:<slug>:<coffeeSlug>:<roast>
 *   equipment: e:<slug>
 */
export type ParsedSku =
  | { kind: "coffee"; coffee: Coffee; roast: Roast; grind: Grind; size: Size }
  | { kind: "kit"; kit: Kit; coffee: Coffee; roast: Roast }
  | { kind: "equipment"; item: Equipment };

const isRoast = (v: string): v is Roast => (ROASTS as readonly string[]).includes(v);
const isGrind = (v: string): v is Grind => (GRINDS as readonly string[]).includes(v);
const isSize = (v: string): v is Size => (SIZES as readonly string[]).includes(v);

export function coffeeSku(slug: string, roast: Roast, grind: Grind, size: Size) {
  return `c:${slug}:${roast}:${grind}:${size}`;
}
export function kitSku(slug: string, coffeeSlug: string, roast: Roast) {
  return `k:${slug}:${coffeeSlug}:${roast}`;
}
export function equipmentSku(slug: string) {
  return `e:${slug}`;
}

export function parseSku(sku: string): ParsedSku | null {
  const p = sku.split(":");
  if (p[0] === "c" && p.length === 5) {
    const coffee = getCoffee(p[1]);
    if (!coffee || !coffee.available || !isRoast(p[2]) || !isGrind(p[3]) || !isSize(p[4])) return null;
    return { kind: "coffee", coffee, roast: p[2], grind: p[3], size: p[4] };
  }
  if (p[0] === "k" && p.length === 4) {
    const kit = getKit(p[1]);
    const coffee = getCoffee(p[2]);
    if (!kit || !coffee || !isRoast(p[3])) return null;
    return { kind: "kit", kit, coffee, roast: p[3] };
  }
  if (p[0] === "e" && p.length === 2) {
    const item = getEquipment(p[1]);
    return item ? { kind: "equipment", item } : null;
  }
  return null;
}

/** The stock bucket a SKU draws from (owner sets counts per bucket). */
export function stockKey(parsed: ParsedSku): string {
  switch (parsed.kind) {
    case "coffee":
      return `${parsed.coffee.slug}:${parsed.roast}:${parsed.size}`;
    case "kit":
      return `kit:${parsed.kit.slug}`;
    case "equipment":
      return `eq:${parsed.item.slug}`;
  }
}

export type LineInfo = { title: string; meta: string; unitPrice: number | null; href: string };

export function describeSku(sku: string): LineInfo | null {
  const p = parseSku(sku);
  if (!p) return null;
  switch (p.kind) {
    case "coffee":
      return {
        title: p.coffee.name,
        meta: `${ROAST_LABEL[p.roast]} · ${GRIND_LABEL[p.grind]} · ${p.size} g`,
        unitPrice: COFFEE_PRICE[p.size],
        href: `/coffee/${p.coffee.slug}`,
      };
    case "kit":
      return {
        title: p.kit.name,
        meta: `${p.coffee.name}, ${ROAST_LABEL[p.roast].toLowerCase()} · ${p.kit.grindNote}`,
        unitPrice: p.kit.price,
        href: `/kits/${p.kit.slug}`,
      };
    case "equipment":
      return {
        title: p.item.name,
        meta: p.item.category,
        unitPrice: p.item.price,
        href: `/equipment/${p.item.slug}`,
      };
  }
}

/** All stock buckets the admin can set counts for. */
export function allStockKeys(): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  for (const c of COFFEES)
    for (const r of ROASTS)
      for (const s of SIZES)
        out.push({ key: `${c.slug}:${r}:${s}`, label: `${c.name} (${c.estate}) · ${ROAST_LABEL[r]} · ${s} g` });
  for (const k of KITS) out.push({ key: `kit:${k.slug}`, label: k.name });
  for (const e of EQUIPMENT) out.push({ key: `eq:${e.slug}`, label: e.name });
  return out;
}

export function formatINR(rupees: number) {
  return "₹" + Math.round(rupees).toLocaleString("en-IN");
}
