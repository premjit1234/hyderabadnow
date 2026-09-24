import Link from "next/link";
import type { ReactNode } from "react";
import {
  LIST_VIEW_SORT_FIELD_PARAM,
  LIST_VIEW_SORT_DIR_PARAM,
  columnFilterParamNames,
  isNumericType,
  type ListViewFieldDef,
} from "@/lib/listViewFields";
import { buildSortHref, buildResetListViewHref, type ListViewSearchParams } from "@/lib/listViewUrl";

// Shared table renderer behind both ListingsListView and ProjectsListView —
// the two only differ in which rows/fields they pass in and how they render
// the always-first, always-linked title/name column, so the sort-header,
// column-filter-form, and table-body plumbing lives here once.
export default function ListViewTable<Row extends { id: number }>({
  rows,
  fields,
  sp,
  basePath,
  titleLabel,
  renderTitle,
  emptyMessage,
}: {
  rows: Row[];
  fields: ListViewFieldDef[];
  sp: ListViewSearchParams;
  basePath: string;
  titleLabel: string;
  renderTitle: (row: Row) => ReactNode;
  emptyMessage: string;
}) {
  const sortField =
    typeof sp[LIST_VIEW_SORT_FIELD_PARAM] === "string" ? (sp[LIST_VIEW_SORT_FIELD_PARAM] as string) : undefined;
  const sortDir = typeof sp[LIST_VIEW_SORT_DIR_PARAM] === "string" ? (sp[LIST_VIEW_SORT_DIR_PARAM] as string) : undefined;

  // Every current param except the column-filter (cf_*) ones — replayed as
  // hidden inputs on the filter form below so applying/changing a column
  // filter never discards the page's own filter bar selections (locality,
  // listing type, property type, etc.), which live in a separate <form>
  // above this one. NOTE: the reverse isn't true — submitting the main
  // filter bar's form does reset any column filters/sort here, since that
  // form has no way to know about them. A deliberate, disclosed tradeoff
  // rather than merging the two forms into one.
  const passthroughEntries = Object.entries(sp).filter(([key]) => !key.startsWith("cf_"));
  const hasListViewState = Object.keys(sp).some(
    (key) => key.startsWith("cf_") || key === LIST_VIEW_SORT_FIELD_PARAM || key === LIST_VIEW_SORT_DIR_PARAM
  );

  return (
    <div>
      <form
        method="GET"
        action={basePath}
        className="mb-3 flex flex-wrap items-end gap-3 rounded-lg border border-stone-200 bg-white p-3"
      >
        {passthroughEntries.map(([key, value]) =>
          Array.isArray(value)
            ? value.map((v, i) => <input key={`${key}-${i}`} type="hidden" name={key} value={v} />)
            : value != null
              ? <input key={key} type="hidden" name={key} value={value} />
              : null
        )}
        {fields.map((field) => (
          <ColumnFilterInput key={field.key} field={field} sp={sp} />
        ))}
        <button
          type="submit"
          className="rounded-md bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800"
        >
          Filter columns
        </button>
        {hasListViewState && (
          <Link href={buildResetListViewHref(basePath, sp)} className="text-xs text-stone-500 hover:underline">
            Reset sort/filters
          </Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">{titleLabel}</th>
              {fields.map((field) => (
                <th key={field.key} className="whitespace-nowrap px-4 py-3">
                  <Link
                    href={buildSortHref(basePath, sp, field.key, sortField, sortDir)}
                    className="inline-flex items-center gap-1 hover:text-stone-900"
                  >
                    {field.label}
                    {sortField === field.key && <span aria-hidden>{sortDir === "asc" ? "▲" : "▼"}</span>}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-stone-100 hover:bg-stone-50">
                <td className="px-4 py-3 font-medium text-stone-900">{renderTitle(row)}</td>
                {fields.map((field) => (
                  <td key={field.key} className="whitespace-nowrap px-4 py-3 text-stone-700">
                    {field.format(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-center text-stone-500">{emptyMessage}</p>}
      </div>
    </div>
  );
}

function ColumnFilterInput({ field, sp }: { field: ListViewFieldDef; sp: ListViewSearchParams }) {
  const get = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : "");
  const labelClass = "text-[10px] font-semibold uppercase tracking-wide text-stone-500";
  const inputClass = "w-24 rounded-md border border-stone-200 px-2 py-1.5 text-xs";

  if (isNumericType(field.type)) {
    const { min, max } = columnFilterParamNames(field.key, field.type) as { min: string; max: string };
    return (
      <div className="flex flex-col gap-1">
        <label className={labelClass}>{field.label}</label>
        <div className="flex gap-1">
          <input type="number" name={min} defaultValue={get(min)} placeholder="Min" className={inputClass} />
          <input type="number" name={max} defaultValue={get(max)} placeholder="Max" className={inputClass} />
        </div>
      </div>
    );
  }

  if (field.type === "date") {
    const { from, to } = columnFilterParamNames(field.key, field.type) as { from: string; to: string };
    return (
      <div className="flex flex-col gap-1">
        <label className={labelClass}>{field.label}</label>
        <div className="flex gap-1">
          <input type="date" name={from} defaultValue={get(from)} className="rounded-md border border-stone-200 px-2 py-1.5 text-xs" />
          <input type="date" name={to} defaultValue={get(to)} className="rounded-md border border-stone-200 px-2 py-1.5 text-xs" />
        </div>
      </div>
    );
  }

  if (field.type === "boolean") {
    const { value } = columnFilterParamNames(field.key, field.type) as { value: string };
    return (
      <div className="flex flex-col gap-1">
        <label className={labelClass}>{field.label}</label>
        <select name={value} defaultValue={get(value)} className="rounded-md border border-stone-200 px-2 py-1.5 text-xs">
          <option value="">Any</option>
          <option value="1">Yes</option>
          <option value="0">No</option>
        </select>
      </div>
    );
  }

  if (field.type === "enum") {
    const { value } = columnFilterParamNames(field.key, field.type) as { value: string };
    return (
      <div className="flex flex-col gap-1">
        <label className={labelClass}>{field.label}</label>
        <select name={value} defaultValue={get(value)} className="rounded-md border border-stone-200 px-2 py-1.5 text-xs">
          <option value="">Any</option>
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const { value } = columnFilterParamNames(field.key, field.type) as { value: string };
  return (
    <div className="flex flex-col gap-1">
      <label className={labelClass}>{field.label}</label>
      <input type="text" name={value} defaultValue={get(value)} placeholder="Contains…" className="rounded-md border border-stone-200 px-2 py-1.5 text-xs" />
    </div>
  );
}
