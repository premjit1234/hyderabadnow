// Straight-line ("as the crow flies") distance helpers for a lightweight
// "location & connectivity" section on listing/project pages — how far a
// property is from the nearest Metro station and from a handful of major
// employment hubs, computed from the lat/long every listing and project
// already stores (see schema.ts) rather than a paid Distance Matrix API.
//
// Deliberately NOT drive-time estimates: Hyderabad traffic makes any
// speed-based guess (e.g. "assume 25 km/h") wildly unreliable and, worse,
// falsely precise-looking — a straight-line km figure is honest about what
// it actually is, and still useful for comparing two properties.
//
// HYDERABAD_METRO_STATIONS is a curated subset of major/interchange
// stations (not all ~57 stations on the network), each coordinate taken
// from that station's own Wikipedia infobox — safe to extend with more
// stations later; nothing else in the app assumes this list is exhaustive.
export type GeoPoint = { name: string; lat: number; lng: number };

export const HYDERABAD_METRO_STATIONS: GeoPoint[] = [
  { name: "Miyapur", lat: 17.4964, lng: 78.3731 },
  { name: "KPHB Colony", lat: 17.49378, lng: 78.401795 },
  { name: "Kukatpally", lat: 17.4851155, lng: 78.409369 },
  { name: "Ameerpet", lat: 17.4348028, lng: 78.4480111 },
  { name: "Begumpet", lat: 17.4375, lng: 78.45667 },
  { name: "Secunderabad West", lat: 17.4338, lng: 78.4987 },
  { name: "Madhapur", lat: 17.4372, lng: 78.3982 },
  { name: "HITEC City", lat: 17.44889, lng: 78.38306 },
  { name: "Durgam Cheruvu", lat: 17.44278, lng: 78.3875 },
  { name: "Raidurg", lat: 17.4422, lng: 78.3773 },
  { name: "Jubilee Hills Check Post", lat: 17.416471, lng: 78.438247 },
  { name: "Dilsukhnagar", lat: 17.3686, lng: 78.5257 },
  { name: "Nagole", lat: 17.3908477, lng: 78.5587195 },
  { name: "Uppal", lat: 17.3987948, lng: 78.5538439 },
  { name: "LB Nagar", lat: 17.348426, lng: 78.550959 },
];

// A short, deliberately curated list of the employment hubs that most
// influence a Hyderabad property decision — not every notable place in the
// city, just the ones people actually commute to. Easy to extend if that
// changes (e.g. a new IT corridor opens up).
export const HYDERABAD_WORK_HUBS: GeoPoint[] = [
  { name: "HITEC City", lat: 17.44889, lng: 78.38306 },
  { name: "Gachibowli", lat: 17.4372, lng: 78.3444 },
  { name: "Financial District", lat: 17.417, lng: 78.35 },
  { name: "Secunderabad", lat: 17.4338, lng: 78.4987 },
  { name: "RGIA Airport (Shamshabad)", lat: 17.23, lng: 78.4319 },
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's mean radius, km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export type NamedDistance = { name: string; distanceKm: number };

/** The single closest curated Metro station to a given point, or null if the list is ever empty. */
export function nearestMetroStation(lat: number, lng: number): NamedDistance | null {
  if (HYDERABAD_METRO_STATIONS.length === 0) return null;
  let best = HYDERABAD_METRO_STATIONS[0];
  let bestKm = haversineKm(lat, lng, best.lat, best.lng);
  for (const station of HYDERABAD_METRO_STATIONS.slice(1)) {
    const km = haversineKm(lat, lng, station.lat, station.lng);
    if (km < bestKm) {
      best = station;
      bestKm = km;
    }
  }
  return { name: best.name, distanceKm: round1(bestKm) };
}

/** Distance to every curated work hub, nearest first. */
export function distancesToHubs(lat: number, lng: number): NamedDistance[] {
  return HYDERABAD_WORK_HUBS.map((hub) => ({
    name: hub.name,
    distanceKm: round1(haversineKm(lat, lng, hub.lat, hub.lng)),
  })).sort((a, b) => a.distanceKm - b.distanceKm);
}
