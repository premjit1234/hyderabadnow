// Fixed set of specification categories for a microsite page's
// "Specifications" section — modeled on the ~10 labelled categories a
// typical villa/apartment brochure's spec sheet uses (structure, plumbing,
// electrical, etc.), same structure as the reference site this feature was
// built from. Fixed rather than a free-form repeater: it gives the admin a
// guided checklist instead of a blank "add a category" form, and a category
// the admin leaves blank simply doesn't render (see
// micrositePageSpecifications in schema.ts).
export const SPECIFICATION_CATEGORIES = [
  "Structure",
  "Plastering & Painting",
  "Doors & Windows",
  "Flooring",
  "Kitchen",
  "Toilets & Bathrooms",
  "Plumbing & Sanitary",
  "Electrical",
  "Power Backup",
  "Lift / Elevator",
  "Security",
] as const;

export type SpecificationCategory = (typeof SPECIFICATION_CATEGORIES)[number];

/** Turns a specification category label into a stable form-field key (e.g.
 * "Lift / Elevator" -> "lift_elevator") — used both when rendering the
 * fixed-category textareas (MicrositePageForm.tsx) and when reading them
 * back in admin/micrositeActions.ts. Lives here, not in micrositeActions.ts,
 * because every export of a "use server" file becomes an RPC-style server
 * action — fine for the admin*Action functions, but this needs to run
 * synchronously in the client form's render. */
export function specCategoryKey(category: string): string {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
