// One-off sample-data script for the independent "Pages" (microsite)
// framework — see schema.ts's micrositePages. Fully independent of the
// projects/listings tables, same as seed-lumbini-vana-microsite.ts. Creates
// the standalone hyderabadnow.in/subishi-breeze page. Safe to run against a
// live database — it only inserts, never wipes existing data. Run with:
//   npm run db:seed-subishi-breeze-microsite
//
// Source: three PDFs supplied by the user —
//   - "Breeze Brochure.pdf" (22-page main brochure)
//   - "subishi_breeze_price_sheet.pdf" (1-page price sheet — pricing/payment
//     terms only; this page schema has no price field, so none of those
//     figures are reproduced here, same as elsewhere in this app)
//   - "800 sqyds east layout landscaping.pdf" (2-page site/garden layout for
//     the 800 sq yd East-facing villa)
// Every fact below is transcribed directly from the brochure or the layout
// PDF. Where a figure isn't given (e.g. the built-up area or bedroom count
// for the 800 sq yd villas — the brochure only gives plot dimensions for
// those, not a room-by-room plan), it is left null rather than estimated —
// same "never fabricate" rule as seed-lumbini-vana-microsite.ts.
//
// RERA note: the brochure's own cover/back-cover pages print "TS RERA:
// P02400011055" — that's what's used below. The separate price-sheet PDF
// prints a different-looking "RERA APPLICATION NO: REA02400108208" (an
// application reference, by its own label, not a granted certificate
// number); since the two documents disagree and this field isn't
// independently verified either way, reraVerified is left false as usual.
import { eq } from "drizzle-orm";
import { db, sqlite } from "./client";
import {
  micrositePages,
  micrositePageImages,
  micrositePageFloorPlans,
  micrositePageFloorPlanImages,
  micrositePageSpecifications,
  micrositePageNearbyPlaces,
} from "./schema";

const PAGE = {
  slug: "subishi-breeze",
  name: "Subishi Breeze",
  tagline: "A Softer Way to Live",
  developerName: "Subishi",
  developerUrl: "https://www.subishi.com",
  locality: "Mansanpalle",
  city: "Hyderabad",
  propertyType: "villa" as const,
  constructionStatus: "under_construction" as const,
  areaAcres: 90,
  totalUnits: 528,
  // Brochure gives a precise built-up figure (4,500 sft) only for the 400 sq
  // yd villas; the 800 sq yd villas' built-up area isn't stated anywhere in
  // the three source PDFs, so min/max area is intentionally left unset here
  // rather than implying every villa is 4,500 sft.
  bhkOptions: "4 Bedroom Villas",
  reraNumber: "P02400011055",
  description:
    "Subishi Breeze is a 90-acre gated villa community by Subishi near Mansanpalle, on Hyderabad's Outer Ring Road corridor close to ORR Exit 15 (Peda Golconda) and the Mansanpalle–Maheshwaram stretch. The development spans 528 villas across 400 and 800 square yard plot configurations, laid out at low density around a network of internal parks — including a 3-acre park, a 2.5-acre park, and six exclusive park zones — built around a 60,000 sq ft clubhouse with a swimming pool, fitness centre, indoor games, and courts for pickleball, cricket and basketball. Every villa comes pre-wired for Subishi's partnership with KEUS home automation, controlling lighting, climate, blinds and entertainment from a touch panel, mobile app, or voice control.",
  brochureUrl: "/brochures/subishi-breeze.pdf",
  masterPlanImageUrl: "/projects/subishi-breeze/master-plan.jpg",
  locationMapImageUrl: "/projects/subishi-breeze/location-map.jpg",
  specificationsIntro:
    "Built on an RCC-framed structure with quality red brickwork, precision-crafted aluminium windows and curated tile and fitting brands — every material at Subishi Breeze is chosen for durability, performance and refined aesthetics.",
  contactPhone: "+91 89199 38932",
  whatsappEnabled: true,
  featured: true,
  published: true,
};

// Mapped onto lib/amenities.ts's fixed AMENITIES catalog from the brochure's
// own "Amenities" icon page (Swimming Pool, Pickleball Court, Play Area,
// Cricket, Auditorium, Indoor Games, Fitness Center, Basketball, Yoga
// Studio, Walking Track) plus the clubhouse, parks, DG backup, lift and
// parking called out elsewhere in the brochure. "Basketball" and
// "Auditorium" have no exact equivalent in the fixed catalog (closest is
// multipurpose_hall for the auditorium) — Basketball has no match at all so
// it's described in the text above instead of mis-tagged.
const AMENITY_KEYS = [
  "pool",
  "clubhouse",
  "multipurpose_hall",
  "play_area",
  "indoor_games",
  "gym",
  "yoga",
  "jogging_track",
  "cricket_net",
  "pickleball",
  "garden",
  "power_backup",
  "lift",
  "parking",
];

