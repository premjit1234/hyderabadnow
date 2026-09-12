"use client";

import Image from "next/image";
import { useActionState } from "react";
import {
  adminCreateLocalityGuideAction,
  adminUpdateLocalityGuideAction,
  type ActionState,
} from "@/app/admin/actions";
import RichTextEditor from "@/components/admin/RichTextEditor";

type EditableGuide = {
  id: number;
  name: string;
  title: string;
  excerpt: string | null;
  heroImageUrl: string | null;
  videoUrl: string | null;
  metroConnectivity: string | null;
  orrAccess: string | null;
  upcomingInfra: string | null;
  contentHtml: string;
  displayOrder: number;
  status: string;
};

const inputClass = "w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm";
const labelClass = "mb-1 block text-sm font-medium text-stone-700";
const helpClass = "mt-1 text-xs text-stone-400";

export default function AdminLocalityGuideForm({ guide }: { guide?: EditableGuide }) {
  const action = guide ? adminUpdateLocalityGuideAction : adminCreateLocalityGuideAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {guide && <input type="hidden" name="guideId" value={guide.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Locality name</label>
          <input name="name" required defaultValue={guide?.name} placeholder="e.g. Gachibowli" className={inputClass} />
          <p className={helpClass}>Used to generate the page URL and shown on the guides index.</p>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select name="status" defaultValue={guide?.status ?? "draft"} className={inputClass}>
            <option value="draft">Draft (not visible on the site)</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Page title</label>
        <input
          name="title"
          required
          defaultValue={guide?.title}
          placeholder="e.g. Gachibowli, Hyderabad — Complete Area Guide"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Excerpt (shown on the guides index &amp; search results)</label>
        <textarea
          name="excerpt"
          rows={2}
          maxLength={300}
          defaultValue={guide?.excerpt ?? ""}
          placeholder="A short one or two sentence summary…"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Display order</label>
          <input
            type="number"
            name="displayOrder"
            step={1}
            defaultValue={guide?.displayOrder ?? 0}
            className={inputClass}
          />
          <p className={helpClass}>Lower numbers show first on the guides index. Ties break alphabetically.</p>
        </div>
      </div>

      {guide?.heroImageUrl && (
        <div>
          <label className={labelClass}>Current hero image</label>
          <div className="relative aspect-[16/9] w-full max-w-xs overflow-hidden rounded-md border border-stone-200">
            <Image src={guide.heroImageUrl} alt="" fill sizes="320px" className="object-cover" />
          </div>
          <label className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
            <input type="checkbox" name="removeHeroImage" className="h-3.5 w-3.5" />
            Remove hero image
          </label>
        </div>
      )}
      <div>
        <label className={labelClass}>{guide?.heroImageUrl ? "Replace hero image" : "Hero image"}</label>
        <input type="file" name="heroImage" accept="image/png,image/jpeg,image/webp,image/gif" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Video link (optional — YouTube or Vimeo)</label>
        <input
          name="videoUrl"
          defaultValue={guide?.videoUrl ?? ""}
          placeholder="https://www.youtube.com/watch?v=…"
          className={inputClass}
        />
        <p className={helpClass}>Shown above the write-up on the live page once set — e.g. a drone flyover or walkthrough.</p>
      </div>

      <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
        <h2 className="mb-3 text-sm font-bold text-stone-900">Highlights strip</h2>
        <p className="mb-4 text-xs text-stone-500">
          Shown at the top of the page as short callouts. Keep each to a sentence or two — the full write-up goes in
          the body below.
        </p>
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Metro connectivity</label>
            <textarea
              name="metroConnectivity"
              rows={2}
              defaultValue={guide?.metroConnectivity ?? ""}
              placeholder="e.g. Nearest station is Raidurg (Blue Line), about 4 km away…"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>ORR access</label>
            <textarea
              name="orrAccess"
              rows={2}
              defaultValue={guide?.orrAccess ?? ""}
              placeholder="e.g. Direct access via the Nanakramguda (Exit 19) interchange…"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Upcoming infrastructure</label>
            <textarea
              name="upcomingInfra"
              rows={2}
              defaultValue={guide?.upcomingInfra ?? ""}
              placeholder="e.g. Metro Phase 2's proposed Blue Line spur would add a station nearby…"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass}>Full write-up</label>
        <RichTextEditor name="contentHtml" defaultValue={guide?.contentHtml} />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-700">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {pending ? "Saving..." : guide ? "Save changes" : "Create guide"}
      </button>
    </form>
  );
}
