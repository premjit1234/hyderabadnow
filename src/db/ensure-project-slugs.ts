// One-off, safe-to-rerun backfill for servers that already had projects
// before the public project page moved from /projects/[id] to a
// name-based /projects/[slug] URL (see schema.ts's projects.slug column).
// The migration that added the column can only leave it NULL for existing
// rows — SQLite can't retroactively fill a computed, unique value via plain
// ALTER TABLE — so this script does that fill-in instead, in application
// code where slugify() + uniqueness checking is actually possible. Once
// every project has a slug this is a permanent no-op. Safe to run on every
// container start (see docker-entrypoint.sh), and runs before the app starts
// serving traffic so the slug is never missing by the time a request needs
// it.
import { isNull, eq } from "drizzle-orm";
import { db } from "./client";
import { projects, pageViews } from "./schema";
import { slugify } from "../lib/blog";

async function main() {
  const pending = await db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(isNull(projects.slug))
    .orderBy(projects.id);

  if (pending.length === 0) {
    console.log("All projects already have a slug — nothing to do.");
    return;
  }

  // Track every slug already spoken for — both already-assigned ones and
  // ones this run is about to assign — so two legacy projects sharing a
  // name (or one matching an already-slugged project) still land on
  // distinct URLs instead of colliding.
  const taken = new Set(
    (await db.select({ slug: projects.slug }).from(projects)).map((r) => r.slug).filter((s): s is string => !!s)
  );

  for (const project of pending) {
    const base = slugify(project.name);
    let candidate = base;
    let n = 2;
    while (taken.has(candidate)) {
      candidate = `${base}-${n++}`;
    }
    taken.add(candidate);
    await db.update(projects).set({ slug: candidate }).where(eq(projects.id, project.id));

    // Carry over this project's accumulated view count (see the "views on
    // this project" line on the public page) rather than letting it appear
    // to reset to zero just because the URL changed — every one of these
    // rows was necessarily recorded under the old /projects/<id> path, since
    // this project had no slug (and therefore no other URL) until just now.
    await db
      .update(pageViews)
      .set({ path: `/projects/${candidate}` })
      .where(eq(pageViews.path, `/projects/${project.id}`));

    console.log(`  project ${project.id} ("${project.name}") -> /projects/${candidate}`);
  }

  console.log(`Backfilled slugs for ${pending.length} project(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
