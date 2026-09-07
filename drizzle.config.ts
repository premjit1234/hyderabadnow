import type { Config } from "drizzle-kit";

// Schema changes ship as generated migration files, applied by
// src/db/migrate.ts at container start — see that file for why. The
// workflow after editing schema.ts is:
//   1. npm run db:generate   — writes drizzle/000N_*.sql from the diff
//   2. read that .sql — it's what will actually run in production
//   3. commit schema.ts + the new drizzle/ files together
// `db:push` (below) still exists for fast local iteration against your own
// throwaway dev database — e.g. while shaping a new table before you've
// settled on its final columns — but never run it against the production
// database directly; only committed migration files reach it.
export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./data/hyderabadnow.db",
  },
} satisfies Config;
