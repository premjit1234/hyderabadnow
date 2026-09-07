import { sql } from "drizzle-orm";
import { db, sqlite } from "./client";
import {
  users,
  listings,
  listingImages,
  homeTiles,
  projects,
  projectImages,
  legalPages,
  blogPosts,
  locations,
} from "./schema";
import { hashPassword } from "../lib/auth";
import { HYDERABAD_LOCALITIES } from "../lib/localities";
import { LEGAL_PAGE_DEFAULTS } from "./legal-page-defaults";

async function main() {
  console.log("Seeding database...");

  // Clear existing data (dev convenience)
  sqlite.exec(
    "DELETE FROM listing_images; DELETE FROM inquiries; DELETE FROM listings; DELETE FROM users; DELETE FROM home_tiles; DELETE FROM project_images; DELETE FROM projects; DELETE FROM blog_comments; DELETE FROM blog_images; DELETE FROM blog_posts; DELETE FROM locations;"
  );

  const demoPasswordHash = await hashPassword("password123");

  const [agent1] = await db
    .insert(users)
    .values({
      name: "Priya Reddy",
      email: "priya.agent@hyderabadnow.in",
      passwordHash: demoPasswordHash,
      role: "agent",
      phone: "+91 98480 11223",
      agencyName: "Reddy Realty Hyderabad",
    })
    .returning();

  const [agent2] = await db
    .insert(users)
    .values({
      name: "Kiran Kumar",
      email: "kiran.agent@hyderabadnow.in",
      passwordHash: demoPasswordHash,
      role: "agent",
      phone: "+91 90000 44556",
      agencyName: "Kumar Properties",
    })
    .returning();

  const [seller1] = await db
    .insert(users)
    .values({
      name: "Anitha Rao",
      email: "anitha.owner@hyderabadnow.in",
      passwordHash: demoPasswordHash,
      role: "seller",
      phone: "+91 91234 56789",
    })
    .returning();

  const [buyer1] = await db
    .insert(users)
    .values({
      name: "Rahul Sharma",
      email: "rahul.buyer@hyderabadnow.in",
      passwordHash: demoPasswordHash,
      role: "buyer",
      phone: "+91 99887 76655",
    })
    .returning();

  const [admin] = await db
    .insert(users)
    .values({
      name: "Admin",
      email: "admin@hyderabadnow.in",
      passwordHash: demoPasswordHash,
      role: "admin",
    })
    .returning();

  console.log("Users:", { agent1: agent1.id, agent2: agent2.id, seller1: seller1.id, buyer1: buyer1.id });

  // Developer projects — admin-managed pages a listing can optionally belong
  // to (see /admin/projects). A couple of sample projects here so the feature
  // has something to look at out of the box; production admins add their own.
  const [skylineProject] = await db
    .insert(projects)
    .values({
      name: "Skyline Residency",
      developerName: "Reddy Realty Hyderabad",
      locality: "Gachibowli",
      city: "Hyderabad",
      propertyType: "apartment",
      constructionStatus: "ready_to_move",
      areaAcres: 12.5,
      totalUnits: 960,
      towers: 4,
      maxFloors: 22,
      unitsPerFloor: "6-8",
      minAreaSqft: 1200,
      maxAreaSqft: 2400,
      bhkOptions: "2,3,4",
      reraApprovalYear: 2022,
      possessionYear: 2025,
      unitDensityPerAcre: 77,
      floorAreaRatio: 3.2,
      description:
        "Skyline Residency is a ready-to-move gated community in Gachibowli with four towers set around landscaped courtyards, built for families who want to be close to the Financial District without the noise.",
      amenities: JSON.stringify([
        "pool",
        "gym",
        "clubhouse",
        "play_area",
        "garden",
        "jogging_track",
        "security",
        "power_backup",
        "lift",
        "parking",
      ]),
    })
    .returning();

  await db.insert(projectImages).values(
    Array.from({ length: 4 }).map((_, i) => ({
      projectId: skylineProject.id,
      url: `/projects/udyan-${i + 1}.jpg`,
      sortOrder: i,
    }))
  );

  const [emeraldProject] = await db
    .insert(projects)
    .values({
      name: "Emerald Greens",
      developerName: "Kumar Properties",
      locality: "Kondapur",
      city: "Hyderabad",
      propertyType: "apartment",
      constructionStatus: "under_construction",
      areaAcres: 18,
      totalUnits: 1450,
      towers: 6,
      maxFloors: 30,
      unitsPerFloor: "8-10",
      minAreaSqft: 1450,
      maxAreaSqft: 2900,
      bhkOptions: "2,2.5,3,4",
      reraApprovalYear: 2025,
      possessionYear: 2029,
      unitDensityPerAcre: 80,
      floorAreaRatio: 4.1,
      description:
        "Emerald Greens is a large under-construction development in Kondapur spread across six towers, with a resort-style clubhouse and sports facilities at its centre.",
      amenities: JSON.stringify([
        "pool",
        "gym",
        "clubhouse",
        "multipurpose_hall",
        "play_area",
        "indoor_games",
        "jogging_track",
        "cricket_net",
        "badminton",
        "yoga",
        "cafe",
        "security",
        "power_backup",
        "lift",
        "parking",
        "pet_zone",
      ]),
    })
    .returning();

  await db.insert(projectImages).values(
    Array.from({ length: 4 }).map((_, i) => ({
      projectId: emeraldProject.id,
      url: `/projects/sarovar-${i + 1}.jpg`,
      sortOrder: i,
    }))
  );

  console.log("Projects:", { skyline: skylineProject.id, emerald: emeraldProject.id });

  type SeedListing = {
    title: string;
    description: string;
    price: number;
    listingType: "sale" | "rent";
    propertyType: "apartment" | "villa" | "independent_house" | "plot" | "commercial";
    bhk: number | null;
    areaSqft: number;
    locality: string;
    ownerId: number;
    featured: boolean;
    images: number;
    projectId?: number;
    verified?: boolean;
    contactPhone?: string;
    whatsappEnabled?: boolean;
  };

  const sampleListings: SeedListing[] = [
    {
      title: "Spacious 3BHK Apartment near Hitech City",
      description:
        "Well-maintained 3BHK apartment on the 8th floor with clubhouse, gym, and swimming pool access. Walking distance to Hitech City metro station and major IT parks.",
      price: 9500000,
      listingType: "sale",
      propertyType: "apartment",
      bhk: 3,
      areaSqft: 1850,
      locality: "Hitech City",
      ownerId: agent1.id,
      featured: true,
      images: 4,
      verified: true,
      contactPhone: "+91 98480 11223",
      whatsappEnabled: true,
    },
    {
      title: "Modern 2BHK for Rent in Kondapur",
      description:
        "Semi-furnished 2BHK in a gated community, close to schools and supermarkets. Covered parking, 24/7 security, power backup.",
      price: 28000,
      listingType: "rent",
      propertyType: "apartment",
      bhk: 2,
      areaSqft: 1150,
      locality: "Kondapur",
      ownerId: agent2.id,
      featured: true,
      images: 3,
      projectId: emeraldProject.id,
    },
    {
      title: "Independent Villa in Jubilee Hills",
      description:
        "4BHK independent villa with private garden and terrace, prime location close to Road No. 36. Ideal for large families.",
      price: 45000000,
      listingType: "sale",
      propertyType: "villa",
      bhk: 4,
      areaSqft: 4200,
      locality: "Jubilee Hills",
      ownerId: agent1.id,
      featured: true,
      images: 5,
      verified: true,
      contactPhone: "+91 98480 11223",
      whatsappEnabled: true,
    },
    {
      title: "Owner-Listed 2BHK Flat in Miyapur",
      description:
        "Direct from owner, no brokerage. Well-lit 2BHK close to Miyapur metro station. Ready to move in.",
      price: 4800000,
      listingType: "sale",
      propertyType: "apartment",
      bhk: 2,
      areaSqft: 1050,
      locality: "Miyapur",
      ownerId: seller1.id,
      featured: false,
      images: 3,
    },
    {
      title: "Premium 3BHK in Gachibowli Financial District",
      description:
        "Corner unit with excellent ventilation, close to Financial District. Amenities include badminton court, kids' play area, and landscaped gardens.",
      price: 12500000,
      listingType: "sale",
      propertyType: "apartment",
      bhk: 3,
      areaSqft: 2050,
      locality: "Gachibowli",
      ownerId: agent2.id,
      featured: false,
      images: 4,
      projectId: skylineProject.id,
    },
    {
      title: "2BHK for Rent in Skyline Residency, Gachibowli",
      description:
        "Semi-furnished 2BHK inside the Skyline Residency gated community, with direct access to the clubhouse, pool, and jogging track. Ideal for Financial District commuters.",
      price: 32000,
      listingType: "rent",
      propertyType: "apartment",
      bhk: 2,
      areaSqft: 1250,
      locality: "Gachibowli",
      ownerId: agent2.id,
      featured: false,
      images: 3,
      projectId: skylineProject.id,
    },
    {
      title: "1BHK for Rent near Madhapur",
      description:
        "Compact and affordable 1BHK, perfect for young professionals working nearby. Fully furnished with modular kitchen.",
      price: 16000,
      listingType: "rent",
      propertyType: "apartment",
      bhk: 1,
      areaSqft: 650,
      locality: "Madhapur",
      ownerId: agent1.id,
      featured: false,
      images: 2,
    },
    {
      title: "Residential Plot in Tellapur",
      description:
        "HMDA-approved open plot, 240 sq. yards, in a developing gated layout with wide roads and underground drainage.",
      price: 7200000,
      listingType: "sale",
      propertyType: "plot",
      bhk: null,
      areaSqft: 2160,
      locality: "Tellapur",
      ownerId: agent2.id,
      featured: false,
      images: 2,
    },
    {
      title: "Independent House in Kukatpally",
      description:
        "3BHK independent house on a 150 sq. yard plot, quiet residential street, close to KPHB main road.",
      price: 8900000,
      listingType: "sale",
      propertyType: "independent_house",
      bhk: 3,
      areaSqft: 1800,
      locality: "Kukatpally",
      ownerId: seller1.id,
      featured: false,
      images: 3,
    },
    {
      title: "Luxury 4BHK Duplex in Banjara Hills",
      description:
        "High-end duplex apartment with private elevator lobby access, premium fittings, and skyline views.",
      price: 65000000,
      listingType: "sale",
      propertyType: "apartment",
      bhk: 4,
      areaSqft: 3600,
      locality: "Banjara Hills",
      ownerId: agent1.id,
      featured: true,
      images: 5,
    },
    {
      title: "Commercial Office Space in Financial District",
      description:
        "Grade-A office space, 3200 sq. ft., ready for fit-out. Suitable for IT/ITES companies. Ample parking available.",
      price: 320000,
      listingType: "rent",
      propertyType: "commercial",
      bhk: null,
      areaSqft: 3200,
      locality: "Financial District",
      ownerId: agent2.id,
      featured: false,
      images: 2,
    },
    {
      title: "Cozy 2BHK in Uppal",
      description:
        "Budget-friendly 2BHK close to Uppal metro depot and NH65. Great for first-time buyers.",
      price: 3900000,
      listingType: "sale",
      propertyType: "apartment",
      bhk: 2,
      areaSqft: 950,
      locality: "Uppal",
      ownerId: seller1.id,
      featured: false,
      images: 2,
    },
    {
      title: "3BHK Gated Community Flat in Nallagandla",
      description:
        "Spacious 3BHK in a large gated community with clubhouse, jogging track, and multiple sports courts.",
      price: 8700000,
      listingType: "sale",
      propertyType: "apartment",
      bhk: 3,
      areaSqft: 1720,
      locality: "Nallagandla",
      ownerId: agent1.id,
      featured: false,
      images: 3,
    },
  ];

  for (const [idx, l] of sampleListings.entries()) {
    const [inserted] = await db
      .insert(listings)
      .values({
        title: l.title,
        description: l.description,
        price: l.price,
        listingType: l.listingType,
        propertyType: l.propertyType,
        bhk: l.bhk,
        areaSqft: l.areaSqft,
        locality: l.locality,
        city: "Hyderabad",
        ownerId: l.ownerId,
        featured: l.featured,
        views: Math.floor(Math.random() * 500),
        projectId: l.projectId ?? null,
        verified: l.verified ?? false,
        contactPhone: l.contactPhone ?? null,
        whatsappEnabled: l.whatsappEnabled ?? false,
      })
      .returning();

    // Local placeholders (public/placeholders/property-1..8.jpg), not a random
    // third-party image service — picsum.photos returned intermittent 503s in
    // production, which left listing photos broken with no way for us to fix it.
    // Real listings uploaded by agents/owners are unaffected either way; they
    // already go through saveUploadedImage() and are stored locally.
    const PLACEHOLDER_COUNT = 8;
    const imageValues = Array.from({ length: l.images }).map((_, i) => ({
      listingId: inserted.id,
      url: `/placeholders/property-${((idx + i) % PLACEHOLDER_COUNT) + 1}.jpg`,
      sortOrder: i,
    }));
    await db.insert(listingImages).values(imageValues);
  }

  // Homepage category tiles — admin-editable from /admin/home-tiles (image +
  // destination link per tile). These are the starting defaults.
  await db.insert(homeTiles).values([
    { label: "New listings", href: "/browse?new=1", imageUrl: "/tiles/new-listings.jpg", sortOrder: 0 },
    { label: "Homes for sale", href: "/browse?listingType=sale", imageUrl: "/tiles/homes-for-sale.jpg", sortOrder: 1 },
    { label: "Homes for rent", href: "/browse?listingType=rent", imageUrl: "/tiles/homes-for-rent.jpg", sortOrder: 2 },
    { label: "Featured", href: "/browse?featured=1", imageUrl: "/tiles/featured.jpg", sortOrder: 3 },
  ]);

  // Terms of Use / Privacy Policy / Cookie Policy — admin-editable starter
  // content, shown in the footer. No social links are seeded (the icon row
  // in the header/footer just stays hidden until an admin adds a real one
  // from /admin/social-links).
  await db.insert(legalPages).values(LEGAL_PAGE_DEFAULTS);

  // A couple of sample blog posts so /admin/blog and /blog have something to
  // look at out of the box — real admins write their own from there.
  await db.insert(blogPosts).values([
    {
      slug: "hyderabad-real-estate-outlook-2026",
      title: "Hyderabad real estate outlook for 2026",
      excerpt: "What buyers and investors are watching this year across the IT corridor and emerging localities.",
      category: "Market Trends",
      status: "published",
      authorId: admin.id,
      publishedAt: sql`(current_timestamp)`,
      contentHtml:
        "<h2>Steady demand along the IT corridor</h2><p>Localities close to the Financial District and Gachibowli continue to see strong end-user demand, with newer areas like Kompally and Osman Nagar attracting buyers priced out of the core.</p><h2>What to watch</h2><ul><li>Infrastructure projects extending metro connectivity</li><li>RERA approval timelines for new launches</li><li>Rental yields holding steady in gated communities</li></ul>",
    },
    {
      slug: "first-time-buyer-checklist",
      title: "A first-time buyer's checklist for Hyderabad",
      excerpt: "The documents, checks, and questions to have ready before you make an offer.",
      category: "Buying Guide",
      status: "published",
      authorId: admin.id,
      publishedAt: sql`(current_timestamp)`,
      contentHtml:
        "<h2>Before you visit</h2><p>Shortlist based on locality, budget, and BHK — then verify RERA registration for any under-construction project.</p><h2>Documents to check</h2><ol><li>Title deed and encumbrance certificate</li><li>Approved building plan</li><li>Occupancy certificate for ready-to-move units</li></ol><blockquote>A property without a clear title is not a bargain, whatever the price.</blockquote>",
    },
  ]);

  // Starting rows for the admin-managed "locations" table (see schema.ts) —
  // just this seed script's bootstrap data now; nothing else in the app
  // reads HYDERABAD_LOCALITIES directly anymore. An admin can add, rename,
  // or remove these from /admin/locations at any time afterward.
  await db.insert(locations).values(HYDERABAD_LOCALITIES.map((name, i) => ({ name, sortOrder: i })));

  console.log(`Seeded ${sampleListings.length} listings across ${HYDERABAD_LOCALITIES.length} known localities.`);
  console.log("Demo login (any seeded user): password123");
}

main()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
