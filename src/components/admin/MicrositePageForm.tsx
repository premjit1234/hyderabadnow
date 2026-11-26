"use client";

import Image from "next/image";
import { useActionState } from "react";
import {
  adminCreateMicrositePageAction,
  adminUpdateMicrositePageAction,
  type ActionState,
} from "@/app/admin/micrositeActions";
import { AMENITIES } from "@/lib/amenities";
import { SPECIFICATION_CATEGORIES, specCategoryKey } from "@/lib/specificationCategories";
import { formatDate } from "@/lib/format";

export type EditableMicrositePage = {
  id: number;
  slug: string;
  name: string;
  tagline: string | null;
  developerName: string | null;
  developerUrl: string | null;
  locality: string;
  city: string;
  propertyType: string;
  constructionStatus: string;
  areaAcres: number | null;
  totalUnits: number | null;
  minAreaSqft: number | null;
  maxAreaSqft: number | null;
  bhkOptions: string | null;
  reraNumber: string | null;
  reraVerified: boolean;
  reraVerifiedAt: string | null;
  possessionYear: number | null;
  description: string | null;
  amenities: string | null;
  brochureUrl: string | null;
  masterPlanImageUrl: string | null;
  locationMapImageUrl: string | null;
  specificationsIntro: string | null;
  contactPhone: string | null;
  whatsappEnabled: boolean;
  featured: boolean;
  published: boolean;
  images: { id: number; url: string }[];
  videos: { id: number; url: string; title: string | null }[];
  specifications: { category: string; details: string }[];
  nearbyPlaces: { id: number; category: string; items: string }[];
};

const inputClass = "w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm";
const labelClass = "mb-1 block text-sm font-medium text-stone-700";
const NEW_VIDEO_SLOTS = 3;
const NEW_NEARBY_SLOTS = 2;

