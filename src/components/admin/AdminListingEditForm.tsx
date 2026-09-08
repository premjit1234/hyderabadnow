"use client";

import Image from "next/image";
import { useActionState } from "react";
import { adminUpdateListingAction, type ActionState } from "@/app/admin/actions";
import { FACING_OPTIONS, FURNISHING_OPTIONS, INVENTORY_STATE_OPTIONS } from "@/lib/listingFields";
import { parseAmenities } from "@/lib/amenities";

type EditableListing = {
  id: number;
  title: string;
  description: string;
  price: number;
  listingType: string;
  propertyType: string;
  bhk: number | null;
  areaSqft: number | null;
  locality: string;
  city: string;
  address: string | null;
  status: string;
  featured: boolean;
  verified: boolean;
  contactPhone: string | null;
  whatsappEnabled: boolean;
  projectId: number | null;
  towerName: string | null;
  unitNumber: string | null;
  unitFloor: number | null;
  facing: string | null;
  furnishingStatus: string | null;
  inventoryState: string;
  sellerAskPrice: number | null;
  sellerBestPrice: number | null;
  cashRatioPercent: number | null;
  amenities: string | null;
  videoUrl: string | null;
  images: { id: number; url: string }[];
};

type ProjectOption = { id: number; name: string; locality: string };
type AmenityOption = { id: number; key: string; label: string };

