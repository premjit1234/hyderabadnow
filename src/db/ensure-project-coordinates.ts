// One-off, safe-to-rerun backfill for projects created before the map view
// on /projects existed (see schema.ts's projects.latitude/longitude
// columns and src/components/ProjectsMap.tsx). New projects get geocoded
// automatically on create/edit (see adminCreateProjectAction /
// adminUpdateProjectAction in src/app/admin/actions.ts) and bulk-imported
// ones in commitBulkProjects — this only catches rows that predate all of
// that. Once every project has a latitude this is a permanent no-op.
//
// Runs on every container start (see docker-entrypoint.sh), sequentially
// and rate-limited (see geocodeLocality/sleep in src/lib/geocode.ts) since
// the free geocoder this uses caps free use at ~1 request/second. A project
// whose locality can't be geocoded is left with no pin rather than
// blocking every other row or failing the startup — it just won't show up
// on the map, same as if geocoding is still pending.
import { isNull, eq } from "drizzle-orm";
import { db } from "./client";
import { projects } from "./schema";
import { geocodeLocality, sleep } from "../lib/geocode";

// Generous relative to any real deploy of this app so far, while keeping a
// worst-case startup delay bounded — remaining rows just get picked up on
// the next container start (the query only ever selects what's still null).
const MAX_PER_RUN = 200;

async function main() {
  const pending = await db
    .select({ id: projects.id, name: projects.name, locality: projects.locality, city: projects.city })
    .from(projects)
    .where(isNull(projects.latitude))
    .orderBy(projects.id)
    .limit(MAX_PER_RUN);

  if (pending.length === 0) {
    console.log("All projects already have map coordinates (or none exist) — nothing to do.");
    return;
  }

  console.log(`Geocoding ${pending.length} project(s) with no map coordinates yet...`);
  let geocoded = 0;

  for (let i = 0; i < pending.length; i++) {
    const project = pending[i];
    if (i > 0) await sleep(1100);

    const geo = await geocodeLocality(project.locality, project.city);
    if (geo) {
      await db
        .update(projects)
        .set({ latitude: geo.latitude, longitude: geo.longitude })
        .where(eq(projects.id, project.id));
      geocoded++;
      console.log(`  project ${project.id} ("${project.name}") -> ${geo.latitude}, ${geo.longitude}`);
    } else {
      console.log(`  project ${project.id} ("${project.name}") -> couldn't geocode "${project.locality}, ${project.city}", left without a pin.`);
    }
  }

  console.log(`Geocoded ${geocoded} of ${pending.length} project(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
