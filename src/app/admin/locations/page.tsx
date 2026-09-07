import { getLocationsForAdmin } from "@/db/queries";
import { adminDeleteLocationAction } from "@/app/admin/actions";
import AdminLocationForm from "@/components/admin/AdminLocationForm";

export default async function AdminLocationsPage() {
  const items = await getLocationsForAdmin();

  return (
    <div>
      <h1 className="text-xl font-bold text-stone-900">Locations</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">
        The localities suggested on the homepage and when someone types a listing's or project's locality. Add, edit,
        reorder, or remove any number below — this only changes what's suggested going forward, so editing or
        removing one never changes any listing or project that already used that name.
      </p>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <AdminLocationForm location={item} />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-stone-400">
                {item.listingCount} listing{item.listingCount === 1 ? "" : "s"}, {item.projectCount} project
                {item.projectCount === 1 ? "" : "s"} currently use this name
              </p>
              <form action={adminDeleteLocationAction}>
                <input type="hidden" name="locationId" value={item.id} />
                <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                  Delete location
                </button>
              </form>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
            No locations yet — add one below. The homepage's "Popular localities" section stays hidden until at
            least one exists.
          </p>
        )}
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/40 p-4">
        <h2 className="mb-3 text-sm font-semibold text-stone-900">Add a new location</h2>
        <AdminLocationForm />
      </div>
    </div>
  );
}
