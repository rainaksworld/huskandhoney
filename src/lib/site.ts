/** Business details shown across the site. All values are placeholders until launch. */
export const SITE = {
  name: "Husk & Honey",
  tagline: "Good coffee, better days.",
  address: "12 Placeholder Road, Pradhan Nagar, Siliguri, West Bengal 734003",
  phoneDisplay: "+91 98765 43210",
  phoneHref: "tel:+919876543210",
  email: "hello@huskandhoney.example",
  hours: "Mon–Sat, 10:00–18:00 IST",
  fssai: "10012345678901",
  gstin: "19ABCDE1234F1Z5",
  placeholderNote:
    "Draft preview. Address, phone, licence numbers, prices, product details and policy text are placeholders until launch.",
};

export const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/find", label: "Find your coffee" },
  { href: "/brew", label: "Brew guide" },
  { href: "/story", label: "Story" },
  { href: "/cafe", label: "Café" },
];

export const MENU = [
  { href: "/", label: "Home" },
  ...NAV,
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export const FOOTER_NAV = [
  ...NAV,
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/shipping", label: "Shipping" },
  { href: "/returns", label: "Returns" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];