const IMAGES = [
  "/projects/subishi-breeze/hero-exterior.jpg",
  "/projects/subishi-breeze/entrance-gate.jpg",
  "/projects/subishi-breeze/street-view.jpg",
  "/projects/subishi-breeze/west-facing-villas.jpg",
  "/projects/subishi-breeze/clubhouse-amenities.jpg",
  "/projects/subishi-breeze/home-automation.jpg",
];

// The brochure's own "EAST FACING" / "WEST FACING" sections give full
// elevation + floor plans only for the 400 sq yd villas (4,500 sft each, 4
// bedrooms across the 3 floors: guest bedroom, master bedroom, bedroom 2,
// bedroom 3). The 800 sq yd villas only get a dimensioned site-plan diagram
// in the brochure (plus the separate East-facing landscaping PDF) — no
// built-up area or bedroom count is given for those, so those fields are
// left null.
const FLOOR_PLANS: {
  label: string;
  plotAreaSqyd: number;
  builtUpAreaSqft: number | null;
  bedrooms: string | null;
  images: string[];
}[] = [
  {
    label: "East Facing Villa — 400 Sq Yd",
    plotAreaSqyd: 400,
    builtUpAreaSqft: 4500,
    bedrooms: "4",
    images: [
      "/projects/subishi-breeze/east-floor-plan-ground-first.jpg",
      "/projects/subishi-breeze/east-floor-plan-second.jpg",
    ],
  },
  {
    label: "West Facing Villa — 400 Sq Yd",
    plotAreaSqyd: 400,
    builtUpAreaSqft: 4500,
    bedrooms: "4",
    images: [
      "/projects/subishi-breeze/west-floor-plan-ground-first.jpg",
      "/projects/subishi-breeze/west-floor-plan-second.jpg",
    ],
  },
  {
    label: "East Facing Villa — 800 Sq Yd",
    plotAreaSqyd: 800,
    builtUpAreaSqft: null,
    bedrooms: null,
    images: [
      "/projects/subishi-breeze/landscape-800sqyd-east.jpg",
      "/projects/subishi-breeze/site-plan-800sqyd.jpg",
    ],
  },
  {
    label: "West Facing Villa — 800 Sq Yd",
    plotAreaSqyd: 800,
    builtUpAreaSqft: null,
    bedrooms: null,
    images: ["/projects/subishi-breeze/site-plan-800sqyd.jpg"],
  },
];

// Transcribed verbatim from the brochure's "Specifications" page, grouped
// into lib/specificationCategories.ts's fixed categories. "Security" has no
// row below since the specifications page doesn't cover it (the general
// gated-community security is a site-wide feature, not itemized here).
const SPECIFICATIONS: { category: string; details: string }[] = [
  {
    category: "Structure",
    details: "RCC framed structure. Quality red brickwork in cement mortar. Grade slab of M25 concrete.",
  },
  {
    category: "Plastering & Painting",
    details:
      "Plastering — Internal: double coat of cement for a smooth finish; External: double coat of sand-faced cement.\nPainting — External: texture-based paint / Apex paint of Asian or ICI make; Internal: two coats of Acrylic Royal Emulsion paint over a coat of primer and putty; Ceiling: two coats of Acrylic Royal Emulsion paint over a coat of primer and putty.",
  },
  {
    category: "Doors & Windows",
    details:
      "Main door: engineered B.T. wood frame of size 4' x 7.5', aesthetically designed shutter with melamine polishing/veneer and designer hardware.\nInternal doors: engineered B.T. wood frame with polished masonite flush shutters.\nWindows: aluminium frames and shutters with glass panels, of Fenesta or equivalent make.",
  },
  {
    category: "Flooring",
    details:
      "Vitrified porcelain tiles (branded or equivalent) in bedrooms, living, drawing, dining and staircase areas. Bathrooms: anti-skid finish vitrified tiles. Balconies: clay or ceramic tiles. Parking area: cement-based tiles over a PCC bed. Utility: anti-skid ceramic tiles.",
  },
  {
    category: "Kitchen",
    details: "Utility/wash area: anti-skid ceramic tiles. Provision for washing machine, dishwasher, and a wet area for washing utensils.",
  },
  {
    category: "Toilets & Bathrooms",
    details:
      "Designer vitrified tile up to 7' height, of AGL/Kajaria or equivalent make. Washbasin with a hot and cold mixer valve. Sanitaryware of Duravit/American Standard or equivalent make. Hot and cold wall mixer with shower. Chrome-plated C.P. fittings, all of Grohe or equivalent make. Solar provision with a built-in electrical backup heater (at an additional cost).",
  },
  {
    category: "Plumbing & Sanitary",
    details:
      "Water supply: ISI mark GI/Kimplast/CPVC piping. Drainage: ISI mark PVC SWR sanitary piping. Softened water supply. STP provided for water recycling. Provision for solar heater plumbing connection. Overhead tank of 500–1000 litre capacity.",
  },
  {
    category: "Electrical",
    details:
      "Concealed copper wiring of Finolex/Anchor or equivalent make, in conduits for lights, fans, plugs and power points. Power outlets for air conditioners in all bedrooms. Plug points for refrigerator, TV and audio systems wherever necessary. A maximum of 30 plug points, 6 AC points and 60 switches are standard; additional points are chargeable. 3-phase supply for each unit. Miniature circuit breakers (MCB) and switches of reputed make.",
  },
  {
    category: "Power Backup",
    details: "DG backup of 3 KVA per home shall be provided.",
  },
  {
    category: "Lift / Elevator",
    details: "Dedicated passenger lift provided within each villa, as shown in the floor plans.",
  },
];

