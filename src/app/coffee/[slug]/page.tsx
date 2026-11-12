import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COFFEES, getCoffee } from "@/lib/catalogue";
import { CoffeeBuy } from "@/components/product/CoffeeBuy";

export function generateStaticParams() {
  return COFFEES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const coffee = getCoffee((await params).slug);
  if (!coffee) return {};
  return {
    title: coffee.name,
    description: `${coffee.line} From the ${coffee.estate} estate.`,
  };
}

export default async function CoffeePage({ params }: { params: Promise<{ slug: string }> }) {
  const coffee = getCoffee((await params).slug);
  if (!coffee) notFound();
  return <CoffeeBuy coffee={coffee} />;
}
