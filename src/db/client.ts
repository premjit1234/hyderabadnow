import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "hyderabadnow.db");

// better-sqlite3 can't create the db file if its parent directory doesn't
// exist yet (e.g. a fresh checkout, or a Docker build stage where `data/`
// is intentionally not copied in). Make sure it's there before opening.
fs.mkdirSync(dataDir, { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { sqlite };
