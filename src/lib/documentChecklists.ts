// General, educational "what to check before you buy" document lists shown
// on listing/project pages — one of the most-requested trust features on
// Indian property portals, and one every major one (99acres, MagicBricks,
// Housing.com, NoBroker) leaves as a vague general article rather than
// something scoped to the specific property type you're actually looking
// at. This is informational only, not legal advice — see the disclaimer
// rendered alongside it in DocumentChecklist.tsx; a buyer should always
// have an actual document (title chain, EC, approvals) reviewed by a
// lawyer before paying anything.
export type PropertyTypeKey = "apartment" | "villa" | "independent_house" | "plot" | "commercial";

const SHARED_APARTMENT_VILLA_DOCS = [
  "Sale deed / Agreement of Sale in the seller's name",
  "Encumbrance Certificate (EC) — ideally covering the last 13-30 years",
  "Property tax receipts, paid up to date",
];

export const DOCUMENT_CHECKLISTS: Record<PropertyTypeKey, string[]> = {
  apartment: [
    "RERA registration certificate and number (verify it yourself at rera.telangana.gov.in)",
    "Occupancy Certificate (OC) from GHMC/HMDA — required before anyone can legally move in",
    "Approved building plan, matching what was actually built",
    ...SHARED_APARTMENT_VILLA_DOCS,
    "Fire, lift, and pollution-control NOCs for the building",
    "If resale: share certificate / society membership transfer documents",
  ],
  villa: [
    "Approved building plan/layout (HMDA, GHMC, DTCP, or Gram Panchayat, matching the seller's claim)",
    ...SHARED_APARTMENT_VILLA_DOCS,
    "No-objection certificate from the gated community's RWA/HOA, if applicable",
    "Khata certificate / property register extract",
  ],
  independent_house: [
    "Approved building plan/layout (HMDA, GHMC, DTCP, or Gram Panchayat, matching the seller's claim)",
    ...SHARED_APARTMENT_VILLA_DOCS,
    "Khata certificate / property register extract",
  ],
  plot: [
    "Layout approval from HMDA, DTCP, GHMC, or the local Gram Panchayat — an unapproved layout is Hyderabad's single most common plot-buying trap",
    "Encumbrance Certificate (EC), ideally the last 30 years",
    "Registered sale deed and full chain-of-title documents from prior owners",
    "Dharani / land records extract matching the seller's name and the plot's survey number",
    "Physical boundary verification against the approved layout — corner/dimensions can differ from paper",
    "Conversion certificate, if the land was ever agricultural",
  ],
  commercial: [
    "RERA registration, if the project is registered as a commercial RERA project",
    "Occupancy Certificate (OC) and approved building plan",
    "Fire and pollution-control NOCs",
    "Zoning/trade-license compatibility for your intended use",
    "Sale deed or lease deed, and up-to-date property tax receipts",
  ],
};

export function documentChecklistFor(propertyType: string): string[] {
  return DOCUMENT_CHECKLISTS[propertyType as PropertyTypeKey] ?? [];
}
