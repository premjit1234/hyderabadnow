import { getListingFieldSettings } from "@/db/queries";
import AdminListingFieldSettingsForm from "@/components/admin/AdminListingFieldSettingsForm";

export default async function AdminListingFieldsPage() {
  const settings = await getListingFieldSettings();

  return (
    <div>
      <h1 className="text-xl font-bold text-stone-900">Listing fields</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">
        Control which unit-detail and pricing fields show up on the public listing page and on the post-listing
        form. Changes apply immediately, no redeploy needed.
      </p>
      <AdminListingFieldSettingsForm settings={settings} />
    </div>
  );
}
