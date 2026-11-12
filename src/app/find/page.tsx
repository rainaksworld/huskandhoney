import type { Metadata } from "next";
import { FindQuiz } from "@/components/find/FindQuiz";

export const metadata: Metadata = {
  title: "Find your coffee",
  description: "Three questions about how you brew and what you like. We'll point you to a roast and a grind.",
};

export default function FindPage() {
  return <FindQuiz />;
}
