import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { getProjectsForComparison, getProjectsForSelect } from "@/db/queries";
import { propertyTypeLabel, projectHref, formatRupees, formatDate } from "@/lib/format";
import { PRICING_FIELD_DEFS, formatPricingValue, estimateOneTimeTotal, isPricingStale } from "@/lib/projectPricing";

// Generated purely from a ?ids= query string with no canonical single URL —
// exactly the kind of thin, combinatorial page that shouldn't accumulate in
// search results (see how carefully the rest of the site treats duplicate
// content). The comparison tool itself is still fully usable when linked to
// or bookmarked; it just isn't meant to be found via search.
export const metadata: Metadata = {
  title: "Compare Projects | HyderabadNow",
  robots: { index: false, follow: true },
};

const MAX_COMPARE = 5;

function compareHref(ids: number[]): string {
  return `/projects/compare?${ids.map((id) => `ids=${id}`).join("&")}`;
}

function parseIds(raw: string | string[] | undefined): number[] {
  const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const ids: number[] = [];
  for (const v of values) {
    const n = Number(v);
    if (Number.isInteger(n) && !ids.includes(n)) ids.push(n);
  }
  return ids.slice(0, MAX_COMPARE);
}

export default async function CompareProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const requestedCount = (Array.isArray(sp.ids) ? sp.ids : sp.ids ? [sp.ids] : []).length;
  const ids = parseIds(sp.ids);
  const truncated = requestedCount > MAX_COMPARE;

  const projects = ids.length > 0 ? await getProjectsForComparison(ids) : [];

  const allProjectOptions = await getProjectsForSelect();
  const availableToAdd = allProjectOptions.filter((p) => !ids.includes(p.id));

  return (
    <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <Link href="/projects" className="mb-4 inline-block text-sm font-medium text-stone-500 hover:text-emerald-700">
        ← Back to projects
      </Link>
      <h1 className="text-2xl font-bold text-stone-900">Compare projects</h1>
      <p className="mt-1 mb-6 text-stone-500">Specs and pricing, side by side.</p>

      {truncated && (
        <p className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          You can compare up to {MAX_COMPARE} projects at once — showing the first {MAX_COMPARE}.
        </p>
      )}

      {projects.length < 2 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center text-stone-500">
          <p>
            {projects.length === 0
              ? "Pick 2-5 projects on the "
              : "Pick at least one more project on the "}
            <Link href="/projects" className="font-medium text-emerald-700 hover:underline">
              projects page
            </Link>{" "}
            to compare them here.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-40 bg-stone-50 p-3 text-left align-bottom text-xs font-semibold uppercase tracking-wide text-stone-500">
                    &nbsp;
                  </th>
                  {projects.map((p) => (
                    <th key={p.id} className="min-w-[180px] border-l border-stone-100 bg-stone-50 p-3 text-left align-bottom">
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-stone-100">
                        {p.imageUrl ? (
                          <Image src={p.imageUrl} alt={p.name} fill sizes="200px" className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-stone-400">No photo</div>
                        )}
                      </div>
                      <Link href={projectHref(p)} className="mt-2 block line-clamp-2 text-sm font-bold text-stone-900 hover:underline">
                        {p.name}
                      </Link>
                      <p className="text-xs text-stone-500">{p.locality}</p>
                      <Link
                        href={compareHref(ids.filter((id) => id !== p.id))}
                        className="mt-1 inline-block text-xs font-medium text-red-600 hover:underline"
                      >
                        Remove
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={projects.length + 1} className="bg-stone-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-stone-600">
                    Specifications
                  </td>
                </tr>
                <SpecRow label="Property type" projects={projects} render={(p) => propertyTypeLabel(p.propertyType)} />
                <SpecRow
                  label="Construction status"
                  projects={projects}
                  render={(p) => (p.constructionStatus === "ready_to_move" ? "Ready to move" : "Under construction")}
                />
                <SpecRow
                  label="Area range"
                  projects={projects}
                  render={(p) =>
                    p.minAreaSqft != null && p.maxAreaSqft != null
                      ? `${p.minAreaSqft.toLocaleString("en-IN")}–${p.maxAreaSqft.toLocaleString("en-IN")} sqft`
                      : null
                  }
                />
                <SpecRow
                  label="BHK options"
                  projects={projects}
                  render={(p) => (p.bhkOptions ? p.bhkOptions.split(",").join(", ") + " BHK" : null)}
                />
                <SpecRow
                  label="Total units"
                  projects={projects}
                  render={(p) => p.totalUnits?.toLocaleString("en-IN") ?? null}
                />
                <SpecRow
                  label="Towers × floors"
                  projects={projects}
                  render={(p) => (p.towers != null && p.maxFloors != null ? `${p.towers} × ${p.maxFloors}` : null)}
                />
                <SpecRow label="Area (acres)" projects={projects} render={(p) => p.areaAcres ?? null} />
                <SpecRow label="Possession year" projects={projects} render={(p) => p.possessionYear ?? null} />
                <SpecRow label="RERA approval year" projects={projects} render={(p) => p.reraApprovalYear ?? null} />

                <tr>
                  <td colSpan={projects.length + 1} className="bg-stone-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-stone-600">
                    Pricing
                  </td>
                </tr>
                <SpecRow
                  label="Pricing as of"
                  projects={projects}
                  render={(p) => (
                    <span className="flex flex-wrap items-center gap-1.5">
                      {p.pricingUpdatedAt ? formatDate(p.pricingUpdatedAt) : "Unknown"}
                      {isPricingStale(p.pricingUpdatedAt) && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          May be outdated
                        </span>
                      )}
                    </span>
                  )}
                />
                {PRICING_FIELD_DEFS.map((f) => (
                  <SpecRow
                    key={f.key}
                    label={`${f.label} (${f.unit})`}
                    projects={projects}
                    render={(p) => {
                      const value = p[f.key];
                      return value == null ? null : formatPricingValue(f.key, value);
                    }}
                  />
                ))}
                <SpecRow
                  label="Estimated all-in price"
                  projects={projects}
                  render={(p) => {
                    const total = estimateOneTimeTotal(p);
                    return total == null ? null : formatRupees(total);
                  }}
                  emphasize
                />
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-stone-400">
            Estimated all-in price uses each project&rsquo;s smallest unit size, one car park, and every one-time
            charge except floor rise (depends on your floor) — see each project&rsquo;s own page for the full
            breakdown and disclaimer.
          </p>

          {availableToAdd.length > 0 && ids.length < MAX_COMPARE && (
            <form method="GET" action="/projects/compare" className="mt-6 flex flex-wrap items-end gap-2">
              {ids.map((id) => (
                <input key={id} type="hidden" name="ids" value={id} />
              ))}
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Add another project</label>
                <select name="ids" required className="rounded-md border border-stone-200 px-3 py-2 text-sm">
                  <option value="">Choose a project…</option>
                  {availableToAdd.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.locality})
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800">
                Add to comparison
              </button>
            </form>
          )}
        </>
      )}
    </main>
  );
}

// One row of the comparison table — renders "—" for any project missing that
// spec/charge rather than skipping the cell, so columns always stay aligned.
function SpecRow<T>({
  label,
  projects,
  render,
  emphasize,
}: {
  label: string;
  projects: T[];
  render: (p: T) => ReactNode;
  emphasize?: boolean;
}) {
  return (
    <tr className="border-t border-stone-100">
      <td className="sticky left-0 z-10 bg-white p-3 text-xs font-medium text-stone-600">{label}</td>
      {projects.map((p, i) => {
        const value = render(p);
        return (
          <td
            key={i}
            className={`border-l border-stone-100 p-3 text-sm ${emphasize ? "font-bold text-emerald-700" : "text-stone-800"}`}
          >
            {value ?? <span className="text-stone-300">—</span>}
          </td>
        );
      })}
    </tr>
  );
}
