import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocalityGuideForAdminEdit } from "@/db/queries";
import AdminLocalityGuideForm from "@/components/admin/AdminLocalityGuideForm";

export default async function AdminEditLocalityGuidePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const guideId = Number(id);
  if (!Number.isInteger(guideId)) notFound();

  const guide = await getLocalityGuideForAdminEdit(guideId);
  if (!guide) notFound();

  const sp = await searchParams;
  const saved = sp.saved === "1";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-stone-900">Edit locality guide</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500">
        {guide.status === "published" ? (
          <Link href={`/areas/${guide.slug}`} target="_blank" className="text-indigo-600 hover:underline">
            View live page →
          </Link>
        ) : (
          "Not published yet."
        )}
      </p>
      {saved && <p className="mb-5 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">Guide created.</p>}
      <AdminLocalityGuideForm guide={guide} />
    </div>
  );
}
