import { getAllLegalPagesForAdmin } from "@/db/queries";
import AdminLegalPageForm from "@/components/admin/AdminLegalPageForm";

export default async function AdminLegalPagesPage() {
  const pages = await getAllLegalPagesForAdmin();

  return (
    <div>
      <h1 className="text-xl font-bold text-stone-900">Legal pages</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">
        Terms of Use, Privacy Policy, and Cookie Policy — linked from the footer on every page. Changes apply
        immediately, no redeploy needed.
      </p>

      <div className="flex flex-col gap-6">
        {pages.map((page) => (
          <div key={page.id} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <AdminLegalPageForm page={page} />
          </div>
        ))}
        {pages.length === 0 && (
          <p className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
            No legal pages found — they should be created automatically on server start.
          </p>
        )}
      </div>
    </div>
  );
}
