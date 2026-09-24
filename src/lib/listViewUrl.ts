// Small URL-building helpers shared by ListingsListView and
// ProjectsListView — kept separate from lib/listViewFields.ts since that
// file is about the field registry/query-building, not link construction.
import { LIST_VIEW_SORT_FIELD_PARAM, LIST_VIEW_SORT_DIR_PARAM } from "@/lib/listViewFields";

export type ListViewSearchParams = Record<string, string | string[] | undefined>;

function toURLSearchParams(sp: ListViewSearchParams): URLSearchParams {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (value == null) continue;
    if (Array.isArray(value)) value.forEach((v) => usp.append(key, v));
    else usp.append(key, value);
  }
  return usp;
}

// A column header's link: sorting by a not-yet-sorted column starts at
// descending (biggest/newest first, the more common intent for price/date),
// clicking the same column again flips to ascending, and a third click flips
// back — a plain 2-state toggle. Every other current param (filters, the
// other view's state, etc.) is preserved unchanged.
export function buildSortHref(
  basePath: string,
  sp: ListViewSearchParams,
  fieldKey: string,
  currentSortField: string | undefined,
  currentSortDir: string | undefined
): string {
  const usp = toURLSearchParams(sp);
  const nextDir = currentSortField === fieldKey && currentSortDir !== "asc" ? "asc" : "desc";
  usp.set(LIST_VIEW_SORT_FIELD_PARAM, fieldKey);
  usp.set(LIST_VIEW_SORT_DIR_PARAM, nextDir);
  return `${basePath}?${usp.toString()}`;
}

// A "reset just the list view" link — drops sort + column-filter params but
// keeps everything else (the main filter bar's selections) intact.
export function buildResetListViewHref(basePath: string, sp: ListViewSearchParams): string {
  const usp = toURLSearchParams(sp);
  usp.delete(LIST_VIEW_SORT_FIELD_PARAM);
  usp.delete(LIST_VIEW_SORT_DIR_PARAM);
  for (const key of Array.from(usp.keys())) {
    if (key.startsWith("cf_")) usp.delete(key);
  }
  return `${basePath}?${usp.toString()}`;
}
