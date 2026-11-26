// One-off sample-data script for the independent "Pages" (microsite)
// framework — see schema.ts's micrositePages. Companion to
// seed-lumbini-vana.ts (which seeds the *project* row for /projects/
// lumbini-vana); this one is fully independent of that and creates the
// standalone hyderabadnow.in/lumbinivana page instead. Safe to run against a
// live database — it only inserts, never wipes existing data. Run with:
//   npm run db:seed-lumbini-vana-microsite
//
// Source: the same "Lumbini Vana" brochure PDF as seed-lumbini-vana.ts
// (MINI_E_BROCHURE_VANA_2026.pdf). Every fact below is transcribed directly
// from it. The brochure has no "Specifications" section (structure,
// plumbing, electrical, etc.), so none is seeded here — never fabricated,
// same rule as that file.
import { eq } from "drizzle-orm";
import { db, sqlite } from "./client";
import { micrositePages, micrositePageImages, micrositePageFloorPlans, micrositePageNearbyPlaces } from "./schema";

const PAGE = {
  slug: "lumbinivana",
  name: "Lumbini Vana",
  tagline: "Where Tranquility Comes Home",
  developerName: "Lumbini Constructions",
  developerUrl: "https://www.lumbini.com",
  locality: "Kollur",
  city: "Hyderabad",
  propertyType: "villa" as const,
  constructionStatus: "under_construction" as const,
  areaAcres: 24,
  totalUnits: 174,
  // Smallest/largest built-up area across the brochure's 6 villa
  // configurations (3809–5916 sqft) — see the floor plans below for each.
  minAreaSqft: 3809,
  maxAreaSqft: 5916,
  reraNumber: "P01100011057",
  description:
    "Lumbini Vana — “Forest of Tranquility” — is a 24-acre gated villa community by Lumbini Constructions in Kollur, on Hyderabad's Outer Ring Road corridor near Gachibowli and the Financial District. The development spans 174 villas across G+2 floors, built around a 70,000 sq ft clubhouse and an extensive landscaped master plan with dedicated zones for sports, leisure, and family recreation — from a swimming pool, gym, spa, and banquet hall to badminton and squash courts, a cricket practice net, tennis court, kids' play areas, and a dedicated pet park. Villas are offered in multiple configurations from 267 to 450 square yards, in both east- and west-facing orientations.",
  brochureUrl: "/brochures/lumbini-vana.pdf",
  masterPlanImageUrl: "/projects/lumbini-vana/master-plan.jpg",
  locationMapImageUrl: "/projects/lumbini-vana/location-map.jpg",
  contactPhone: "+91 90710 20009",
  whatsappEnabled: true,
  featured: true,
  published: true,
};

const AMENITY_KEYS = [
  "pool",
  "gym",
  "clubhouse",
  "multipurpose_hall",
  "amphitheatre",
  "play_area",
  "garden",
  "jogging_track",
  "cricket_net",
  "badminton",
  "tennis",
  "yoga",
  "spa",
  "security",
  "parking",
  "pet_zone",
];

const IMAGES = [
  "/projects/lumbini-vana/hero-entrance.jpg",
  "/projects/lumbini-vana/villa-exterior.jpg",
  "/projects/lumbini-vana/villa-configurations.jpg",
  "/projects/lumbini-vana/clubhouse-exterior.jpg",
  "/projects/lumbini-vana/clubhouse-amenities.jpg",
];

// The 6 villa configurations from the brochure's own grid — exact sq yd/sq
// ft figures and facing as printed. No plan images are attached (the
// brochure only has one composite render per villa, already in the gallery
// above, not an isolated per-floor plan image), which is why floorPlans has
// no accompanying image-insert step below.
const FLOOR_PLANS = [
  { label: "East Facing Villa", plotAreaSqyd: 267, builtUpAreaSqft: 3809 },
  { label: "West Facing Villa", plotAreaSqyd: 267, builtUpAreaSqft: 4062 },
  { label: "East Facing Villa — Design A", plotAreaSqyd: 450, builtUpAreaSqft: 5916 },
  { label: "East Facing Villa — Design B", plotAreaSqyd: 450, builtUpAreaSqft: 5916 },
  { label: "West Facing Villa — 350 Sq Yd", plotAreaSqyd: 350, builtUpAreaSqft: 4473 },
  { label: "West Facing Villa — 450 Sq Yd", plotAreaSqyd: 450, builtUpAreaSqft: 5698 },
];

// Named places from the brochure's own location map, grouped by type —
// no distances given in the brochure (it's a schematic route map, not a
// distance chart), so none are invented here; see this file's header
// comment.
const NEARBY_PLACES = [
  {
    category: "Schools & Education",
    items: [
      "Delhi Public School",
      "Samashti International School",
      "Shrutham School International",
      "SMP Universal School",
      "ICFAI Business School",
      "The Shri Ram Academy International School",
    ].join("\n"),
  },
  {
    category: "Business & IT Hubs",
    items: ["Wipro Gopanpally Campus", "Gachibowli", "Financial District", "Wipro Circle"].join("\n"),
  },
  {
    category: "Hospitality & Healthcare",
    items: ["Hyatt Gachibowli", "Continental Hospital"].join("\n"),
  },
  {
    category: "Connectivity",
    items: ["ORR Exit-2 (Kollur)", "Gachibowli Stadium", "Narsingi", "Kokapet"].join("\n"),
  },
];

async function main() {
  const existing = await db.query.micrositePages.findFirst({ where: eq(micrositePages.slug, PAGE.slug) });
  if (existing) {
    console.log(`"${PAGE.slug}" already exists (id ${existing.id}) — skipping insert.`);
    sqlite.close();
    return;
  }

  const [page] = await db
    .insert(micrositePages)
    .values({
      slug: PAGE.slug,
      name: PAGE.name,
      tagline: PAGE.tagline,
      developerName: PAGE.developerName,
      developerUrl: PAGE.developerUrl,
      locality: PAGE.locality,
      city: PAGE.city,
      propertyType: PAGE.propertyType,
      constructionStatus: PAGE.constructionStatus,
      areaAcres: PAGE.areaAcres,
      totalUnits: PAGE.totalUnits,
      minAreaSqft: PAGE.minAreaSqft,
      maxAreaSqft: PAGE.maxAreaSqft,
      reraNumber: PAGE.reraNumber,
      reraVerified: false, // not independently checked against rera.telangana.gov.in
      description: PAGE.description,
      amenities: JSON.stringify(AMENITY_KEYS),
      brochureUrl: PAGE.brochureUrl,
      masterPlanImageUrl: PAGE.masterPlanImageUrl,
      locationMapImageUrl: PAGE.locationMapImageUrl,
      contactPhone: PAGE.contactPhone,
      whatsappEnabled: PAGE.whatsappEnabled,
      featured: PAGE.featured,
      published: PAGE.published,
    })
    .returning();

  await db.insert(micrositePageImages).values(IMAGES.map((url, i) => ({ pageId: page.id, url, sortOrder: i })));
  await db.insert(micrositePageFloorPlans).values(FLOOR_PLANS.map((fp, i) => ({ pageId: page.id, ...fp, sortOrder: i })));
  await db.insert(micrositePageNearbyPlaces).values(NEARBY_PLACES.map((n, i) => ({ pageId: page.id, ...n, sortOrder: i })));

  console.log(`Created "${page.name}" — /${page.slug} (id ${page.id}), ${IMAGES.length} images, ${FLOOR_PLANS.length} floor plans.`);
  sqlite.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
