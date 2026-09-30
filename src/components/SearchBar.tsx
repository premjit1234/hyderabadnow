"use client";

import { useState } from "react";
import { PRICE_RANGES } from "@/lib/browseFilters";

const TABS = [
  { value: "sale", label: "Buy" },
  { value: "rent", label: "Rent" },
] as const;

// Same five property types as /browse's own filter (see PROPERTY_TYPES in
// app/(site)/browse/page.tsx) — kept as a small local list rather than a
// shared import since propertyTypeLabel already lives in lib/format and the
// list itself is short enough that every page defines it locally today.
const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "independent_house", label: "Independent House" },
  { value: "plot", label: "Plot / Land" },
  { value: "commercial", label: "Commercial" },
] as const;

function PinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        d="M10 18s6-5.33 6-9.5a6 6 0 1 0-12 0C4 12.67 10 18 10 18Zm0-7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        d="M2 5.5A2.5 2.5 0 0 1 4.5 3h5.379a2.5 2.5 0 0 1 1.767.732l6.622 6.621a2.5 2.5 0 0 1 0 3.536l-4.379 4.38a2.5 2.5 0 0 1-3.536 0l-6.621-6.622A2.5 2.5 0 0 1 2 9.879V5.5ZM6 8a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// The homepage hero's search — Buy/Rent, Location (free text with a
// locality datalist), Property Type, and Price Range, all submitting a plain
// GET to /browse using the exact same query param names /browse's own
// filter form reads (see parseBrowseSearchParams in lib/browseFilters.ts),
// so this is just another entry point into the same filtering logic, not a
// second one.
export default function SearchBar({ localities }: { localities: string[] }) {
  const [listingType, setListingType] = useState<"sale" | "rent">("sale");

  return (
    <div className="w-full">
      <form
        action="/browse"
        method="GET"
        className="flex w-full flex-col gap-2 rounded-2xl bg-white/95 p-2 shadow-hero backdrop-blur-sm sm:flex-row sm:items-center sm:rounded-full"
      >
        <input type="hidden" name="listingType" value={listingType} />

        <div className="flex shrink-0 gap-1 rounded-full bg-stone-100 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setListingType(tab.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                listingType === tab.value ? "bg-white text-indigo-700 shadow-soft" : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="hidden h-8 w-px shrink-0 bg-stone-200 sm:block" />

        <div className="relative flex min-w-0 flex-1 items-center">
          <PinIcon className="pointer-events-none absolute left-4 h-4 w-4 shrink-0 text-stone-400" />
          <input
            type="text"
            name="q"
            placeholder="Location — e.g. Gachibowli, Madhapur..."
            list="localities"
            className="w-full min-w-0 rounded-full border-none py-2.5 pr-4 pl-10 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none"
          />
          <datalist id="localities">
            {localities.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </div>

        <div className="hidden h-8 w-px shrink-0 bg-stone-200 sm:block" />

        <div className="relative flex shrink-0 items-center">
          <HomeIcon className="pointer-events-none absolute left-4 h-4 w-4 shrink-0 text-stone-400" />
          <select
            name="propertyType"
            defaultValue=""
            className="w-full appearance-none rounded-full border-none bg-transparent py-2.5 pr-8 pl-10 text-sm text-stone-700 focus:outline-none sm:w-auto"
          >
            <option value="">Any Property Type</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden h-8 w-px shrink-0 bg-stone-200 sm:block" />

        <div className="relative flex shrink-0 items-center">
          <TagIcon className="pointer-events-none absolute left-4 h-4 w-4 shrink-0 text-stone-400" />
          <select
            name="priceRange"
            defaultValue=""
            className="w-full appearance-none rounded-full border-none bg-transparent py-2.5 pr-8 pl-10 text-sm text-stone-700 focus:outline-none sm:w-auto"
          >
            <option value="">Any Price</option>
            {PRICE_RANGES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98]"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 1 0 3.32 9.9l3.14 3.14a.75.75 0 1 0 1.06-1.06l-3.14-3.14A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
              clipRule="evenodd"
            />
          </svg>
          Search
        </button>
      </form>
    </div>
  );
}
