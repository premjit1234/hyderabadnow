"use client";

import { useActionState, useState } from "react";
import { adminUpdateListViewFieldSettingsAction, type ActionState } from "@/app/admin/actions";
import type { ListViewFieldMeta, ListViewFieldSettingsConfig, PropertyTypeKey } from "@/lib/listViewFields";

type EntityKey = "listing" | "project";

const ENTITY_TABS: { key: EntityKey; label: string }[] = [
  { key: "listing", label: "Listings" },
  { key: "project", label: "Projects" },
];

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: "Apartment",
  villa: "Villa",
  independent_house: "Independent House",
  plot: "Plot",
  commercial: "Commercial",
};

// Deep-ish clone since the config is plain JSON (arrays of strings nested two
// levels deep) — cheap, and keeps every edit from mutating the props object
// React handed us.
function cloneConfig(config: ListViewFieldSettingsConfig): ListViewFieldSettingsConfig {
  return {
    listing: Object.fromEntries(Object.entries(config.listing).map(([k, v]) => [k, [...v]])) as Record<
      PropertyTypeKey,
      string[]
    >,
    project: Object.fromEntries(Object.entries(config.project).map(([k, v]) => [k, [...v]])) as Record<
      PropertyTypeKey,
      string[]
    >,
  };
}

export default function AdminListViewFieldSettingsForm({
  listingFields,
  projectFields,
  propertyTypes,
  initialConfig,
}: {
  listingFields: ListViewFieldMeta[];
  projectFields: ListViewFieldMeta[];
  propertyTypes: readonly string[];
  initialConfig: ListViewFieldSettingsConfig;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    adminUpdateListViewFieldSettingsAction,
    null
  );
  const [config, setConfig] = useState(() => cloneConfig(initialConfig));
  const [entity, setEntity] = useState<EntityKey>("listing");
  const [propertyType, setPropertyType] = useState<string>(propertyTypes[0]);

  const fieldMeta = entity === "listing" ? listingFields : projectFields;
  const fieldByKey = new Map(fieldMeta.map((f) => [f.key, f]));
  const selected = config[entity][propertyType as PropertyTypeKey] ?? [];
  const available = fieldMeta.filter((f) => !selected.includes(f.key));

  function updateSelected(next: string[]) {
    setConfig((prev) => {
      const clone = cloneConfig(prev);
      clone[entity][propertyType as PropertyTypeKey] = next;
      return clone;
    });
  }

  function addField(key: string) {
    updateSelected([...selected, key]);
  }
  function removeField(key: string) {
    updateSelected(selected.filter((k) => k !== key));
  }
  function moveField(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= selected.length) return;
    const next = [...selected];
    [next[index], next[target]] = [next[target], next[index]];
    updateSelected(next);
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* Every combo's current state, always present regardless of which tab
          is showing, so switching tabs never loses an edit made elsewhere. */}
      {ENTITY_TABS.map(({ key: e }) =>
        propertyTypes.map((pt) => (
          <input
            key={`${e}_${pt}`}
            type="hidden"
            name={`columns_${e}_${pt}`}
            value={config[e][pt as PropertyTypeKey]?.join(",") ?? ""}
          />
        ))
      )}

      <div className="inline-flex w-fit rounded-md border border-stone-200 bg-white p-0.5">
        {ENTITY_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setEntity(tab.key)}
            className={`rounded px-4 py-1.5 text-sm font-medium transition ${
              entity === tab.key ? "bg-stone-900 text-white" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {propertyTypes.map((pt) => (
          <button
            key={pt}
            type="button"
            onClick={() => setPropertyType(pt)}
            className={`rounded-full border px-3.5 py-1.5 text-sm ${
              propertyType === pt
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-stone-200 bg-white text-stone-700 hover:border-indigo-400"
            }`}
          >
            {PROPERTY_TYPE_LABELS[pt] ?? pt}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
            Selected columns, in order
          </p>
          {selected.length === 0 ? (
            <p className="text-sm text-stone-500">
              No columns selected — add some from the right, or leave empty to use the built-in defaults.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {selected.map((key, index) => (
                <li
                  key={key}
                  className="flex items-center justify-between gap-2 rounded-md border border-stone-100 bg-stone-50 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-stone-800">{fieldByKey.get(key)?.label ?? key}</span>
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveField(index, -1)}
                      disabled={index === 0}
                      className="rounded px-1.5 py-0.5 text-stone-500 hover:bg-stone-200 disabled:opacity-30"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveField(index, 1)}
                      disabled={index === selected.length - 1}
                      className="rounded px-1.5 py-0.5 text-stone-500 hover:bg-stone-200 disabled:opacity-30"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeField(key)}
                      className="rounded px-1.5 py-0.5 text-red-600 hover:bg-red-50"
                      aria-label="Remove"
                    >
                      ✕
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">Add a column</p>
          {available.length === 0 ? (
            <p className="text-sm text-stone-500">Every available field is already shown.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {available.map((f) => (
                <li key={f.key} className="flex items-center justify-between gap-2 px-1 py-1 text-sm">
                  <span className="text-stone-700">{f.label}</span>
                  <button
                    type="button"
                    onClick={() => addField(f.key)}
                    className="rounded-full border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-600 hover:border-indigo-400 hover:text-indigo-700"
                  >
                    + Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="text-xs text-stone-500">
        The title/name column always shows first and links through to the listing or project — it isn&apos;t part
        of this list. Changes apply to every {PROPERTY_TYPE_LABELS[propertyType] ?? propertyType}{" "}
        {entity === "listing" ? "listing" : "project"} once saved, and only take effect after you click Save below
        (switching tabs above keeps your edits, it just doesn&apos;t save them yet).
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save changes"}
        </button>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.success && <p className="text-sm text-emerald-700">{state.success}</p>}
      </div>
    </form>
  );
}
