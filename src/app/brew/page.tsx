import type { Metadata } from "next";
import { BrewGuide } from "@/components/brew/BrewGuide";

export const metadata: Metadata = {
  title: "Brew guide",
  description: "Pour over, French press, moka pot, AeroPress and espresso — ratios, timers and steps.",
};

export default function BrewPage() {
  return <BrewGuide />;
}
