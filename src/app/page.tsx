import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import ListingCard from "@/components/ListingCard";
import CategoryTile from "@/components/CategoryTile";
import { getFeaturedListings, getHomeCategories } from "@/db/queries";
import { HYDERABAD_LOCALITIES } from "@/lib/localities";

export default async function Home() {
  const [featured, categories] = await Promise.all([getFeaturedListings(6), getHomeCategories()]);

  return (
    <main className="flex-1">
      <section
        className="relative bg-stone-900 bg-cover bg-center pb-24 pt-16 sm:pb-28 sm:pt-24"
        style={{
          backgroundImage:
            "linear-gradient(rgba(20,20,18,0.35), rgba(20,20,18,0.65)), url(https://picsum.photos/seed/hyderabad-city/1800/900)",
        }}
      >
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Find your next home in Hyderabad
          </h1>
          <p className="mt-3 text-base text-stone-200 sm:text-lg">
            Listings posted directly by agents and owners — no middlemen.
          </p>
          <div className="mt-8 text-left">
            <SearchBar />
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-12 max-w-6xl px-4 sm:-mt-16 sm:px-6">
        <div className="rounded-xl bg-white p-4 shadow-lg sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-stone-900">Browse homes in Hyderabad</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {categories.map((category) => (
              <CategoryTile key={category.key} category={category} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-xl font-bold text-stone-900">Featured listings</h2>
          <Link href="/browse" className="text-sm font-medium text-emerald-700 hover:underline">
            View all →
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="text-stone-500">No featured listings yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-stone-100 bg-stone-50 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="mb-5 text-xl font-bold text-stone-900">Popular localities</h2>
          <div className="flex flex-wrap gap-2">
            {HYDERABAD_LOCALITIES.map((locality) => (
              <Link
                key={locality}
                href={`/browse?q=${encodeURIComponent(locality)}`}
                className="rounded-full border border-stone-200 bg-white px-4 py-1.5 text-sm text-stone-700 hover:border-emerald-600 hover:text-emerald-700"
              >
                {locality}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
        <h2 className="text-xl font-bold text-stone-900">Are you an agent or property owner?</h2>
        <p className="mx-auto mt-2 max-w-xl text-stone-500">
          Post your listing directly — no middlemen, reach buyers and tenants across Hyderabad.
        </p>
        <Link
          href="/post-listing"
          className="mt-6 inline-block rounded-md bg-emerald-700 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Post a property
        </Link>
      </section>
    </main>
  );
}
