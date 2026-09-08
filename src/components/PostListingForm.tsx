"use client";

import { useActionState } from "react";
import { createListingAction, type ActionState } from "@/app/actions";
import {
  FACING_OPTIONS,
  FURNISHING_OPTIONS,
  INVENTORY_STATE_OPTIONS,
  type ListingFieldVisibility,
} from "@/lib/listingFields";

type ProjectOption = { id: number; name: string; locality: string };
type AmenityOption = { id: number; key: string; label: string };

export default function PostListingForm({
  projects,
  fieldSettings,
  localities,
  amenityCatalog,
}: {
  projects: ProjectOption[];
  fieldSettings: ListingFieldVisibility;
  localities: string[];
  amenityCatalog: AmenityOption[];
}) {
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

      {projects.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Part of a project (optional)</label>
          <select name="projectId" defaultValue="" className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm">
            <option value="">Not part of a project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.locality}
              </option>
            ))}
          </select>
        </div>
      )}

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
          {localities.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Address (optional)</label>
        <input name="address" className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm" />
      </div>

      {(fieldSettings.towerName.form ||
        fieldSettings.unitNumber.form ||
        fieldSettings.unitFloor.form ||
        fieldSettings.facing.form ||
        fieldSettings.furnishingStatus.form ||
        fieldSettings.inventoryState.form) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fieldSettings.towerName.form && (
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Tower Name / Number (optional)</label>
              <input
                name="towerName"
                placeholder="e.g. Tower A or T-3"
                className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
              />
            </div>
          )}
          {fieldSettings.unitNumber.form && (
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Unit Number (optional)</label>
              <input
                name="unitNumber"
                placeholder="e.g. 1204"
                className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
              />
            </div>
          )}
          {fieldSettings.unitFloor.form && (
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Unit Floor (optional)</label>
              <input
                type="number"
                name="unitFloor"
                placeholder="e.g. 12"
                className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
              />
            </div>
          )}
          {fieldSettings.facing.form && (
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Facing (optional)</label>
              <select name="facing" defaultValue="" className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm">
                <option value="">— Select —</option>
                {FACING_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {fieldSettings.furnishingStatus.form && (
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Furnishing Status (optional)</label>
              <select
                name="furnishingStatus"
                defaultValue=""
                className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
              >
                <option value="">— Select —</option>
                {FURNISHING_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {fieldSettings.inventoryState.form && (
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Inventory State</label>
              <select
                name="inventoryState"
                defaultValue="new"
                className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
              >
                {INVENTORY_STATE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {(fieldSettings.sellerAskPrice.form || fieldSettings.sellerBestPrice.form || fieldSettings.cashRatioPercent.form) && (
        <div className="rounded-md border border-stone-200 bg-stone-50 p-4">
          <p className="text-sm font-medium text-stone-700">Pricing details (optional)</p>
          <p className="mt-0.5 text-xs text-stone-500">
            For internal reference — not shown on the public listing unless an admin makes it visible.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {fieldSettings.sellerAskPrice.form && (
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Seller Ask Price (₹)</label>
                <input
                  type="number"
                  name="sellerAskPrice"
                  placeholder="e.g. 9500000"
                  className="w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-sm"
                />
              </div>
            )}
            {fieldSettings.sellerBestPrice.form && (
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Seller Best Price (₹)</label>
                <input
                  type="number"
                  name="sellerBestPrice"
                  placeholder="e.g. 9000000"
                  className="w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-sm"
                />
              </div>
            )}
            {fieldSettings.cashRatioPercent.form && (
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Cash Ratio (%)</label>
                <input
                  type="number"
                  name="cashRatioPercent"
                  min={0}
                  max={100}
                  placeholder="e.g. 30"
                  className="w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-sm"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {fieldSettings.amenities.form && amenityCatalog.length > 0 && (
        <div className="rounded-md border border-stone-200 bg-stone-50 p-4">
          <p className="text-sm font-medium text-stone-700">Amenities (optional)</p>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {amenityCatalog.map((a) => (
              <label key={a.key} className="flex items-center gap-2 text-sm text-stone-700">
                <input type="checkbox" name="amenities" value={a.key} className="h-4 w-4" />
                {a.label}
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">YouTube video link (optional)</label>
        <input
          name="videoUrl"
          placeholder="https://www.youtube.com/watch?v=…"
          className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
        />
        <p className="mt-1 text-xs text-stone-500">Shown as an embedded video on your listing page.</p>
      </div>

      <div className="rounded-md border border-stone-200 bg-stone-50 p-4">
        <p className="text-sm font-medium text-stone-700">Contact for this listing (optional)</p>
        <p className="mt-0.5 text-xs text-stone-500">
          Shown on the listing page so buyers/renters can reach you directly about this property.
        </p>
        <div className="mt-3">
          <label className="mb-1 block text-sm font-medium text-stone-700">Phone number</label>
          <input
            name="contactPhone"
            type="tel"
            placeholder="e.g. 98480 11223"
            className="w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-sm"
          />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm font-medium text-stone-700">
          <input type="checkbox" name="whatsappEnabled" className="h-4 w-4" />
          Connect through WhatsApp
        </label>
        <p className="mt-1 text-xs text-stone-500">
          Adds a &quot;Connect on WhatsApp&quot; button to your listing, pre-filled with a message about it.
        </p>
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
