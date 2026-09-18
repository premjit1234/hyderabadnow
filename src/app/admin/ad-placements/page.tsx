import { getAdPlacementSettings } from "@/db/queries";
import AdminAdPlacementsForm from "@/components/admin/AdminAdPlacementsForm";

export default async function AdminAdPlacementsPage() {
  const settings = await getAdPlacementSettings();

  return (
    <div>
      <h1 className="text-xl font-bold text-stone-900">Ad placements</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">
        Paste an ad network&apos;s ad unit code (e.g. Google AdSense&apos;s &quot;Ad unit&quot; code generator output)
        into a slot below to make it go live on the site — no redeploy needed. Leave a slot blank or unchecked to
        keep that spot empty.
      </p>
      <AdminAdPlacementsForm settings={settings} />
    </div>
  );
}
