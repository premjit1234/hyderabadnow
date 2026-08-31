FROM node:22-bookworm-slim AS base

# ---- deps ----
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# better-sqlite3 ships prebuilt native bindings for linux-x64/arm64 (glibc + musl),
# so we skip the install-time node-gyp rebuild entirely — no build toolchain needed.
RUN npm ci --ignore-scripts

# ---- build ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build \
  # the build process opens the sqlite file at import time (see src/db/client.ts)
  # purely to collect route metadata — discard whatever that created so a stale,
  # schema-less db can never leak into the runtime image.
  && rm -rf ./data ./.next/standalone/data

# ---- runtime ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

# Full node_modules (kept simple/robust for local use — includes drizzle-kit/tsx
# so the entrypoint can run schema push + seed on first start).
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY package.json drizzle.config.ts ./
COPY src/db ./src/db
COPY src/lib ./src/lib
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN mkdir -p /app/data /app/public/uploads \
  && chown -R nextjs:nodejs /app/data /app/public/uploads /app/node_modules \
  # explicit numeric mode, not symbolic "+x" — the script arrives from the
  # build context with whatever permission bits its source file happened to
  # have, and "+x" alone won't grant read access if that source file wasn't
  # world-readable. rwxr-xr-x guarantees the non-root "nextjs" user can both
  # read and execute it regardless of the host file's original mode.
  && chmod 755 /app/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
