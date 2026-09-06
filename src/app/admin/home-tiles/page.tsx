import { getHomeTilesForAdmin } from "@/db/queries";
import { adminDeleteHomeTileAction } from "@/app/admin/actions";
import AdminHomeTileForm from "@/components/admin/AdminHomeTileForm";

export default async function AdminHomeTilesPage() {
  const tiles = await getHomeTilesForAdmin();

  return (
    <div>
      <h1 className="text-xl font-bold text-stone-900">Homepage tiles</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">
        These are the category tiles shown near the top of the homepage. Each has its own image and
        destination link — edit an existing tile, or add a new one below.
      </p>

      <div className="flex flex-col gap-3">
        {tiles.map((tile) => (
          <div key={tile.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <AdminHomeTileForm tile={tile} />
            <form action={adminDeleteHomeTileAction} className="mt-2 text-right">
              <input type="hidden" name="tileId" value={tile.id} />
              <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                Delete tile
              </button>
            </form>
          </div>
        ))}
        {tiles.length === 0 && (
          <p className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
            No tiles yet — add one below.
          </p>
        )}
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/40 p-4">
        <h2 className="mb-3 text-sm font-semibold text-stone-900">Add a new tile</h2>
        <AdminHomeTileForm />
      </div>
    </div>
  );
}
