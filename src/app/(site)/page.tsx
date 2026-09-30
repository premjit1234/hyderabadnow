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
      <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-8">
        <div
          className="relative isolate flex min-h-[560px] flex-col overflow-hidden rounded-3xl bg-indigo-950 bg-cover bg-center shadow-hero sm:min-h-0 sm:aspect-[16/7]"
          style={{ backgroundImage: `url(${heroImageUrl || "/hero-bg.jpg"})` }}
        >
          {/* Left-to-right scrim so hero copy stays legible while the
              admin's own photo still shows through clearly on the right —
              this is the one thing standing between the raw photo and the
              text, so the hero photo can be swapped from /admin/settings
              without ever needing a design touch-up here. */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/95 via-indigo-950/60 to-indigo-950/10" />
          {/* A second scrim anchored to the bottom so the floating search
              bar and its Buy/Rent toggle stay readable even over a bright
              part of the photo, regardless of the left-right one above. */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-indigo-950/70 to-transparent" />

          <div className="relative flex flex-1 flex-col justify-between gap-8 p-5 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <span className="animate-fade-up inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-soft backdrop-blur-sm">
                Dream · Search · Own
              </span>
              <span
                className="animate-fade-up inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-stone-700 shadow-soft backdrop-blur-sm"
                style={{ animationDelay: "60ms" }}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0 text-emerald-600">
                  <path
                    fillRule="evenodd"
                    d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified listings · Direct from owners
              </span>
            </div>

            <div className="max-w-xl">
              <h1
                className="animate-fade-up text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl"
                style={{ animationDelay: "120ms" }}
              >
                Discover Spaces That Feel Like{" "}
                <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
                  Home
                </span>
              </h1>
              <p
                className="animate-fade-up mt-3 max-w-md text-sm text-indigo-100 sm:text-base"
                style={{ animationDelay: "180ms" }}
              >
                Find handpicked properties for rent or sale in Hyderabad, posted directly by agents and owners —
                no middlemen.
              </p>

              {trustStats.length > 0 && (
                <ul
                  className="animate-fade-up mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-indigo-200"
                  style={{ animationDelay: "220ms" }}
                >
                  {trustStats.map((stat) => (
                    <li key={stat} className="flex items-center gap-1.5">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-violet-300">
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
            </div>

            <div className="animate-fade-up" style={{ animationDelay: "280ms" }}>
              <SearchBar localities={localities} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl px-4 sm:mt-10 sm:px-6">
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
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Handpicked</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">Featured listings</h2>
          </div>
          <Link
            href="/browse"
            className="group inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-soft transition hover:border-indigo-500 hover:text-indigo-600"
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
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">Communities</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">Featured projects</h2>
          </div>
          <Link
            href="/projects"
            className="group inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-soft transition hover:border-violet-500 hover:text-violet-600"
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 py-1.5 text-sm text-stone-700 shadow-soft transition hover:-translate-y-0.5 hover:border-indigo-500 hover:text-indigo-600 hover:shadow-lift"
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
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-800 px-6 py-14 text-center shadow-hero sm:px-12">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Are you an agent or property owner?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-indigo-200">
            Post your listing directly — no middlemen, reach buyers and tenants across Hyderabad.
          </p>
          <Link
            href="/post-listing"
            className="mt-7 inline-block rounded-full bg-white px-7 py-3 text-sm font-semibold text-indigo-700 shadow-lift transition hover:-translate-y-0.5 hover:bg-indigo-50"
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
