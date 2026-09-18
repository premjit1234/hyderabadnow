// The fixed set of ad slots an admin can fill in from /admin/ad-placements.
// Mirrors the LISTING_EXTRA_FIELDS pattern in listingFields.ts: a small
// constant list of keys/labels, a JSON blob in the DB keyed by those same
// keys (see db/schema.ts adPlacementSettings, db/queries.ts
// getAdPlacementSettings), and a resolver that fills in defaults for
// anything not yet saved (a placement added after go-live, or a fresh
// install with no row at all).
//
// Each placement is a spot on a public page where an admin can paste a
// third-party ad network's HTML/script snippet (Google AdSense's "Ad unit"
// code, for example) and have it go live immediately — no redeploy. See
// components/AdSlot.tsx for how the pasted code actually gets rendered
// (and, critically, how its <script> tags get to actually execute).
export const AD_PLACEMENTS = [
  {
    key: "home_below_featured_listings",
    label: "Homepage — below \"Featured listings\"",
    description: "Shows once, between the featured listings and featured projects sections.",
  },
  {
    key: "browse_between_filters_results",
    label: "Browse page — between filters and results",
    description: "Shows once, right above the search results grid on /browse.",
  },
  {
    key: "listing_sidebar",
    label: "Listing detail page — sidebar",
    description: "Shows once, below the contact/inquiry card on every /listing/[id] page.",
  },
] as const;

export type AdPlacementKey = (typeof AD_PLACEMENTS)[number]["key"];

export type AdPlacementSlot = { code: string; enabled: boolean };
export type AdPlacementSettings = Record<AdPlacementKey, AdPlacementSlot>;

// A slot with saved code defaults to enabled — an admin filling in the
// textarea and clicking Save expects the ad to go live immediately, not to
// need a second "now turn it on" step. Only a slot with no code at all
// (nothing to render anyway) or one explicitly unchecked stays off.
export function resolveAdPlacementSettings(
  stored: Partial<Record<string, Partial<AdPlacementSlot>>> | null | undefined
): AdPlacementSettings {
  const result = {} as AdPlacementSettings;
  for (const placement of AD_PLACEMENTS) {
    const savedCode = stored?.[placement.key]?.code ?? "";
    result[placement.key] = {
      code: savedCode,
      enabled: stored?.[placement.key]?.enabled ?? Boolean(savedCode.trim()),
    };
  }
  return result;
}
