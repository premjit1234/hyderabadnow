// One-off, safe-to-rerun backfill for listings created before geocoding
// existed for them (see schema.ts's listings.latitude/longitude and
// src/lib/hyderabadGeo.ts's "distance to nearest Metro / work hub" section
// on the public listing page). New listings get geocoded automatically on
// create/edit (see createListingAction/updateOwnListingAction in
// src/app/actions.ts and their admin equivalents) — this only catches rows
// that predate that. Mirrors ensure-project-coordinates.ts exactly.
//
// Runs on every container start (see docker-entrypoint.sh), sequentially
// and rate-limited (see geocodeLocality/sleep in src/lib/geocode.ts) since
// the free geocoder this uses caps free use at ~1 request/second. A listing
// whose locality can't be geocoded is left with no pin rather than blocking
// every other row or failing the startup — it just won't show a
// connectivity section, same as if geocoding is still pending.
import { eq, isNull } from "drizzle-orm";
import { db } from "./client";
import { listings } from "./schema";
import { geocodeLocality, sleep } from "../lib/geocode";

// Generous relative to any real deploy of this app so far, while keeping a
// worst-case startup delay bounded — remaining rows just get picked up on
// the next container start (the query only ever selects what's still null).
const MAX_PER_RUN = 200;

async function main() {
  const pending = await db
    .select({ id: listings.id, title: listings.title, locality: listings.locality, city: listings.city })
    .from(listings)
    .where(isNull(listings.latitude))
    .orderBy(listings.id)
    .limit(MAX_PER_RUN);

  if (pending.length === 0) {
    console.log("All listings already have map coordinates (or none exist) — nothing to do.");
    return;
  }

  console.log(`Geocoding ${pending.length} listing(s) with no map coordinates yet...`);
  let geocoded = 0;

  for (let i = 0; i < pending.length; i++) {
    const listing = pending[i];
    if (i > 0) await sleep(1100);

    const geo = await geocodeLocality(listing.locality, listing.city);
    if (geo) {
      await db
        .update(listings)
        .set({ latitude: geo.latitude, longitude: geo.longitude })
        .where(eq(listings.id, listing.id));
      geocoded++;
      console.log(`  listing ${listing.id} ("${listing.title}") -> ${geo.latitude}, ${geo.longitude}`);
    } else {
      console.log(`  listing ${listing.id} ("${listing.title}") -> couldn't geocode "${listing.locality}, ${listing.city}", left without a pin.`);
    }
  }

  console.log(`Geocoded ${geocoded} of ${pending.length} listing(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
