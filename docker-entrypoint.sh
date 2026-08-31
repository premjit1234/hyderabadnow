#!/bin/sh
set -e

echo "Applying database schema..."
node_modules/.bin/drizzle-kit push --force

# Check actual row count rather than just file size — a previous run that
# crashed between "push" and "seed" leaves a valid-looking, non-empty db
# file with an empty users table, which a file-existence check would
# mistake for "already seeded" forever.
USER_COUNT=$(node -e "
  const Database = require('better-sqlite3');
  try {
    const db = new Database('/app/data/hyderabadnow.db', { fileMustExist: true });
    console.log(db.prepare('select count(*) as c from users').get().c);
  } catch {
    console.log(0);
  }
")

if [ "$USER_COUNT" = "0" ]; then
  echo "No seeded data found — seeding sample Hyderabad listings..."
  node_modules/.bin/tsx src/db/seed.ts
else
  echo "Existing data found ($USER_COUNT users) — skipping seed (delete the 'hyderabadnow_data' volume to reseed)."
fi

exec "$@"
