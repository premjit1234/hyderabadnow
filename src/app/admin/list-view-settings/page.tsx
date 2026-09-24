import { getListViewFieldSettings } from "@/db/queries";
import { LISTING_LIST_FIELDS, PROJECT_LIST_FIELDS, PROPERTY_TYPES, toFieldMeta } from "@/lib/listViewFields";
import AdminListViewFieldSettingsForm from "@/components/admin/AdminListViewFieldSettingsForm";

export default async function AdminListViewSettingsPage() {
  const config = await getListViewFieldSettings();

  return (
    <div>
      <h1 className="text-xl font-bold text-stone-900">List view settings</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">
        Choose which columns show in the new table-style &quot;List&quot; view on /browse and /projects, and what
        order they appear in — separately for Listings and Projects, and separately for each property type (a Plot
        has no use for Bedrooms, an Apartment has no use for Approved By). Buyers still land on the card-based
        &quot;Catalog&quot; view by default; List is an opt-in toggle.
      </p>
      <AdminListViewFieldSettingsForm
        listingFields={toFieldMeta(LISTING_LIST_FIELDS)}
        projectFields={toFieldMeta(PROJECT_LIST_FIELDS)}
        propertyTypes={PROPERTY_TYPES}
        initialConfig={config}
      />
    </div>
  );
}
