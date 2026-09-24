"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import {
  adminCreateProjectAction,
  adminUpdateProjectAction,
  type ActionState,
} from "@/app/admin/actions";
import { AMENITIES } from "@/lib/amenities";
import { formatDate } from "@/lib/format";
import { APPROVED_BY_OPTIONS } from "@/lib/listingFields";
import LocationPicker from "@/components/admin/LocationPicker";

type EditableProject = {
  id: number;
  name: string;
  developerName: string | null;
  developerUrl: string | null;
  locality: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  propertyType: string;
  constructionStatus: string;
  areaAcres: number | null;
  totalUnits: number | null;
  towers: number | null;
  maxFloors: number | null;
  unitsPerFloor: string | null;
  minAreaSqft: number | null;
  maxAreaSqft: number | null;
  bhkOptions: string | null;
  reraNumber: string | null;
  reraApprovalYear: number | null;
  reraVerified: boolean;
  reraVerifiedAt: string | null;
  approvedBy: string | null;
  possessionYear: number | null;
  unitDensityPerAcre: number | null;
  floorAreaRatio: number | null;
  description: string | null;
  amenities: string | null;
  brochureUrl: string | null;
  basePricePerSqft: number | null;
  floorRiseChargePerSqftPerFloor: number | null;
  clubhouseCharges: number | null;
  carParkingChargePerCar: number | null;
  otherAmenitiesCharges: number | null;
  infraChargesPerSqft: number | null;
  additionalPlcChargesPerSqft: number | null;
  legalDocumentationCharges: number | null;
  corpusCharges: number | null;
  maintenanceChargePerSqftPerMonth: number | null;
  pricingUpdatedAt: string | null;
  videoUrl: string | null;
  virtualTourUrl: string | null;
  contactPhone: string | null;
  whatsappEnabled: boolean;
  featured: boolean;
  images: { id: number; url: string }[];
};

const inputClass = "w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm";
const labelClass = "mb-1 block text-sm font-medium text-stone-700";

type PropertyType = "apartment" | "villa" | "independent_house" | "plot" | "commercial";

// Mirrors resolveProjectFieldsForType in lib/projectValidation.ts — kept in
// sync by hand rather than shared, since one runs in the browser and the
// other on the server. If a field is hidden here for a type, that same type
// must null it out server-side too, or a value entered before switching
// types could linger invisibly in the database.
const isApartmentOrCommercial = (t: PropertyType) => t === "apartment" || t === "commercial";
const isVillaLike = (t: PropertyType) => t === "villa" || t === "independent_house";

// "Total units"/"Min-Max area" labels change by type since the same columns
// mean different things for a villa community, a plotted layout, or a
// commercial development — see schema.ts's projects table.
function totalUnitsLabel(t: PropertyType): string {
  if (t === "plot") return "Total Plots";
  if (isVillaLike(t)) return "Total Villas";
  return "Total Units";
}
function areaRangeLabel(t: PropertyType): [string, string] {
  if (t === "plot") return ["Min Plot Size (sqft)", "Max Plot Size (sqft)"];
  return ["Min area (sqft)", "Max area (sqft)"];
}

