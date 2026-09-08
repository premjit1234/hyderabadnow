import { getProjectsForSelect, getAllUsersForAdmin, getLocationNames, getAmenityCatalog } from "@/db/queries";
import AdminListingCreateForm from "@/components/admin/AdminListingCreateForm";

export default async function AdminNewListingPage() {
  const [projects, users, localities, amenityCatalog] = await Promise.all([
    getProjectsForSelect(),
    getAllUsersForAdmin(),
    getLocationNames(),
    getAmenityCatalog(),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-stone-900">Add listing</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">
        Post a listing on behalf of any user — useful for properties called in over the phone.
      </p>
      <AdminListingCreateForm projects={projects} users={users} localities={localities} amenityCatalog={amenityCatalog} />
    </div>
  );
}
