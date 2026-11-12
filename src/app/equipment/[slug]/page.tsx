import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EQUIPMENT, getEquipment } from "@/lib/catalogue";
import { EquipmentBuy } from "@/components/product/EquipmentBuy";

export function generateStaticParams() {
  return EQUIPMENT.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const item = getEquipment((await params).slug);
  return item ? { title: item.name, description: `${item.category} · placeholder range.` } : {};
}

export default async function EquipmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const item = getEquipment((await params).slug);
  if (!item) notFound();
  const related = EQUIPMENT.filter((e) => e.category === item.category && e.slug !== item.slug);
  return <EquipmentBuy item={item} related={related} />;
}