export default function AdminListingEditForm({
  listing,
  projects,
  localities,
  amenityCatalog,
}: {
  listing: EditableListing;
  projects: ProjectOption[];
  localities: string[];
  amenityCatalog: AmenityOption[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(adminUpdateListingAction, null);
  const selectedAmenities: string[] = parseAmenities(listing.amenities);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="listingId" value={listing.id} />

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Title</label>
        <input
          name="title"
          required
          defaultValue={listing.title}
          className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Listing type</label>
          <select
            name="listingType"
            defaultValue={listing.listingType}
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
            defaultValue={listing.propertyType}
            className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
          >
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="independent_house">Independent House</option>
            <option value="plot">Plot / Land</option>
            <option value="commercial">Commercial</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Status</label>
          <select
            name="status"
            defaultValue={listing.status}
            className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
          >
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="sold">Sold</option>
            <option value="rented">Rented</option>
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
            defaultValue={listing.price}
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
            defaultValue={listing.bhk ?? undefined}
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
            defaultValue={listing.areaSqft ?? undefined}
            className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Locality</label>
          <input
            name="locality"
            required
            list="localities"
            defaultValue={listing.locality}
            className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
          />
          <datalist id="localities">
            {localities.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">City</label>
          <input
            name="city"
            required
            defaultValue={listing.city}
            className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Address (optional)</label>
        <input
          name="address"
          defaultValue={listing.address ?? ""}
          className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
        />
      </div>

      <div className="rounded-md border border-stone-200 p-4">
        <p className="mb-3 text-sm font-semibold text-stone-900">Unit details</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Tower Name / Number</label>
            <input
              name="towerName"
              defaultValue={listing.towerName ?? ""}
              placeholder="e.g. Tower A or T-3"
              className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Unit Number</label>
            <input
              name="unitNumber"
              defaultValue={listing.unitNumber ?? ""}
              placeholder="e.g. 1204"
              className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Unit Floor</label>
            <input
              type="number"
              name="unitFloor"
              defaultValue={listing.unitFloor ?? undefined}
              placeholder="e.g. 12"
              className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Facing</label>
            <select
              name="facing"
              defaultValue={listing.facing ?? ""}
              className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
            >
              <option value="">— Select —</option>
              {FACING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Furnishing Status</label>
            <select
              name="furnishingStatus"
              defaultValue={listing.furnishingStatus ?? ""}
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
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Inventory State</label>
            <select
              name="inventoryState"
              defaultValue={listing.inventoryState}
              className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
            >
              {INVENTORY_STATE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-stone-200 p-4">
        <p className="text-sm font-semibold text-stone-900">Pricing details</p>
        <p className="mt-0.5 text-xs text-stone-500">
          Internal negotiation figures — hidden from the public listing page by default (toggle in Admin → Listing
          fields).
        </p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Seller Ask Price (₹)</label>
            <input
              type="number"
              name="sellerAskPrice"
              defaultValue={listing.sellerAskPrice ?? undefined}
              placeholder="e.g. 9500000"
              className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Seller Best Price (₹)</label>
            <input
              type="number"
              name="sellerBestPrice"
              defaultValue={listing.sellerBestPrice ?? undefined}
              placeholder="e.g. 9000000"
              className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Cash Ratio (%)</label>
            <input
              type="number"
              name="cashRatioPercent"
              min={0}
              max={100}
              defaultValue={listing.cashRatioPercent ?? undefined}
              placeholder="e.g. 30"
              className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Description</label>
        <textarea
          name="description"
          required
          rows={5}
          defaultValue={listing.description}
          className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Part of a project (optional)</label>
        <select
          name="projectId"
          defaultValue={listing.projectId ?? ""}
          className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
        >
          <option value="">Not part of a project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.locality}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-md border border-stone-200 p-4">
        <p className="mb-1 text-sm font-semibold text-stone-900">Amenities</p>
        <p className="mb-3 text-xs text-stone-500">
          Toggle in Admin → Listing fields to control whether this shows on the public listing page and post-listing
          form.
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          {amenityCatalog.map((a) => (
            <label key={a.key} className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                name="amenities"
                value={a.key}
                defaultChecked={selectedAmenities.includes(a.key)}
                className="h-4 w-4"
              />
              {a.label}
            </label>
          ))}
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-sm font-medium text-stone-700">Add new amenities (optional)</label>
          <input
            name="newAmenities"
            placeholder="e.g. Rooftop Deck, Co-working Lounge"
            className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
          />
          <p className="mt-1 text-xs text-stone-500">
            Comma-separated. Each one is added to the shared amenity list above and selected for this listing.
          </p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">YouTube video link (optional)</label>
        <input
          name="videoUrl"
          defaultValue={listing.videoUrl ?? ""}
          placeholder="https://www.youtube.com/watch?v=…"
          className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
        />
        <p className="mt-1 text-xs text-stone-500">Shown as an embedded video on the public listing page.</p>
      </div>

      <div className="rounded-md border border-stone-200 bg-stone-50 p-4">
        <p className="text-sm font-medium text-stone-700">Contact for this listing</p>
        <div className="mt-3">
          <label className="mb-1 block text-sm font-medium text-stone-700">Phone number</label>
          <input
            name="contactPhone"
            type="tel"
            defaultValue={listing.contactPhone ?? ""}
            placeholder="e.g. 98480 11223"
            className="w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-sm"
          />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm font-medium text-stone-700">
          <input type="checkbox" name="whatsappEnabled" defaultChecked={listing.whatsappEnabled} className="h-4 w-4" />
          Connect through WhatsApp
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
        <input type="checkbox" name="featured" defaultChecked={listing.featured} className="h-4 w-4" />
        Featured on homepage
      </label>

      <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
        <input type="checkbox" name="verified" defaultChecked={listing.verified} className="h-4 w-4" />
        Verified listing (shows a &quot;Verified&quot; badge to visitors)
      </label>

      {listing.images.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">Current photos</label>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {listing.images.map((img) => (
              <div key={img.id} className="flex flex-col items-center gap-1.5">
                <div className="relative aspect-square w-full overflow-hidden rounded-md border border-stone-200">
                  <Image src={img.url} alt="" fill sizes="120px" className="object-cover" />
                </div>
                <label className="flex items-center gap-1 text-xs text-red-600">
                  <input type="checkbox" name="removeImageId" value={img.id} className="h-3.5 w-3.5" />
                  Remove
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Add photos (up to 10)</label>
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
        className="rounded-md bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
