import { getAllSocialLinksForAdmin } from "@/db/queries";
import { adminDeleteSocialLinkAction } from "@/app/admin/actions";
import AdminSocialLinkForm from "@/components/admin/AdminSocialLinkForm";

export default async function AdminSocialLinksPage() {
  const links = await getAllSocialLinksForAdmin();

  return (
    <div>
      <h1 className="text-xl font-bold text-stone-900">Social links</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">
        Shown as an icon row in the header and the footer of every page. Add, edit, reorder, or remove any number of
        links below.
      </p>

      <div className="flex flex-col gap-3">
        {links.map((link) => (
          <div key={link.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <AdminSocialLinkForm link={link} />
            <form action={adminDeleteSocialLinkAction} className="mt-2 text-right">
              <input type="hidden" name="linkId" value={link.id} />
              <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                Delete link
              </button>
            </form>
          </div>
        ))}
        {links.length === 0 && (
          <p className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
            No social links yet — add one below. The icon row stays hidden on the public site until at least one
            exists.
          </p>
        )}
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/40 p-4">
        <h2 className="mb-3 text-sm font-semibold text-stone-900">Add a social link</h2>
        <AdminSocialLinkForm />
      </div>
    </div>
  );
}
