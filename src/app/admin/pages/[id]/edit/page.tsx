import { notFound } from "next/navigation";
import Link from "next/link";
import { getMicrositePageById, getLocationNames } from "@/db/queries";
import MicrositePageForm from "@/components/admin/MicrositePageForm";
import MicrositeFloorPlanForm from "@/components/admin/MicrositeFloorPlanForm";

export default async function AdminEditMicrositePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const pageId = Number(id);
  if (!Number.isInteger(pageId)) notFound();

  const page = await getMicrositePageById(pageId);
  if (!page) notFound();

  const sp = await searchParams;
  const saved = sp.saved === "1";
  const localities = await getLocationNames();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Edit page</h1>
          <p className="mt-1 text-sm text-stone-500">{page.name}</p>
        </div>
        {page.published && (
          <a
            href={`/${page.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-md border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-indigo-500 hover:text-indigo-600"
          >
            View live page →
          </a>
        )}
      </div>
      {saved && <p className="mb-5 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">Changes saved.</p>}

      <MicrositePageForm page={page} localities={localities} />

      <div className="mt-10">
        <p className="mb-1 text-sm font-bold text-stone-900">Floor plans / unit configurations</p>
        <p className="mb-4 text-xs text-stone-500">
          Each configuration is saved on its own — add one, save, then add the next.
        </p>
        <div className="flex flex-col gap-4">
          {page.floorPlans.map((fp) => (
            <MicrositeFloorPlanForm key={fp.id} pageId={page.id} floorPlan={fp} />
          ))}
          <MicrositeFloorPlanForm pageId={page.id} />
        </div>
      </div>

      <p className="mt-10 text-center text-xs text-stone-400">
        <Link href="/admin/pages" className="hover:underline">
          ← Back to all pages
        </Link>
      </p>
    </div>
  );
}
