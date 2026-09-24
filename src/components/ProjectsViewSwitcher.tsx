"use client";

import { useState, type ReactNode } from "react";

export type ProjectsView = "catalog" | "list" | "map";

const COOKIE_NAME = "projectsView";

// Non-httpOnly, plain cookie — written client-side on toggle and read back
// server-side (projects/page.tsx, via next/headers cookies()) on the next
// visit to decide the initial view. No server round-trip needed just to
// remember a view preference.
function persistView(view: ProjectsView) {
  try {
    document.cookie = `${COOKIE_NAME}=${view}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // Cookies disabled/blocked — the toggle still works for this visit via
    // component state, it just won't be remembered next time.
  }
}

// Toggles between the server-rendered project grid ("Catalog", the default),
// the new table-based "List" view, and the (client-only) map. Catalog and
// List just get hidden/shown with the `hidden` attribute — cheap, and both
// are already rendered either way. The map is mounted only once "Map" is
// actually selected rather than kept in the DOM `hidden`: Leaflet measures
// its container's size when it initializes, and a container that starts out
// `display:none` would give it a broken (zero-size) layout.
export default function ProjectsViewSwitcher({
  initialView,
  catalog,
  list,
  map,
}: {
  initialView: ProjectsView;
  catalog: ReactNode;
  list: ReactNode;
  map: ReactNode;
}) {
  const [view, setView] = useState<ProjectsView>(initialView);

  function choose(next: ProjectsView) {
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
        <button type="button" onClick={() => choose("map")} className={tabClass(view === "map")}>
          Map
        </button>
      </div>
      <div hidden={view !== "catalog"}>{catalog}</div>
      <div hidden={view !== "list"}>{list}</div>
      {view === "map" && map}
    </div>
  );
}
