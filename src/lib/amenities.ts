// Fixed catalog of amenities an admin can pick for a project. Keeping this as
// a closed list (rather than free text) means every amenity always renders
// with a consistent icon — see components/AmenityIcon.tsx.
export type AmenityIconKey =
  | "pool"
  | "gym"
  | "hall"
  | "play"
  | "garden"
  | "track"
  | "games"
  | "sports"
  | "yoga"
  | "spa"
  | "cafe"
  | "grocery"
  | "pharmacy"
  | "security"
  | "power"
  | "lift"
  | "parking"
  | "pet"
  | "wifi";

export type Amenity = { key: string; label: string; icon: AmenityIconKey };

export const AMENITIES: Amenity[] = [
  { key: "pool", label: "Swimming Pool", icon: "pool" },
  { key: "gym", label: "Gym", icon: "gym" },
  { key: "clubhouse", label: "Clubhouse", icon: "hall" },
  { key: "multipurpose_hall", label: "Multipurpose Hall", icon: "hall" },
  { key: "amphitheatre", label: "Amphitheatre", icon: "hall" },
  { key: "guest_rooms", label: "Guest Rooms", icon: "hall" },
  { key: "play_area", label: "Kids Play Area", icon: "play" },
  { key: "indoor_games", label: "Indoor Games", icon: "games" },
  { key: "garden", label: "Landscaped Garden", icon: "garden" },
  { key: "jogging_track", label: "Jogging Track", icon: "track" },
  { key: "cricket_net", label: "Cricket Net", icon: "sports" },
  { key: "badminton", label: "Badminton Court", icon: "sports" },
  { key: "tennis", label: "Tennis Court", icon: "sports" },
  { key: "pickleball", label: "Pickleball Court", icon: "sports" },
  { key: "yoga", label: "Yoga Deck", icon: "yoga" },
  { key: "senior_area", label: "Senior Citizen Area", icon: "yoga" },
  { key: "spa", label: "Spa & Salon", icon: "spa" },
  { key: "cafe", label: "Cafe", icon: "cafe" },
  { key: "grocery", label: "Grocery Store", icon: "grocery" },
  { key: "pharmacy", label: "Pharmacy & Clinic", icon: "pharmacy" },
  { key: "security", label: "24x7 Security", icon: "security" },
  { key: "power_backup", label: "Power Backup", icon: "power" },
  { key: "lift", label: "Lift", icon: "lift" },
  { key: "parking", label: "Covered Parking", icon: "parking" },
  { key: "pet_zone", label: "Pet Zone", icon: "pet" },
  { key: "wifi", label: "Wi-Fi / Intercom", icon: "wifi" },
];

const AMENITY_BY_KEY = new Map(AMENITIES.map((a) => [a.key, a]));

export function labelForAmenity(key: string) {
  return AMENITY_BY_KEY.get(key)?.label ?? key;
}

export function iconForAmenity(key: string): AmenityIconKey {
  return AMENITY_BY_KEY.get(key)?.icon ?? "hall";
}

/** amenities column is stored as a JSON-encoded string[] of AMENITIES keys. */
export function parseAmenities(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}
