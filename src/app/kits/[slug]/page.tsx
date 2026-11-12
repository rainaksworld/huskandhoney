import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KITS, getKit } from "@/lib/catalogue";
import { KitBuy } from "@/components/product/KitBuy";

export function generateStaticParams() {
  return KITS.map((k) => ({ slug: k.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const kit = getKit((await params).slug);
  return kit ? { title: kit.name, description: kit.line } : {};
}

export default async function KitPage({ params }: { params: Promise<{ slug: string }> }) {
  const kit = getKit((await params).slug);
  if (!kit) notFound();
  return <KitBuy kit={kit} />;
}
