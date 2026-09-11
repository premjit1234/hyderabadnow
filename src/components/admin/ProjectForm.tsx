"use client";

import Image from "next/image";
import { useActionState } from "react";
import {
  adminCreateProjectAction,
  adminUpdateProjectAction,
  type ActionState,
} from "@/app/admin/actions";
import { AMENITIES } from "@/lib/amenities";
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
  possessionYear: number | null;
  unitDensityPerAcre: number | null;
  floorAreaRatio: number | null;
  description: string | null;
  amenities: string | null;
  brochureUrl: string | null;
  videoUrl: string | null;
  contactPhone: string | null;
  whatsappEnabled: boolean;
  featured: boolean;
  images: { id: number; url: string }[];
};

const inputClass = "w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm";
const labelClass = "mb-1 block text-sm font-medium text-stone-700";

export default function ProjectForm({ project, localities }: { project?: EditableProject; localities: string[] }) {
  const action = project ? adminUpdateProjectAction : adminCreateProjectAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);
  const selectedAmenities: string[] = project?.amenities ? JSON.parse(project.amenities) : [];

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
          <select name="propertyType" defaultValue={project?.propertyType ?? "apartment"} className={inputClass}>
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className={labelClass}>Area (acres)</label>
            <input type="number" step="0.1" name="areaAcres" defaultValue={project?.areaAcres ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Total units</label>
            <input type="number" name="totalUnits" defaultValue={project?.totalUnits ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Towers</label>
            <input type="number" name="towers" defaultValue={project?.towers ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Max floors</label>
            <input type="number" name="maxFloors" defaultValue={project?.maxFloors ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Units/floor (e.g. 8-10)</label>
            <input name="unitsPerFloor" defaultValue={project?.unitsPerFloor ?? ""} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Min area (sqft)</label>
            <input type="number" name="minAreaSqft" defaultValue={project?.minAreaSqft ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Max area (sqft)</label>
            <input type="number" name="maxAreaSqft" defaultValue={project?.maxAreaSqft ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>BHK options (e.g. 2,2.5,3,4)</label>
            <input name="bhkOptions" defaultValue={project?.bhkOptions ?? ""} className={inputClass} />
          </div>
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
          <div>
            <label className={labelClass}>Possession year</label>
            <input type="number" name="possessionYear" defaultValue={project?.possessionYear ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Unit density/acre</label>
            <input type="number" name="unitDensityPerAcre" defaultValue={project?.unitDensityPerAcre ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Floor area ratio</label>
            <input type="number" step="0.01" name="floorAreaRatio" defaultValue={project?.floorAreaRatio ?? undefined} className={inputClass} />
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
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {project.images.map((img) => (
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
