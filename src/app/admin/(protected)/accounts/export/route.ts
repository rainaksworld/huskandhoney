import { connection } from "next/server";
import { isAdmin } from "@/server/security";
import { listAccounts } from "@/server/orders";
import { csvResponse, isoDay } from "@/lib/csv";

/** CSV of all registered accounts. Checks the admin session itself (route handlers skip the layout). */
export async function GET() {
  await connection();
  if (!(await isAdmin())) return new Response("Not found", { status: 404 });
  const rows = await listAccounts();
  return csvResponse(`husk-and-honey-accounts-${isoDay(new Date())}.csv`, [
    ["Name", "Email", "Email confirmed", "Phone", "City", "Orders", "Spent (Rs)", "Joined", "Last login", "WhatsApp opt-in"],
    ...rows.map((a) => [
      a.name,
      a.email,
      a.emailVerified ? "Yes" : "No",
      a.phone,
      a.city,
      String(a.orders),
      (a.spent / 100).toFixed(2),
      isoDay(a.joined),
      a.lastLogin ? isoDay(a.lastLogin) : "",
      a.whatsappOptIn ? "Yes" : "No",
    ]),
  ]);
}
