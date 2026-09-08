"use client";

import { useState, type ReactNode } from "react";

// Toggles between the server-rendered project grid and the (client-only)
// map view. The grid just gets hidden/shown with the `hidden` attribute —
// cheap, and it's already rendered either way. The map is mounted only once
// "Map" is actually selected rather than kept in the DOM `hidden`: Leaflet
// measures its container's size when it initializes, and a container that
// starts out `display:none` would give it a broken (zero-size) layout.
export default function ProjectsViewSwitcher({ grid, map }: { grid: ReactNode; map: ReactNode }) {
  const [view, setView] = useState<"list" | "map">("list");

  return (
    <div>
      <div className="mb-4 inline-flex rounded-md border border-stone-200 bg-white p-0.5">
        <button
          type="button"
          onClick={() => setView("list")}
          className={`rounded px-3 py-1.5 text-sm font-medium transition ${
            view === "list" ? "bg-stone-900 text-white" : "text-stone-600 hover:text-stone-900"
          }`}
        >
          List
        </button>
        <button
          type="button"
          onClick={() => setView("map")}
          className={`rounded px-3 py-1.5 text-sm font-medium transition ${
            view === "map" ? "bg-stone-900 text-white" : "text-stone-600 hover:text-stone-900"
          }`}
        >
          Map
        </button>
      </div>
      <div hidden={view !== "list"}>{grid}</div>
      {view === "map" && map}
    </div>
  );
}
