import { connection } from "next/server";
import { isAdmin } from "@/server/security";
import { listCustomers } from "@/server/orders";

/**
 * CSV download of the customers list. Route handlers don't run the admin
 * layout, so this checks the admin session itself.
 */
export async function GET(req: Request) {
  await connection();
  if (!(await isAdmin())) return new Response("Not found", { status: 404 });

  const onlyWa = new URL(req.url).searchParams.get("wa") === "1";
  const all = await listCustomers();
  const rows = onlyWa ? all.filter((c) => c.whatsappOptIn) : all;

  const header = ["Name", "Email", "Phone", "City", "Orders", "Spent (Rs)", "First order", "Last order", "WhatsApp opt-in"];
  const day = (d: Date) => d.toISOString().slice(0, 10);
  const lines = [
    header,
    ...rows.map((c) => [
      c.name,
      c.email,
      c.phone,
      c.city,
      String(c.orders),
      (c.spent / 100).toFixed(2),
      day(c.firstOrder),
      day(c.lastOrder),
      c.whatsappOptIn ? "Yes" : "No",
    ]),
  ].map((r) => r.map(cell).join(","));

  const name = `husk-and-honey-customers${onlyWa ? "-whatsapp" : ""}-${day(new Date())}.csv`;
  // BOM so Excel opens the ₹/accented names as UTF-8.
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${name}"`,
      "cache-control": "no-store",
    },
  });
}

/**
 * Quote a CSV cell. Values a spreadsheet would treat as a formula (starting
 * with = + - @) get a leading apostrophe, so a customer typing a formula
 * into the name field can't run it on the owner's computer.
 */
function cell(v: string) {
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}