// From the brochure's own "Life in the Fast Lane" page, which groups nearby
// places by drive time rather than by type — kept as the brochure's own
// four time-band categories, exact places and groupings as printed (unlike
// Lumbini Vana's brochure, this one gives real drive-time estimates, so
// they're preserved rather than omitted).
const NEARBY_PLACES = [
  {
    category: "Less than 10 Min Away",
    items: ["NH44", "ORR Exit 15", "Statue of Equality", "JIMS Hospital", "E City Maheshwaram", "Wipro Enterprises", "Subishi Serenity Homes"].join("\n"),
  },
  {
    category: "About 20 Min Away",
    items: ["RGI Airport", "DPS Aerocity", "Amity University", "LV Prasad Eye Institute", "Sancta Maria International School", "Basil Woods School"].join("\n"),
  },
  {
    category: "A Short Drive Away",
    items: ["Neopolis", "The Aga Khan Academy", "Manchester Global School", "Bharat Future City", "Wonderla Amusement Park", "Kanha Shanti Vanam", "Horizon Industrial Park"].join("\n"),
  },
  {
    category: "A Comfortable Drive Away",
    items: ["Financial District", "Knowledge City", "Kokapet SEZ", "Mokila/Shankarpally", "Gandipet", "Continental Hospitals"].join("\n"),
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
      bhkOptions: PAGE.bhkOptions,
      reraNumber: PAGE.reraNumber,
      reraVerified: false, // not independently checked against rera.telangana.gov.in; see header note on the two conflicting source numbers
      description: PAGE.description,
      amenities: JSON.stringify(AMENITY_KEYS),
      brochureUrl: PAGE.brochureUrl,
      masterPlanImageUrl: PAGE.masterPlanImageUrl,
      locationMapImageUrl: PAGE.locationMapImageUrl,
      specificationsIntro: PAGE.specificationsIntro,
      contactPhone: PAGE.contactPhone,
      whatsappEnabled: PAGE.whatsappEnabled,
      featured: PAGE.featured,
      published: PAGE.published,
    })
    .returning();

  await db.insert(micrositePageImages).values(IMAGES.map((url, i) => ({ pageId: page.id, url, sortOrder: i })));

  for (let i = 0; i < FLOOR_PLANS.length; i++) {
    const fp = FLOOR_PLANS[i];
    const [created] = await db
      .insert(micrositePageFloorPlans)
      .values({
        pageId: page.id,
        label: fp.label,
        plotAreaSqyd: fp.plotAreaSqyd,
        builtUpAreaSqft: fp.builtUpAreaSqft,
        bedrooms: fp.bedrooms,
        sortOrder: i,
      })
      .returning();
    if (fp.images.length > 0) {
      await db.insert(micrositePageFloorPlanImages).values(fp.images.map((url, j) => ({ floorPlanId: created.id, url, sortOrder: j })));
    }
  }

  await db.insert(micrositePageSpecifications).values(SPECIFICATIONS.map((s, i) => ({ pageId: page.id, ...s, sortOrder: i })));
  await db.insert(micrositePageNearbyPlaces).values(NEARBY_PLACES.map((n, i) => ({ pageId: page.id, ...n, sortOrder: i })));

  console.log(
    `Created "${page.name}" — /${page.slug} (id ${page.id}), ${IMAGES.length} images, ${FLOOR_PLANS.length} floor plans, ${SPECIFICATIONS.length} spec categories, ${NEARBY_PLACES.length} nearby-place groups.`,
  );
  sqlite.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
