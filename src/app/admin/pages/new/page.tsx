import { getLocationNames } from "@/db/queries";
import MicrositePageForm from "@/components/admin/MicrositePageForm";

export default async function AdminNewMicrositePage() {
  const localities = await getLocationNames();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-stone-900">New page</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">
        A standalone, full-detail page for one development, reachable at its own hyderabadnow.in/&lt;url&gt; — fully
        independent from /admin/projects.
      </p>
      <MicrositePageForm localities={localities} />
    </div>
  );
}
