import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import ListingCard from "@/components/ListingCard";
import ProjectCard from "@/components/ProjectCard";
import CategoryTile from "@/components/CategoryTile";
import AdSlot from "@/components/AdSlot";
import {
  getFeaturedListings,
  getFeaturedProjects,
  getHomeCategories,
  getHomeStats,
  getSiteSettings,
  getLocationNames,
} from "@/db/queries";

export default async function Home() {
  const [featured, featuredProjects, categories, { heroImageUrl }, localities, stats] = await Promise.all([
    getFeaturedListings(6),
    getFeaturedProjects(6),
    getHomeCategories(),
    getSiteSettings(),
    getLocationNames(),
    getHomeStats(),
  ]);

  // Small, real-numbers trust row under the hero copy — deliberately reads
  // "50+" rather than an exact count so it stays true even between renders
  // as listings/projects come and go, and never shows a hollow "0+" while
  // the catalog is still small.
  const trustStats = [
    stats.activeListings > 0 ? `${roundedFloor(stats.activeListings)}+ active listings` : null,
    stats.projectCount > 0 ? `${roundedFloor(stats.projectCount)}+ projects` : null,
    localities.length > 0 ? `${roundedFloor(localities.length)}+ localities` : null,
    "Zero brokerage",
  ].filter((s): s is string => Boolean(s));

  return (
    <main className="flex-1">
      <section
        className="relative overflow-hidden bg-stone-900 bg-cover bg-center pb-28 pt-20 sm:pb-32 sm:pt-28"
        style={{
          backgroundImage: `linear-gradient(rgba(12,10,9,0.45), rgba(12,10,9,0.72)), url(${heroImageUrl || "/hero-bg.jpg"})`,
        }}
      >
        {/* Soft color blobs for depth — pure CSS, no imagery, so they never
            add a request or a loading flash. Kept subtle (low opacity,
            heavily blurred) so they read as ambient light, not decoration. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-emerald-500/25 blur-[100px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 top-1/3 h-80 w-80 rounded-full bg-indigo-500/20 blur-[100px]"
        />

        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="animate-fade-up text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Find your next home in{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
              Hyderabad
            </span>
          </h1>
          <p
            className="animate-fade-up mt-4 text-base text-stone-200 sm:text-lg"
            style={{ animationDelay: "80ms" }}
          >
            Listings posted directly by agents and owners — no middlemen.
          </p>

          {trustStats.length > 0 && (
            <ul
              className="animate-fade-up mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-medium text-stone-300"
              style={{ animationDelay: "140ms" }}
            >
              {trustStats.map((stat) => (
                <li key={stat} className="flex items-center gap-1.5">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-emerald-400">
                    <path
                      fillRule="evenodd"
                      d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {stat}
                </li>
              ))}
            </ul>
          )}

          <div className="animate-fade-up mt-8 text-left" style={{ animationDelay: "200ms" }}>
            <SearchBar localities={localities} />
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-14 max-w-6xl px-4 sm:-mt-20 sm:px-6">
        <div className="rounded-2xl bg-white p-4 shadow-hero sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-stone-900">Browse homes in Hyderabad</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {categories.map((category) => (
              <CategoryTile key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Handpicked</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">Featured listings</h2>
          </div>
          <Link
            href="/browse"
            className="group inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-soft transition hover:border-emerald-600 hover:text-emerald-700"
          >
            View all
            <span aria-hidden className="transition group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="text-stone-500">No featured listings yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <AdSlot placementKey="home_below_featured_listings" />
      </div>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Communities</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">Featured projects</h2>
          </div>
          <Link
            href="/projects"
            className="group inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-soft transition hover:border-emerald-600 hover:text-emerald-700"
          >
            View all
            <span aria-hidden className="transition group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>
        {featuredProjects.length === 0 ? (
          <p className="text-stone-500">No featured projects yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      {localities.length > 0 && (
        <section className="border-t border-stone-100 bg-stone-50 py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="mb-5 text-2xl font-bold tracking-tight text-stone-900">Popular localities</h2>
            <div className="flex flex-wrap gap-2.5">
              {localities.map((locality) => (
                <Link
                  key={locality}
                  href={`/browse?q=${encodeURIComponent(locality)}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 py-1.5 text-sm text-stone-700 shadow-soft transition hover:-translate-y-0.5 hover:border-emerald-600 hover:text-emerald-700 hover:shadow-lift"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0 text-stone-400">
                    <path
                      fillRule="evenodd"
                      d="M10 18s6-5.33 6-9.5a6 6 0 1 0-12 0C4 12.67 10 18 10 18Zm0-7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {locality}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-emerald-950 px-6 py-14 text-center shadow-hero sm:px-12">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Are you an agent or property owner?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-stone-300">
            Post your listing directly — no middlemen, reach buyers and tenants across Hyderabad.
          </p>
          <Link
            href="/post-listing"
            className="mt-7 inline-block rounded-full bg-emerald-500 px-7 py-3 text-sm font-semibold text-stone-950 shadow-lift transition hover:-translate-y-0.5 hover:bg-emerald-400"
          >
            Post a property
          </Link>
        </div>
      </section>
    </main>
  );
}

// Floors a count to a friendly round-number lower bound (e.g. 247 -> 200,
// 1,842 -> 1,800) so the trust row reads as a confident "X+" claim that
// stays true as the underlying count grows, rather than an exact number
// that looks stale or oddly precise ("247+ active listings").
function roundedFloor(n: number): number {
  if (n < 20) return n;
  const magnitude = 10 ** (Math.floor(Math.log10(n)) - 1);
  return Math.floor(n / magnitude) * magnitude;
}
