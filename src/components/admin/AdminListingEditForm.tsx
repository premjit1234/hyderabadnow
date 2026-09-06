"use client";

import Image from "next/image";
import { useActionState } from "react";
import { adminUpdateListingAction, type ActionState } from "@/app/admin/actions";
import { HYDERABAD_LOCALITIES } from "@/lib/localities";

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
  projectId: number | null;
  images: { id: number; url: string }[];
};

type ProjectOption = { id: number; name: string; locality: string };

export default function AdminListingEditForm({
  listing,
  projects,
}: {
  listing: EditableListing;
  projects: ProjectOption[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(adminUpdateListingAction, null);

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
            {HYDERABAD_LOCALITIES.map((l) => (
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

      <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
        <input type="checkbox" name="featured" defaultChecked={listing.featured} className="h-4 w-4" />
        Featured on homepage
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
