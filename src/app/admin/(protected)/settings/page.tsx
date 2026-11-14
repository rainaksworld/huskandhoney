import type { Metadata } from "next";
import { getSettings } from "@/server/store";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { connection } from "next/server";

export const metadata: Metadata = { title: "Settings", robots: { index: false, follow: false } };

export default async function AdminSettingsPage() {
  await connection(); // live data only, never at build time (the layout's own connection() doesn't hold the page back)
  const settings = await getSettings();

  return (
    <div className="col rv">
      <h1 className="disp h2">settings.</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}
