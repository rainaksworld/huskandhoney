/** Small method icons (viewBox 0 0 32 32) for the "find your coffee" quiz. */
export const QUIZ_METHOD_ICON: Record<"pour" | "french" | "aero" | "moka" | "espresso" | "none", string> = {
  pour: "<path d=\"M6 9h20l-7 10h-6z\"/><rect x=\"11\" y=\"20\" width=\"10\" height=\"8\" rx=\"2\"/>",
  french: "<rect x=\"9\" y=\"11\" width=\"13\" height=\"16\" rx=\"2\"/><path d=\"M15.5 4v7M11 11h9M22 15c4 0 4 8 0 8\"/>",
  aero: "<rect x=\"11\" y=\"12\" width=\"10\" height=\"12\" rx=\"1.5\"/><rect x=\"12.5\" y=\"6\" width=\"7\" height=\"6\" rx=\"1\"/><path d=\"M16 3v3M9 24h14\"/>",
  moka: "<path d=\"M10 28l2-9h8l2 9zM11 19l1.5-9h7l1.5 9M13 10l3-3 3 3\"/>",
  espresso: "<rect x=\"6\" y=\"4\" width=\"20\" height=\"6\" rx=\"1.5\"/><path d=\"M13 10v3M19 10v3M9 19h12l-1.5 8h-9zM21 21c3 0 3 5 0 5\"/>",
  none: "<circle cx=\"16\" cy=\"16\" r=\"10\"/><path d=\"M16 11v5l3 3\"/>",
};

/** The "cup so far" preview illustration — brewer/roast/milk shown via CSS data attributes. */
