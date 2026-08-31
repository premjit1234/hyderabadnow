"use client";

import { useActionState } from "react";
import { createListingAction, type ActionState } from "@/app/actions";
import { HYDERABAD_LOCALITIES } from "@/lib/localities";

export default function PostListingForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createListingAction,
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Title</label>
        <input
          name="title"
          required
          placeholder="e.g. Spacious 3BHK Apartment near Hitech City"
          className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Listing type</label>
          <select
            name="listingType"
            defaultValue="sale"
            className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
          >
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Property type</label>
          <select
            name="propertyType"
            defaultValue="apartment"
            className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
          >
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="independent_house">Independent House</option>
            <option value="plot">Plot / Land</option>
            <option value="commercial">Commercial</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Price (₹)</label>
          <input
            type="number"
            name="price"
            required
            min={1}
            placeholder="9500000"
            className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">BHK</label>
          <input
            type="number"
            name="bhk"
            min={0}
            max={10}
            placeholder="3"
            className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Area (sqft)</label>
          <input
            type="number"
            name="areaSqft"
            required
            min={1}
            placeholder="1850"
            className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Locality</label>
        <input
          name="locality"
          required
          list="localities"
          placeholder="e.g. Gachibowli"
          className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
        />
        <datalist id="localities">
          {HYDERABAD_LOCALITIES.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Address (optional)</label>
        <input name="address" className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Description</label>
        <textarea
          name="description"
          required
          rows={5}
          placeholder="Describe the property: amenities, condition, nearby landmarks..."
          className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Photos (up to 10)</label>
        <input
          type="file"
          name="images"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-700 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "Publishing..." : "Publish listing"}
      </button>
    </form>
  );
}
