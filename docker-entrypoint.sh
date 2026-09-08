#!/bin/sh
set -e

DB_PATH=/app/data/hyderabadnow.db

# Must be checked before anything below touches the filesystem — migrate.ts
# itself will create this file if it's missing, so this is the only correct
# place to ask "did a real database already exist when this container
# started?". Everything else (whether to auto-seed) hinges on this exact
# distinction: a brand-new volume vs. an existing one that merely looks
# empty for some other reason.
if [ -f "$DB_PATH" ]; then
  DB_EXISTED_BEFORE=1
else
  DB_EXISTED_BEFORE=0
fi

echo "Applying database schema..."
# Applies pre-generated, git-committed migration files (see src/db/migrate.ts
# and package.json's "db:generate") instead of the old `drizzle-kit push
# --force`, which recomputed its own best-guess schema diff — including,
# for some changes, guessing "recreate the table" — on every single deploy.
# That guessing is the leading suspect for blog posts lost during an
# earlier deploy; this replaces it with exactly the SQL already reviewed
# and committed to the repo, applied once, in order, every time.
node_modules/.bin/tsx src/db/migrate.ts

if [ "$DB_EXISTED_BEFORE" = "0" ]; then
  echo "Brand-new database — seeding sample Hyderabad listings..."
  node_modules/.bin/tsx src/db/seed.ts
else
  # seed.ts unconditionally wipes users/listings/projects/blog before
  # reseeding sample data (see its own top-of-file DELETE statements) — safe
  # only on a database that never had real data in the first place. Never
  # run it automatically just because `users` happens to read 0 on a
  # database that already existed; that combination is a red flag, not an
  # invitation to overwrite whatever is actually in there.
  USER_COUNT=$(node -e "
    const Database = require('better-sqlite3');
    try {
      const db = new Database('$DB_PATH', { fileMustExist: true });
      console.log(db.prepare('select count(*) as c from users').get().c);
    } catch {
      console.log(0);
    }
  ")
  if [ "$USER_COUNT" = "0" ]; then
    echo "WARNING: an existing database was found but its users table is empty — NOT auto-seeding, to avoid overwriting real data that may exist in other tables. A backup was just taken under data/backups/. If this is genuinely a fresh install that crashed before seeding finished last time, run 'npm run db:seed' inside the container manually."
  else
    echo "Existing data found ($USER_COUNT users) — skipping seed."
  fi
fi

# Idempotent — a no-op once homepage tiles exist (fresh seed.ts run above
# already creates them). Covers servers that were seeded before homepage
# tiles became an admin-managed table.
node_modules/.bin/tsx src/db/ensure-home-tiles.ts

# Idempotent — a no-op once all three legal pages exist (fresh seed.ts run
# above already creates them). Covers servers that were seeded before legal
# pages existed.
node_modules/.bin/tsx src/db/ensure-legal-pages.ts

# Idempotent — a no-op once any location exists (fresh seed.ts run above
# already creates the default list). Covers servers that were running
# before localities became an admin-managed table.
node_modules/.bin/tsx src/db/ensure-locations.ts

# Idempotent — a no-op once every project already has a slug. Covers
# projects created before /projects/[id] became /projects/[slug]; must run
# before the app starts serving so a legacy project's public page is never
# briefly unreachable.
node_modules/.bin/tsx src/db/ensure-project-slugs.ts

exec "$@"
