import { connection } from "next/server";
import { getSettings, getStockMap } from "@/server/store";

/** Stock counts and the shipping rule, for the bag and product pages. */
export async function GET() {
  await connection(); // always read live stock, never at build time
  const [stock, s] = await Promise.all([getStockMap(), getSettings()]);
  return Response.json(
    {
      stock,
      lowStockAt: s.lowStockAt,
      shippingFee: s.shippingFee,
      freeShippingOver: s.freeShippingOver,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
