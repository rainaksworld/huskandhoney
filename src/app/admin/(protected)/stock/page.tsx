import type { Metadata } from "next";
import { allStockKeys } from "@/lib/catalogue";
import { getStockMap } from "@/server/store";
import { StockForm } from "@/components/admin/StockForm";

export const metadata: Metadata = { title: "Stock", robots: { index: false, follow: false } };

export default async function AdminStockPage() {
  const [keys, stock] = await Promise.all([allStockKeys(), getStockMap()]);
  const items = keys.map((k) => ({ ...k, qty: stock[k.key] ?? null }));

  return (
    <div className="col rv">
      <h1 className="disp h2">stock.</h1>
      <p className="lead">Set a count to track it against orders. Leave it blank to treat it as always available.</p>
      <StockForm items={items} />
    </div>
  );
}
