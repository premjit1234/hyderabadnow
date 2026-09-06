import Link from "next/link";
import Image from "next/image";
import { getProjectsForPublic } from "@/db/queries";
import { propertyTypeLabel } from "@/lib/format";

export default async function ProjectsPage() {
  const allProjects = await getProjectsForPublic();

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-stone-900">Projects in Hyderabad</h1>
      <p className="mt-1 mb-6 text-stone-500">
        Gated communities and developer-built projects with active listings.
      </p>

      {allProjects.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center text-stone-500">
          No projects listed yet — check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {allProjects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white transition hover:shadow-md"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                {p.imageUrl ? (
                  <Image
                    src={p.imageUrl}
                    alt={p.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-stone-400">No photo</div>
                )}
                <span className="absolute left-2 top-2 rounded bg-stone-900/80 px-2 py-0.5 text-xs font-semibold text-white">
                  {p.constructionStatus === "ready_to_move" ? "Ready to move" : "Under construction"}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-1 p-3.5">
                <p className="line-clamp-1 text-base font-bold text-stone-900">{p.name}</p>
                <p className="text-sm text-stone-500">
                  {p.locality}, {p.city}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                  <span>{propertyTypeLabel(p.propertyType)}</span>
                  {p.bhkOptions && <span>{p.bhkOptions.split(",").join(", ")} BHK</span>}
                  {p.minAreaSqft && p.maxAreaSqft && (
                    <span>
                      {p.minAreaSqft.toLocaleString("en-IN")}–{p.maxAreaSqft.toLocaleString("en-IN")} sqft
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs font-medium text-indigo-700">
                  {p.saleListings} for sale · {p.rentListings} for rent
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
