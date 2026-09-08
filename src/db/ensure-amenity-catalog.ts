// One-off, safe-to-rerun migration for servers that were already running
// before listings got a db-backed, admin-extensible amenity catalog (see
// schema.ts's amenityCatalog table, and lib/amenities.ts's AMENITIES, which
// now only seeds this table's starting rows). Re-running db:seed on a live
// server would wipe real data, so this instead only inserts the starting
// amenity list when the table is completely empty — once an admin has added
// a custom amenity (or a fresh seed already populated it), this is a
// permanent no-op. Safe to run on every container start (see
// docker-entrypoint.sh).
import { db } from "./client";
import { amenityCatalog } from "./schema";
import { AMENITIES } from "../lib/amenities";

async function main() {
  const existing = await db.select({ id: amenityCatalog.id }).from(amenityCatalog).limit(1);
  if (existing.length > 0) {
    console.log("Amenity catalog already present — nothing to do.");
    return;
  }

  await db
    .insert(amenityCatalog)
    .values(AMENITIES.map((a, i) => ({ key: a.key, label: a.label, sortOrder: i })));
  console.log(`Inserted ${AMENITIES.length} default amenities.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