export default function MicrositePageForm({ page, localities }: { page?: EditableMicrositePage; localities: string[] }) {
  const action = page ? adminUpdateMicrositePageAction : adminCreateMicrositePageAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);
  const selectedAmenities: string[] = page?.amenities ? JSON.parse(page.amenities) : [];
  const specByCategory = new Map((page?.specifications ?? []).map((s) => [s.category, s.details]));

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {page && <input type="hidden" name="pageId" value={page.id} />}

      <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
        <label className={labelClass}>Page URL</label>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-stone-500">hyderabadnow.in/</span>
          <input
            name="slug"
            required
            defaultValue={page?.slug}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            placeholder="lumbinivana"
            className="flex-1 rounded-md border border-stone-200 px-3 py-2 text-sm"
          />
        </div>
        <p className="mt-1 text-xs text-stone-500">
          Lowercase letters, numbers, and hyphens only. This page is only reachable once &quot;Published&quot; below is
          checked.
        </p>
        <label className="mt-3 flex items-center gap-2 text-sm font-medium text-stone-700">
          <input type="checkbox" name="published" defaultChecked={page?.published} className="h-4 w-4" />
          Published (live on the public site)
        </label>
      </div>

      <div>
        <label className={labelClass}>Project name</label>
        <input name="name" required defaultValue={page?.name} placeholder="e.g. Lumbini Vana" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Hero tagline (optional)</label>
        <input name="tagline" defaultValue={page?.tagline ?? ""} placeholder="e.g. Crafted for Elevated Living" className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Developer name</label>
          <input name="developerName" defaultValue={page?.developerName ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Developer website (optional)</label>
          <input name="developerUrl" defaultValue={page?.developerUrl ?? ""} placeholder="https://…" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Locality</label>
          <input name="locality" required list="localities" defaultValue={page?.locality} className={inputClass} />
          <datalist id="localities">
            {localities.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </div>
        <div>
          <label className={labelClass}>City</label>
          <input name="city" required defaultValue={page?.city ?? "Hyderabad"} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Property type</label>
          <select name="propertyType" defaultValue={page?.propertyType ?? "villa"} className={inputClass}>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="independent_house">Independent House</option>
            <option value="plot">Plot / Land</option>
            <option value="commercial">Commercial</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Construction status</label>
          <select name="constructionStatus" defaultValue={page?.constructionStatus ?? "under_construction"} className={inputClass}>
            <option value="under_construction">Under construction</option>
            <option value="ready_to_move">Ready to move</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">Overview stats</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className={labelClass}>Area (acres)</label>
            <input type="number" step="0.1" name="areaAcres" defaultValue={page?.areaAcres ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Total units/villas</label>
            <input type="number" name="totalUnits" defaultValue={page?.totalUnits ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Min area (sqft)</label>
            <input type="number" name="minAreaSqft" defaultValue={page?.minAreaSqft ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Max area (sqft)</label>
            <input type="number" name="maxAreaSqft" defaultValue={page?.maxAreaSqft ?? undefined} className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>BHK options (e.g. 3,4,5)</label>
            <input name="bhkOptions" defaultValue={page?.bhkOptions ?? ""} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Possession year</label>
            <input type="number" name="possessionYear" defaultValue={page?.possessionYear ?? undefined} className={inputClass} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">RERA</p>
        <label className={labelClass}>RERA registration number</label>
        <input name="reraNumber" defaultValue={page?.reraNumber ?? ""} placeholder="e.g. P02400001234" className={inputClass} />
        <label className="mt-3 flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" name="reraVerified" defaultChecked={page?.reraVerified} className="h-4 w-4" />
          RERA Verified — I have personally checked this project against rera.telangana.gov.in
        </label>
        {page?.reraVerified && page.reraVerifiedAt && (
          <p className="mt-1 text-xs text-stone-500">Currently shown as checked on {formatDate(page.reraVerifiedAt)}.</p>
        )}
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea name="description" rows={4} defaultValue={page?.description ?? ""} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Brochure link (optional PDF URL)</label>
        <input name="brochureUrl" defaultValue={page?.brochureUrl ?? ""} placeholder="https://…" className={inputClass} />
      </div>

      <div className="rounded-lg border border-stone-200 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">Contact</p>
        <label className={labelClass}>Contact phone (sales desk)</label>
        <input name="contactPhone" type="tel" defaultValue={page?.contactPhone ?? ""} placeholder="e.g. 98480 11223" className={inputClass} />
        <label className="mt-3 flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" name="whatsappEnabled" defaultChecked={page?.whatsappEnabled} className="h-4 w-4" />
          Connect through WhatsApp
        </label>
      </div>

      <div>
        <p className={labelClass}>Amenities</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-stone-200 p-4 sm:grid-cols-3">
          {AMENITIES.map((a) => (
            <label key={a.key} className="flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" name="amenities" value={a.key} defaultChecked={selectedAmenities.includes(a.key)} className="h-4 w-4" />
              {a.label}
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">Master plan</p>
        {page?.masterPlanImageUrl && (
          <div className="relative mb-2 aspect-video w-full max-w-sm overflow-hidden rounded-md border border-stone-200">
            <Image src={page.masterPlanImageUrl} alt="Current master plan" fill sizes="400px" className="object-cover" />
          </div>
        )}
        <input type="file" name="masterPlanImage" accept="image/png,image/jpeg,image/webp" className={inputClass} />
        <p className="mt-1 text-xs text-stone-500">One large site-plan image, shown in its own section.</p>
      </div>

      <div className="rounded-lg border border-stone-200 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">Location map</p>
        {page?.locationMapImageUrl && (
          <div className="relative mb-2 aspect-video w-full max-w-sm overflow-hidden rounded-md border border-stone-200">
            <Image src={page.locationMapImageUrl} alt="Current location map" fill sizes="400px" className="object-cover" />
          </div>
        )}
        <input type="file" name="locationMapImage" accept="image/png,image/jpeg,image/webp" className={inputClass} />

        <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-stone-500">Nearby places</p>
        <p className="mb-2 text-xs text-stone-500">
          Grouped lists shown under the location map (e.g. category &quot;Schools&quot;, one place per line, optionally
          with a distance — &quot;Delhi Public School — 3 km&quot;).
        </p>
        {page && page.nearbyPlaces.length > 0 && (
          <div className="mb-3 flex flex-col gap-2">
            {page.nearbyPlaces.map((n) => (
              <div key={n.id} className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-stone-800">{n.category}</p>
                  <label className="flex shrink-0 items-center gap-1 text-xs text-red-600">
                    <input type="checkbox" name="removeNearbyPlaceId" value={n.id} className="h-3.5 w-3.5" />
                    Remove
                  </label>
                </div>
                <p className="whitespace-pre-line text-xs text-stone-600">{n.items}</p>
              </div>
            ))}
          </div>
        )}
        {Array.from({ length: NEW_NEARBY_SLOTS }).map((_, i) => (
          <div key={i} className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input name="newNearbyCategory" placeholder="Category, e.g. Schools" className={`${inputClass} sm:col-span-1`} />
            <textarea
              name="newNearbyItems"
              rows={2}
              placeholder={"One place per line, e.g.\nDelhi Public School — 3 km"}
              className={`${inputClass} sm:col-span-2`}
            />
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-stone-200 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">Specifications</p>
        <label className={labelClass}>Intro (optional)</label>
        <textarea name="specificationsIntro" rows={2} defaultValue={page?.specificationsIntro ?? ""} className={inputClass} />
        <p className="mb-2 mt-3 text-xs text-stone-500">Leave a category blank to hide it on the public page.</p>
        <div className="flex flex-col gap-3">
          {SPECIFICATION_CATEGORIES.map((category) => (
            <div key={category}>
              <label className={labelClass}>{category}</label>
              <textarea
                name={`spec_${specCategoryKey(category)}`}
                rows={2}
                defaultValue={specByCategory.get(category) ?? ""}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">Videos</p>
        <p className="mb-3 text-xs text-stone-500">Shown near the bottom of the page, above the enquiry form.</p>
        {page && page.videos.length > 0 && (
          <div className="mb-4 flex flex-col gap-2">
            {page.videos.map((v) => (
              <div key={v.id} className="flex items-center gap-3 rounded-md border border-stone-200 bg-stone-50 px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm text-stone-700">{v.title || v.url}</span>
                <label className="flex shrink-0 items-center gap-1 text-xs text-red-600">
                  <input type="checkbox" name="removeVideoId" value={v.id} className="h-3.5 w-3.5" />
                  Remove
                </label>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-2">
          {Array.from({ length: NEW_VIDEO_SLOTS }).map((_, i) => (
            <input key={i} name="newVideoUrls" placeholder="https://www.youtube.com/watch?v=…" className={inputClass} />
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
        <input type="checkbox" name="featured" defaultChecked={page?.featured} className="h-4 w-4" />
        Feature in &quot;Explore our other addresses&quot; on other microsite pages
      </label>

      {page && page.images.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">Current photos</label>
          <p className="mb-2 text-xs text-stone-500">Pick the main photo — it&rsquo;s the hero image at the top of the page.</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {page.images.map((img, i) => (
              <div key={img.id} className="flex flex-col items-center gap-1.5">
                <div className="relative aspect-square w-full overflow-hidden rounded-md border border-stone-200">
                  <Image src={img.url} alt="" fill sizes="120px" className="object-cover" />
                  {i === 0 && (
                    <span className="absolute left-1 top-1 rounded bg-emerald-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      MAIN
                    </span>
                  )}
                </div>
                <label className="flex items-center gap-1 text-xs text-stone-600">
                  <input type="radio" name="mainImageId" value={img.id} defaultChecked={i === 0} className="h-3.5 w-3.5" />
                  Main photo
                </label>
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
        <label className={labelClass}>{page ? "Add photos (up to 15)" : "Photos (up to 15)"}</label>
        <input type="file" name="images" accept="image/png,image/jpeg,image/webp,image/gif" multiple className={inputClass} />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {pending ? "Saving..." : page ? "Save changes" : "Create page"}
      </button>
    </form>
  );
}
