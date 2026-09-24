import { documentChecklistFor } from "@/lib/documentChecklists";

// Shared by both the listing page and the project page — a collapsible,
// property-type-specific list of documents a buyer should ask to see.
// General education, not legal advice (see the disclaimer below and
// lib/documentChecklists.ts's own comment) — always closed by default
// (<details>, no `open`) so it doesn't compete for attention with the
// listing/project's own content.
export default function DocumentChecklist({ propertyType }: { propertyType: string }) {
  const items = documentChecklistFor(propertyType);
  if (items.length === 0) return null;

  return (
    <details className="mt-8 rounded-lg border border-stone-200 bg-stone-50 p-4">
      <summary className="cursor-pointer text-sm font-bold text-stone-900">
        What documents should you check before buying?
      </summary>
      <ul className="mt-3 flex flex-col gap-2 text-sm text-stone-700">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-stone-400">
        General guidance, not legal advice — have an actual lawyer verify title, encumbrance, and approvals before
        you pay anything.
      </p>
    </details>
  );
}
