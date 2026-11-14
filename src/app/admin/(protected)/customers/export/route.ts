import { connection } from "next/server";
import { isAdmin } from "@/server/security";
import { accountEmails, listCustomers } from "@/server/orders";
import { csvResponse, isoDay } from "@/lib/csv";

/**
 * CSV download of the customers list. Route handlers don't run the admin
 * layout, so this checks the admin session itself.
 */
export async function GET(req: Request) {
  await connection();
  if (!(await isAdmin())) return new Response("Not found", { status: 404 });

  const onlyWa = new URL(req.url).searchParams.get("wa") === "1";
  const [all, accounts] = await Promise.all([listCustomers(), accountEmails()]);
  const rows = onlyWa ? all.filter((c) => c.whatsappOptIn) : all;

  return csvResponse(`husk-and-honey-customers${onlyWa ? "-whatsapp" : ""}-${isoDay(new Date())}.csv`, [
    ["Name", "Email", "Phone", "City", "Orders", "Spent (Rs)", "First order", "Last order", "WhatsApp opt-in", "Has account"],
    ...rows.map((c) => [
      c.name,
      c.email,
      c.phone,
      c.city,
      String(c.orders),
      (c.spent / 100).toFixed(2),
      isoDay(c.firstOrder),
      isoDay(c.lastOrder),
      c.whatsappOptIn ? "Yes" : "No",
      accounts.has(c.email) ? "Yes" : "No",
    ]),
  ]);
}
