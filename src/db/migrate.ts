// Run at container start (see docker-entrypoint.sh) in place of the old
// `drizzle-kit push --force` call. That command re-diffs the live schema
// against schema.ts on every single deploy and applies its best *guess* at
// the SQL needed to reconcile them — for anything SQLite can't do with a
// plain ALTER TABLE (which the diff engine decides case by case, based on
// the shape of the change), its guess is "create a new table, copy the
// rows across, drop the old one, rename the new one into place". That is
// exactly the kind of runtime, unreviewed, data-moving operation that can
// go wrong silently, and is the leading suspect for the blog posts that
// were lost during the Analytics feature's rollout.
//
// This script instead applies pre-generated, git-committed migration files
// from ./drizzle (see package.json's "db:generate" — run that locally after
// changing schema.ts, review the .sql it produces, commit it, and only then
// ship). Nothing about *what* SQL runs is decided at deploy time anymore;
// deploy time just applies exactly the statements already reviewed and
// checked into version control, in order, exactly once each.
//
// Every run also takes a timestamped backup of the database file first,
// completely independent of whether anything above goes right — cheap
// insurance against any future mistake, not just this migration mechanism.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "hyderabadnow.db");
const migrationsFolder = path.join(process.cwd(), "drizzle");
// Same table name/shape drizzle-orm's own migrator uses internally (see
// node_modules/drizzle-orm/sqlite-core/dialect.js) — kept in sync so the
// baseline rows we insert by hand below are indistinguishable from ones the
// migrator would have written itself.
const MIGRATIONS_TABLE = "__drizzle_migrations";

fs.mkdirSync(dataDir, { recursive: true });

function tableExists(sqlite: Database.Database, name: string): boolean {
  return !!sqlite.prepare(`select 1 from sqlite_master where type = 'table' and name = ?`).get(name);
}

// A snapshot of the database file exactly as it was before this deploy
// touches it, kept in the same Docker volume as the live data so it
// survives container restarts. Skipped on a brand-new volume — nothing to
// back up yet. Keeps the most recent 20 (weeks to months of normal deploy
// cadence) and prunes older ones so the volume doesn't grow unbounded.
function backupDatabaseFile() {
  if (!fs.existsSync(dbPath)) return;

  // Flush the WAL into the main file first so the backup is a complete,
  // standalone snapshot — a plain file copy while the -wal file still holds
  // committed-but-not-yet-checkpointed rows can silently miss recent writes
  // (the same gotcha as copying the live db file for any other purpose).
  const sqlite = new Database(dbPath);
  sqlite.pragma("wal_checkpoint(TRUNCATE)");
  sqlite.close();

  const backupsDir = path.join(dataDir, "backups");
  fs.mkdirSync(backupsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupsDir, `hyderabadnow-${stamp}.db`);
  fs.copyFileSync(dbPath, backupPath);
  console.log(`Backed up database to ${backupPath}`);

  const KEEP = 20;
  const files = fs
    .readdirSync(backupsDir)
    .filter((f) => f.endsWith(".db"))
    .sort();
  for (const stale of files.slice(0, Math.max(0, files.length - KEEP))) {
    fs.unlinkSync(path.join(backupsDir, stale));
  }
}

// This app's schema was managed with `drizzle-kit push` (no migration
// history) from launch until the migration this baselines. An existing
// database — recognized by its `users` table already being there — needs
// its migration history backfilled with every migration generated so far,
// recorded as already-applied WITHOUT running their SQL (those tables
// already exist; running the SQL again would fail or, worse, collide with
// real data). A brand-new database has no `users` table yet, so it skips
// this and falls through to a normal migrate() run, which creates
// everything from scratch for real. This only ever does anything on the
// very first run after this migration system was introduced — every run
// after that finds `__drizzle_migrations` already there and skips it.
function baselineExistingDatabase() {
  const sqlite = new Database(dbPath);
  try {
    if (tableExists(sqlite, MIGRATIONS_TABLE) || !tableExists(sqlite, "users")) return;

    console.log("Existing database with no migration history found — recording its schema as baselined...");
    sqlite.exec(
      `CREATE TABLE IF NOT EXISTS "${MIGRATIONS_TABLE}" (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at numeric)`
    );
    const journal = JSON.parse(fs.readFileSync(path.join(migrationsFolder, "meta/_journal.json"), "utf-8"));
    const insert = sqlite.prepare(`INSERT INTO "${MIGRATIONS_TABLE}" ("hash", "created_at") VALUES (?, ?)`);
    for (const entry of journal.entries as { tag: string; when: number }[]) {
      const fileContents = fs.readFileSync(path.join(migrationsFolder, `${entry.tag}.sql`), "utf-8");
      const hash = crypto.createHash("sha256").update(fileContents).digest("hex");
      insert.run(hash, entry.when);
      console.log(`  ${entry.tag} — marked as already applied, not re-run`);
    }
  } finally {
    sqlite.close();
  }
}

backupDatabaseFile();
baselineExistingDatabase();

const db = drizzle(new Database(dbPath), { schema });
migrate(db, { migrationsFolder });
console.log("Database schema is up to date.");
