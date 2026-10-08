import { readContent } from "@/lib/store";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function SettingsPage() {
  const c = await readContent();
  return <SettingsForm settings={c.settings} media={c.media} />;
}
