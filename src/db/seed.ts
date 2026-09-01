import { db, sqlite } from "./client";
import { users, listings, listingImages } from "./schema";
import { hashPassword } from "../lib/auth";
import { HYDERABAD_LOCALITIES } from "../lib/localities";

async function main() {
  console.log("Seeding database...");

  // Clear existing data (dev convenience)
  sqlite.exec(
    "DELETE FROM listing_images; DELETE FROM inquiries; DELETE FROM listings; DELETE FROM users;"
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

  await db.insert(users).values({
    name: "Admin",
    email: "admin@hyderabadnow.in",
    passwordHash: demoPasswordHash,
    role: "admin",
  });

  console.log("Users:", { agent1: agent1.id, agent2: agent2.id, seller1: seller1.id, buyer1: buyer1.id });

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
