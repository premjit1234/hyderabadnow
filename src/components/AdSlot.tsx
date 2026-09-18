import { getAdPlacementSettings } from "@/db/queries";
import type { AdPlacementKey } from "@/lib/adPlacements";
import AdSlotRenderer from "./AdSlotRenderer";

// Drop this into any public page at the spot an ad should appear (see
// lib/adPlacements.ts AD_PLACEMENTS for the fixed set of valid keys, kept
// in sync with what /admin/ad-placements lets an admin fill in). Renders
// nothing at all — no wrapper div, no "ad" label — when that slot has no
// code saved or is turned off, so an unused/disabled slot never leaves a
// blank gap in the layout.
export default async function AdSlot({ placementKey, className }: { placementKey: AdPlacementKey; className?: string }) {
  const settings = await getAdPlacementSettings();
  const slot = settings[placementKey];
  if (!slot.enabled || !slot.code.trim()) return null;

  return (
    <div className={className} data-ad-placement={placementKey}>
      <AdSlotRenderer html={slot.code} />
    </div>
  );
}
