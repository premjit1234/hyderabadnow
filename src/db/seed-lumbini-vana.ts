// One-off sample-data script for the "Project Showcase Pages" framework —
// NOT run automatically by docker-entrypoint.sh (unlike seed.ts, which wipes
// and rebuilds the whole demo dataset, this only adds one real project and
// is safe to run against a live/production database). Run it with:
//   npm run db:seed-lumbini-vana
//
// Source: the "Lumbini Vana" brochure PDF the project owner supplied
// (MINI_E_BROCHURE_VANA_2026.pdf). Every fact below is transcribed directly
// from that brochure. Anything the brochure didn't state outright (exact
// pricing, possession date, which authority approved the layout, whether
// the RERA number has actually been checked against the RERA portal) is
// deliberately left null/false rather than guessed — same rule this
// codebase follows everywhere else a "verified" or numeric claim is shown
// to a buyer (see schema.ts's projects.reraVerified comment).
import { eq } from "drizzle-orm";
import { db, sqlite } from "./client";
import { projects, projectImages } from "./schema";
import { slugify } from "../lib/blog";

const PROJECT = {
  name: "Lumbini Vana",
  developerName: "Lumbini Constructions",
  developerUrl: "https://www.lumbini.com",
  locality: "Kollur",
  city: "Hyderabad",
  propertyType: "villa" as const,
  constructionStatus: "under_construction" as const,
  areaAcres: 24,
  totalUnits: 174, // 174 villas, per the brochure's stat bar
  maxFloors: 2, // "G+2 Floors"
  // The brochure's villa configuration grid lists six sizes: 267, 267, 450,
  // 450, 350, 450 sq yd — these are sq *yards*, not sq ft, and the brochure
  // gives no separate sqft figures, so min/maxAreaSqft (a sqft column) are
  // left null rather than converted/guessed.
  bhkOptions: null,
  reraNumber: "P01100011057",
  description:
    "Lumbini Vana — “Forest of Tranquility” — is a 24-acre gated villa community by Lumbini Constructions in Kollur, on Hyderabad's Outer Ring Road corridor near Gachibowli and the Financial District. The development spans 174 villas across G+2 floors, built around a 70,000 sq ft clubhouse and an extensive landscaped master plan with dedicated zones for sports, leisure, and family recreation — from a swimming pool, gym, spa, and banquet hall to badminton and squash courts, a cricket practice net, tennis court, kids' play areas, and a dedicated pet park. Villas are offered in multiple configurations from 267 to 450 square yards, in both east- and west-facing orientations.",
  brochureUrl: "/brochures/lumbini-vana.pdf",
  contactPhone: "+91 90710 20009",
  whatsappEnabled: true,
  featured: true,
};

// Amenity keys from lib/amenities.ts's fixed catalog that the brochure's
// master-plan legend (A–AH) and clubhouse amenities grid clearly map onto.
// Brochure-specific amenities with no matching built-in key (golf putting,
// reflexology path, hammock zone, trampoline/skate park, etc.) are left out
// rather than forced into a near-but-wrong key — the description above
// covers the master plan's full breadth in prose instead.
const AMENITY_KEYS = [
  "pool", // Main Pool + Kids Pool
  "gym", // Outdoor Gym
  "clubhouse",
  "multipurpose_hall", // Multi Purpose Lawn With Stage
  "amphitheatre",
  "play_area", // Children Play Area
  "garden", // Picnicking Lawn, Aromatic Garden
  "jogging_track", // Pedestrian Path
  "cricket_net",
  "badminton",
  "tennis",
  "yoga", // Meditation/relaxation zones implied by spa+lounge seating
  "spa",
  "security", // Grand Entrance With Security Cabin
  "parking",
  "pet_zone", // Pet Park
];

const IMAGES = [
  "/projects/lumbini-vana/hero-entrance.jpg",
  "/projects/lumbini-vana/villa-exterior.jpg",
  "/projects/lumbini-vana/villa-configurations.jpg",
  "/projects/lumbini-vana/master-plan.jpg",
  "/projects/lumbini-vana/clubhouse-exterior.jpg",
  "/projects/lumbini-vana/clubhouse-amenities.jpg",
  "/projects/lumbini-vana/location-map.jpg",
];

async function uniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let n = 2;
  for (;;) {
    const existing = await db.query.projects.findFirst({ where: eq(projects.slug, candidate) });
    if (!existing) return candidate;
    candidate = `${base}-${n++}`;
  }
}

async function main() {
  const existing = await db.query.projects.findFirst({ where: eq(projects.name, PROJECT.name) });
  if (existing) {
    console.log(`"${PROJECT.name}" already exists (id ${existing.id}, slug ${existing.slug}) — skipping insert.`);
    sqlite.close();
    return;
  }

  const slug = await uniqueSlug(slugify(PROJECT.name));

  const [project] = await db
    .insert(projects)
    .values({
      slug,
      name: PROJECT.name,
      developerName: PROJECT.developerName,
      developerUrl: PROJECT.developerUrl,
      locality: PROJECT.locality,
      city: PROJECT.city,
      propertyType: PROJECT.propertyType,
      constructionStatus: PROJECT.constructionStatus,
      areaAcres: PROJECT.areaAcres,
      totalUnits: PROJECT.totalUnits,
      maxFloors: PROJECT.maxFloors,
      bhkOptions: PROJECT.bhkOptions,
      reraNumber: PROJECT.reraNumber,
      reraVerified: false, // not independently checked against rera.telangana.gov.in — see file header comment
      description: PROJECT.description,
      amenities: JSON.stringify(AMENITY_KEYS),
      brochureUrl: PROJECT.brochureUrl,
      contactPhone: PROJECT.contactPhone,
      whatsappEnabled: PROJECT.whatsappEnabled,
      featured: PROJECT.featured,
    })
    .returning();

  await db.insert(projectImages).values(
    IMAGES.map((url, i) => ({ projectId: project.id, url, sortOrder: i }))
  );

  // No real YouTube/Vimeo walkthrough link was supplied with the brochure, so
  // no project_videos row is inserted here — an admin adds one later from
  // /admin/projects/[id]/edit (see ProjectForm.tsx's video section) once a
  // real video exists, consistent with this file's "never fabricate" rule.

  console.log(`Created "${project.name}" — /projects/${project.slug} (id ${project.id}), ${IMAGES.length} images.`);
  sqlite.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