export default function ProjectForm({ project, localities }: { project?: EditableProject; localities: string[] }) {
  const action = project ? adminUpdateProjectAction : adminCreateProjectAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);
  const selectedAmenities: string[] = project?.amenities ? JSON.parse(project.amenities) : [];
  const [propertyType, setPropertyType] = useState<PropertyType>((project?.propertyType as PropertyType) ?? "apartment");
  const [minAreaLabel, maxAreaLabel] = areaRangeLabel(propertyType);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {project && <input type="hidden" name="projectId" value={project.id} />}

      <div>
        <label className={labelClass}>Project name</label>
        <input name="name" required defaultValue={project?.name} placeholder="e.g. My Home Udyan" className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Developer name</label>
          <input name="developerName" defaultValue={project?.developerName ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Developer website (optional)</label>
          <input name="developerUrl" defaultValue={project?.developerUrl ?? ""} placeholder="https://…" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Locality</label>
          <input name="locality" required list="localities" defaultValue={project?.locality} className={inputClass} />
          <datalist id="localities">
            {localities.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </div>
        <div>
          <label className={labelClass}>City</label>
          <input name="city" required defaultValue={project?.city ?? "Hyderabad"} className={inputClass} />
        </div>
      </div>

      <LocationPicker defaultLatitude={project?.latitude ?? null} defaultLongitude={project?.longitude ?? null} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Property type</label>
          <select
            name="propertyType"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value as PropertyType)}
            className={inputClass}
          >
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="independent_house">Independent House</option>
            <option value="plot">Plot / Land</option>
            <option value="commercial">Commercial</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Construction status</label>
          <select name="constructionStatus" defaultValue={project?.constructionStatus ?? "under_construction"} className={inputClass}>
            <option value="under_construction">Under construction</option>
            <option value="ready_to_move">Ready to move</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">Scale</p>
        <p className="mb-3 text-xs text-stone-500">
          Fields here adapt to the Property Type selected above — only what actually applies to this project type is
          shown, so the public project page never shows a nonsensical stat (like &quot;Towers&quot; on a plotted
          layout).
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className={labelClass}>Area (acres)</label>
            <input type="number" step="0.1" name="areaAcres" defaultValue={project?.areaAcres ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{totalUnitsLabel(propertyType)}</label>
            <input type="number" name="totalUnits" defaultValue={project?.totalUnits ?? undefined} className={inputClass} />
          </div>
          {isApartmentOrCommercial(propertyType) && (
            <div>
              <label className={labelClass}>Towers</label>
              <input type="number" name="towers" defaultValue={project?.towers ?? undefined} className={inputClass} />
            </div>
          )}
          {propertyType !== "plot" && (
            <div>
              <label className={labelClass}>Max floors</label>
              <input type="number" name="maxFloors" defaultValue={project?.maxFloors ?? undefined} className={inputClass} />
            </div>
          )}
          {isApartmentOrCommercial(propertyType) && (
            <div>
              <label className={labelClass}>Units/floor (e.g. 8-10)</label>
              <input name="unitsPerFloor" defaultValue={project?.unitsPerFloor ?? ""} className={inputClass} />
            </div>
          )}
          <div>
            <label className={labelClass}>{minAreaLabel}</label>
            <input type="number" name="minAreaSqft" defaultValue={project?.minAreaSqft ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{maxAreaLabel}</label>
            <input type="number" name="maxAreaSqft" defaultValue={project?.maxAreaSqft ?? undefined} className={inputClass} />
          </div>
          {(propertyType === "apartment" || isVillaLike(propertyType)) && (
            <div>
              <label className={labelClass}>BHK options (e.g. 2,2.5,3,4)</label>
              <input name="bhkOptions" defaultValue={project?.bhkOptions ?? ""} className={inputClass} />
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">Approval &amp; stats</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="col-span-2">
            <label className={labelClass}>RERA registration number</label>
            <input
              name="reraNumber"
              defaultValue={project?.reraNumber ?? ""}
              placeholder="e.g. P02400001234"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-stone-500">
              Shown on the public page with a link so buyers can independently check it on{" "}
              <a
                href="https://rera.telangana.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:underline"
              >
                rera.telangana.gov.in
              </a>{" "}
              — leave blank if this project isn&rsquo;t RERA-registered yet.
            </p>
          </div>
          <div>
            <label className={labelClass}>RERA approval year</label>
            <input type="number" name="reraApprovalYear" defaultValue={project?.reraApprovalYear ?? undefined} className={inputClass} />
          </div>
          <div className="col-span-2 flex items-end">
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" name="reraVerified" defaultChecked={project?.reraVerified} className="h-4 w-4" />
              RERA Verified — I have personally checked this project against rera.telangana.gov.in
            </label>
          </div>
          {project?.reraVerified && project.reraVerifiedAt && (
            <p className="col-span-2 -mt-2 text-xs text-stone-500">
              Currently shown as checked on {formatDate(project.reraVerifiedAt)}. Leave this ticked to keep that date, or
              untick and re-tick after re-checking to update it.
            </p>
          )}
          <div>
            <label className={labelClass}>Possession year</label>
            <input type="number" name="possessionYear" defaultValue={project?.possessionYear ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Approved by</label>
            <select name="approvedBy" defaultValue={project?.approvedBy ?? ""} className={inputClass}>
              <option value="">Not specified</option>
              {APPROVED_BY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-stone-500">
              Layout/building-plan approving authority — mainly relevant for plotted developments.
            </p>
          </div>
          <div>
            <label className={labelClass}>Unit density/acre</label>
            <input type="number" name="unitDensityPerAcre" defaultValue={project?.unitDensityPerAcre ?? undefined} className={inputClass} />
          </div>
          {propertyType !== "plot" && (
            <div>
              <label className={labelClass}>Floor area ratio</label>
              <input type="number" step="0.01" name="floorAreaRatio" defaultValue={project?.floorAreaRatio ?? undefined} className={inputClass} />
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">Pricing &amp; charges</p>
        <p className="mb-1 text-xs text-stone-500">
          All optional — fill in what you know. Shown as a pricing breakdown on the project&rsquo;s public page, and
          used to compare projects on /projects/compare.
        </p>
        <p className="mb-3 text-xs font-medium text-stone-600">
          {project?.pricingUpdatedAt
            ? `Pricing last updated ${formatDate(project.pricingUpdatedAt)} — this date updates itself automatically when you change any of the fields below.`
            : "No pricing set yet — the \"as of\" date shown to buyers is stamped automatically the first time you save one of these fields."}
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Base price (₹/sqft)</label>
            <input type="number" step="0.01" name="basePricePerSqft" defaultValue={project?.basePricePerSqft ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Floor rise charge (₹/sqft/floor)</label>
            <input type="number" step="0.01" name="floorRiseChargePerSqftPerFloor" defaultValue={project?.floorRiseChargePerSqftPerFloor ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Infra charges (₹/sqft)</label>
            <input type="number" step="0.01" name="infraChargesPerSqft" defaultValue={project?.infraChargesPerSqft ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Additional PLC charges (₹/sqft)</label>
            <input type="number" step="0.01" name="additionalPlcChargesPerSqft" defaultValue={project?.additionalPlcChargesPerSqft ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Maintenance charges (₹/sqft/month)</label>
            <input type="number" step="0.01" name="maintenanceChargePerSqftPerMonth" defaultValue={project?.maintenanceChargePerSqftPerMonth ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Car parking (₹ per car)</label>
            <input type="number" name="carParkingChargePerCar" defaultValue={project?.carParkingChargePerCar ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Clubhouse charges (₹, flat)</label>
            <input type="number" name="clubhouseCharges" defaultValue={project?.clubhouseCharges ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Other amenities charges (₹, flat)</label>
            <input type="number" name="otherAmenitiesCharges" defaultValue={project?.otherAmenitiesCharges ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Legal &amp; documentation charges (₹, flat)</label>
            <input type="number" name="legalDocumentationCharges" defaultValue={project?.legalDocumentationCharges ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Corpus charges (₹, flat)</label>
            <input type="number" name="corpusCharges" defaultValue={project?.corpusCharges ?? undefined} className={inputClass} />
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea name="description" rows={4} defaultValue={project?.description ?? ""} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Brochure link (optional PDF URL)</label>
        <input name="brochureUrl" defaultValue={project?.brochureUrl ?? ""} placeholder="https://…" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>YouTube video link (optional)</label>
        <input
          name="videoUrl"
          defaultValue={project?.videoUrl ?? ""}
          placeholder="https://www.youtube.com/watch?v=…"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-stone-500">
          Shown as an embedded video on the project&rsquo;s public page. YouTube or Vimeo links only.
        </p>
      </div>

      <div>
        <label className={labelClass}>360° / virtual tour link (optional)</label>
        <input
          name="virtualTourUrl"
          defaultValue={project?.virtualTourUrl ?? ""}
          placeholder="https://my.matterport.com/show/?m=… or a Kuula/momento360 share link"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-stone-500">
          Paste the share/embed link from Matterport, Kuula, momento360, or a similar tour host — shown as an
          embedded 360° tour on the project&rsquo;s public page.
        </p>
      </div>

      <div className="rounded-lg border border-stone-200 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">Contact</p>
        <div>
          <label className={labelClass}>Contact phone (sales desk)</label>
          <input
            name="contactPhone"
            type="tel"
            defaultValue={project?.contactPhone ?? ""}
            placeholder="e.g. 98480 11223"
            className={inputClass}
          />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            name="whatsappEnabled"
            defaultChecked={project?.whatsappEnabled}
            className="h-4 w-4"
          />
          Connect through WhatsApp
        </label>
        <p className="mt-1 text-xs text-stone-500">
          Adds a &quot;Connect on WhatsApp&quot; button to this project&apos;s page, pre-filled with a message about it.
        </p>
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

      <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
        <input type="checkbox" name="featured" defaultChecked={project?.featured} className="h-4 w-4" />
        Featured on homepage
      </label>

      {project && project.images.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">Current photos</label>
          <p className="mb-2 text-xs text-stone-500">
            Pick the main photo — it&rsquo;s the one shown on project cards and as the cover photo on this project&rsquo;s
            page.
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {project.images.map((img, i) => (
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
                  <input
                    type="radio"
                    name="mainImageId"
                    value={img.id}
                    defaultChecked={i === 0}
                    className="h-3.5 w-3.5"
                  />
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
        <label className={labelClass}>{project ? "Add photos (up to 15)" : "Photos (up to 15)"}</label>
        <input type="file" name="images" accept="image/png,image/jpeg,image/webp,image/gif" multiple className={inputClass} />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {pending ? "Saving..." : project ? "Save changes" : "Create project"}
      </button>
    </form>
  );
}
