// One-off, safe-to-rerun migration for servers that were already seeded before
// the switch away from picsum.photos (see seed.ts) — picsum started returning
// intermittent 503s in production, leaving listing photos broken with no way
// for the app itself to recover. Re-running db:seed on a live server would
// wipe real data, so this instead patches just the old external image URLs
// in place, leaving everything else (users, listings, real uploaded photos)
// untouched.
import { eq, like } from "drizzle-orm";
import { db } from "./client";
import { listingImages } from "./schema";

const PLACEHOLDER_COUNT = 8;

async function main() {
  const rows = await db
    .select()
    .from(listingImages)
    .where(like(listingImages.url, "https://picsum.photos/%"));

  if (rows.length === 0) {
    console.log("No picsum.photos image URLs found — nothing to fix.");
    return;
  }

  console.log(`Found ${rows.length} image(s) still pointing at picsum.photos. Fixing...`);
  for (const [i, row] of rows.entries()) {
    const url = `/placeholders/property-${(i % PLACEHOLDER_COUNT) + 1}.jpg`;
    await db.update(listingImages).set({ url }).where(eq(listingImages.id, row.id));
  }
  console.log(`Updated ${rows.length} image(s) to use local placeholders.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
