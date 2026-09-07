// One-off, safe-to-rerun migration for servers that were already seeded
// before legal pages existed (see schema.ts legalPages). Re-running db:seed
// on a live server would wipe real data, so this instead only inserts each
// of the three fixed pages (by slug) when it's missing — once an admin has
// edited a page, this is a permanent no-op for that page. Safe to run on
// every container start (see docker-entrypoint.sh).
import { db } from "./client";
import { legalPages } from "./schema";
import { eq } from "drizzle-orm";
import { LEGAL_PAGE_DEFAULTS } from "./legal-page-defaults";

async function main() {
  let inserted = 0;
  for (const page of LEGAL_PAGE_DEFAULTS) {
    const existing = await db.query.legalPages.findFirst({ where: eq(legalPages.slug, page.slug) });
    if (existing) continue;
    await db.insert(legalPages).values(page);
    inserted++;
  }

  if (inserted === 0) {
    console.log("Legal pages already present — nothing to do.");
  } else {
    console.log(`Inserted ${inserted} default legal page(s).`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
