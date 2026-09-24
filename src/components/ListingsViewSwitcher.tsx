"use client";

import { useState, type ReactNode } from "react";

export type ListingsView = "catalog" | "list";

const COOKIE_NAME = "listingsView";

// Same cookie-persistence approach as ProjectsViewSwitcher — see its
// comments for why this is a plain client-side cookie rather than a server
// action round-trip.
function persistView(view: ListingsView) {
  try {
    document.cookie = `${COOKIE_NAME}=${view}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // Cookies disabled/blocked — toggle still works this visit, just won't
    // be remembered next time.
  }
}

// Toggles /browse between the existing card grid ("Catalog", the default)
// and the new table-based "List" view. Both are already server-rendered
// from the same filtered results, so switching is just a `hidden` toggle —
// no client-side re-fetch needed.
export default function ListingsViewSwitcher({
  initialView,
  catalog,
  list,
}: {
  initialView: ListingsView;
  catalog: ReactNode;
  list: ReactNode;
}) {
  const [view, setView] = useState<ListingsView>(initialView);

  function choose(next: ListingsView) {
    setView(next);
    persistView(next);
  }

  const tabClass = (active: boolean) =>
    `rounded px-3 py-1.5 text-sm font-medium transition ${
      active ? "bg-stone-900 text-white" : "text-stone-600 hover:text-stone-900"
    }`;

  return (
    <div>
      <div className="mb-4 inline-flex rounded-md border border-stone-200 bg-white p-0.5">
        <button type="button" onClick={() => choose("catalog")} className={tabClass(view === "catalog")}>
          Catalog
        </button>
        <button type="button" onClick={() => choose("list")} className={tabClass(view === "list")}>
          List
        </button>
      </div>
      <div hidden={view !== "catalog"}>{catalog}</div>
      <div hidden={view !== "list"}>{list}</div>
    </div>
  );
}
