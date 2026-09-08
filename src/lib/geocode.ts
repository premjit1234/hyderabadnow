// Free geocoding via OpenStreetMap's Nominatim service — no API key needed.
// Used to auto-fill a project's map pin (latitude/longitude) from its
// locality/city text whenever it's created or its locality/city changes.
//
// Nominatim's usage policy (https://operations.osmfoundation.org/policies/nominatim/)
// requires a real identifying User-Agent and caps free use at roughly one
// request per second with no concurrent requests — fine for one-off calls
// from the single-project admin form, but callers that geocode several rows
// in a row (see commitBulkProjects in bulkProjectActions.ts) must space
// their calls out rather than firing them concurrently.
export type GeocodeResult = { latitude: number; longitude: number };

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "HyderabadNow/1.0 (+https://hyderabadnow.in)";

export async function geocodeLocality(locality: string, city: string): Promise<GeocodeResult | null> {
  const query = [locality, city, "India"].filter((p) => p && p.trim()).join(", ");
  if (!query.trim()) return null;

  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
      // A slow/unreachable geocoder should never hang project creation.
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as unknown;
    if (!Array.isArray(data) || data.length === 0) return null;

    const first = data[0] as { lat?: unknown; lon?: unknown };
    const latitude = Number(first.lat);
    const longitude = Number(first.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return { latitude, longitude };
  } catch {
    // Network hiccup, timeout, rate limit, malformed response — a project
    // simply gets no pin rather than failing to save.
    return null;
  }
}

/** Nominatim's usage policy caps free use at ~1 request/second. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
