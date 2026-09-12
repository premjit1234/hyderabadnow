import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getPublishedLocalityGuides } from "@/db/queries";

export const metadata: Metadata = {
  title: "Hyderabad Area Guides | HyderabadNow",
  description:
    "Locality guides for Hyderabad's IT-corridor neighborhoods — metro connectivity, Outer Ring Road access, and upcoming infrastructure for each area.",
};

export default async function AreasIndexPage() {
  const guides = await getPublishedLocalityGuides();

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-stone-900">Area guides</h1>
      <p className="mt-1 mb-6 text-stone-500">
        Connectivity, infrastructure, and what it&apos;s like to live in Hyderabad&apos;s most-searched localities.
      </p>

      {guides.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center text-stone-500">
          No area guides published yet — check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((g) => (
            <Link
              key={g.id}
              href={`/areas/${g.slug}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white transition hover:shadow-md"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-100">
                {g.heroImageUrl ? (
                  <Image
                    src={g.heroImageUrl}
                    alt={g.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-stone-400">{g.name}</div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-4">
                <p className="text-base font-bold text-stone-900">{g.name}</p>
                {g.excerpt && <p className="line-clamp-2 text-sm text-stone-500">{g.excerpt}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
