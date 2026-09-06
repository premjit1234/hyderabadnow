"use client";

import { useState } from "react";
import ListingCard, { type ListingCardData } from "@/components/ListingCard";

export default function ProjectListingsTabs({
  saleListings,
  rentListings,
}: {
  saleListings: ListingCardData[];
  rentListings: ListingCardData[];
}) {
  const [tab, setTab] = useState<"sale" | "rent">(saleListings.length > 0 ? "sale" : "rent");
  const active = tab === "sale" ? saleListings : rentListings;

  return (
    <div>
      <div className="mb-5 inline-flex rounded-full border border-stone-200 p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setTab("sale")}
          className={`rounded-full px-4 py-1.5 transition ${
            tab === "sale" ? "bg-stone-900 text-white" : "text-stone-600 hover:text-stone-900"
          }`}
        >
          Sale ({saleListings.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("rent")}
          className={`rounded-full px-4 py-1.5 transition ${
            tab === "rent" ? "bg-stone-900 text-white" : "text-stone-600 hover:text-stone-900"
          }`}
        >
          Rent ({rentListings.length})
        </button>
      </div>

      {active.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-sm text-stone-500">
          No {tab === "sale" ? "sale" : "rental"} listings in this project yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
