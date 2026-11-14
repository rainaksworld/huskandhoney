/**
 * Quote a CSV cell. Values a spreadsheet would treat as a formula (starting
 * with = + - @) get a leading apostrophe, so something a customer typed into
 * a form can't run as a formula on the owner's computer.
 */
export function csvCell(v: string) {
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** A downloadable CSV response. The BOM makes Excel read it as UTF-8. */
export function csvResponse(filename: string, rows: string[][]) {
  return new Response("﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}

export const isoDay = (d: Date) => d.toISOString().slice(0, 10);
