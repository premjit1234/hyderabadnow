// One-off, safe-to-rerun migration for servers that were already seeded
// before homepage tiles became admin-managed rows (see schema.ts homeTiles).
// Re-running db:seed on a live server would wipe real data, so this instead
// only inserts the starting 4 tiles when the table is completely empty —
// once an admin has edited/added tiles, this is a permanent no-op. Safe to
// run on every container start (see docker-entrypoint.sh).
import { db } from "./client";
import { homeTiles } from "./schema";

async function main() {
  const existing = await db.select({ id: homeTiles.id }).from(homeTiles).limit(1);
  if (existing.length > 0) {
    console.log("Home tiles already present — nothing to do.");
    return;
  }

  await db.insert(homeTiles).values([
    { label: "New listings", href: "/browse?new=1", imageUrl: "/tiles/new-listings.jpg", sortOrder: 0 },
    { label: "Homes for sale", href: "/browse?listingType=sale", imageUrl: "/tiles/homes-for-sale.jpg", sortOrder: 1 },
    { label: "Homes for rent", href: "/browse?listingType=rent", imageUrl: "/tiles/homes-for-rent.jpg", sortOrder: 2 },
    { label: "Featured", href: "/browse?featured=1", imageUrl: "/tiles/featured.jpg", sortOrder: 3 },
  ]);
  console.log("Inserted default homepage tiles.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
