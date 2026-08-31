# HyderabadNow

A realtor.com-style property marketplace for Hyderabad — listings posted by agents and owners directly.

## Run with Docker (recommended)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
docker compose up --build
```

Open **http://localhost:3000**. On first run the container automatically creates the database schema and seeds 12 sample Hyderabad listings — no extra steps needed. Data (the SQLite database and uploaded photos) persists in Docker volumes across restarts, so `docker compose up` on subsequent runs won't re-seed or lose anything.

To reset to a clean, freshly-seeded database:

```bash
docker compose down -v   # removes the data volumes
docker compose up --build
```

To stop it: `docker compose down` (add `-v` only if you also want to wipe the data).

Demo logins (password `password123`): `priya.agent@hyderabadnow.in` (agent), `anitha.owner@hyderabadnow.in` (owner), `rahul.buyer@hyderabadnow.in` (buyer) — or sign up fresh.

## Run without Docker

Requires Node.js 20.9+.

```bash
npm install
npm run db:push    # create the SQLite schema
npm run db:seed    # add sample listings (only needed once)
npm run dev
```

Open **http://localhost:3000**.

## "Continue with Google" login

Optional — the app works fine without it (the Google buttons show a friendly error if unset). To enable it:

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an **OAuth client ID** of type **Web application**.
2. Add these **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/google/callback` (local dev)
   - `https://hyderabadnow.in/api/auth/google/callback` (production)
3. Copy the Client ID and Client Secret into a `.env` file (see `.env.example`) as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, and also set `APP_URL` (e.g. `https://hyderabadnow.in` in production, `http://localhost:3000` locally) — behind a reverse proxy, Next.js can't reliably work out its own public URL from the incoming request, so this is required whenever Google login is enabled. `docker compose` picks all three up automatically.
4. New Google sign-ups default to a "buyer" account and are asked once to confirm their account type (buyer / agent / owner) at `/complete-profile`.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- SQLite via Drizzle ORM (`better-sqlite3`) — swap the driver for Postgres when moving to production; the schema/queries are ORM-level and not SQLite-specific
- Session auth via signed JWT cookies (`src/lib/auth.ts`)
- Uploaded listing photos are stored under `public/uploads` (or the `hyderabadnow_uploads` Docker volume)

## Project layout

- `src/app` — pages and Server Actions (`src/app/actions.ts`)
- `src/components` — UI components, including client-side forms
- `src/db` — Drizzle schema, DB client, queries, and the seed script
- `src/lib` — auth, formatting, localities, upload helpers
