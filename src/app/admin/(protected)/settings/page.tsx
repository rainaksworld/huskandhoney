import type { Metadata } from "next";
import { getSettings } from "@/server/store";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata: Metadata = { title: "Settings", robots: { index: false, follow: false } };

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="col rv">
      <h1 className="disp h2">settings.</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}
