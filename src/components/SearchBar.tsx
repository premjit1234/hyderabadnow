"use client";

import { useState } from "react";
import { HYDERABAD_LOCALITIES } from "@/lib/localities";

const TABS = [
  { value: "sale", label: "Buy" },
  { value: "rent", label: "Rent" },
] as const;

export default function SearchBar() {
  const [listingType, setListingType] = useState<"sale" | "rent">("sale");

  return (
    <div className="w-full">
      <div className="flex gap-6 px-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setListingType(tab.value)}
            className={`border-b-2 pb-2 text-sm font-semibold transition ${
              listingType === tab.value
                ? "border-white text-white"
                : "border-transparent text-stone-300 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <form
        action="/browse"
        method="GET"
        className="mt-2 flex w-full flex-col gap-2 rounded-lg bg-white p-2 shadow-xl sm:flex-row sm:rounded-full"
      >
        <input type="hidden" name="listingType" value={listingType} />
        <input
          type="text"
          name="q"
          placeholder="Search by locality — e.g. Gachibowli, Madhapur, Banjara Hills..."
          list="localities"
          className="flex-1 rounded-full border-none px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none"
        />
        <datalist id="localities">
          {HYDERABAD_LOCALITIES.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
        <button
          type="submit"
          className="rounded-full bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Search
        </button>
      </form>
    </div>
  );
}
