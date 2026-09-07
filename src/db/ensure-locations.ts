// One-off, safe-to-rerun migration for servers that were already running
// before localities became an admin-managed table (see schema.ts's
// locations table, and lib/localities.ts's HYDERABAD_LOCALITIES, which used
// to be imported directly everywhere it was needed). Re-running db:seed on
// a live server would wipe real data, so this instead only inserts the
// starting locality list when the table is completely empty — once an admin
// has added/edited/removed a location, this is a permanent no-op. Safe to
// run on every container start (see docker-entrypoint.sh).
import { db } from "./client";
import { locations } from "./schema";
import { HYDERABAD_LOCALITIES } from "../lib/localities";

async function main() {
  const existing = await db.select({ id: locations.id }).from(locations).limit(1);
  if (existing.length > 0) {
    console.log("Locations already present — nothing to do.");
    return;
  }

  await db.insert(locations).values(HYDERABAD_LOCALITIES.map((name, i) => ({ name, sortOrder: i })));
  console.log(`Inserted ${HYDERABAD_LOCALITIES.length} default locations.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
