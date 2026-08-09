# Simple, explicit Dockerfile — added specifically to bypass Railway's
# automatic build system (Nixpacks/"Railpack"/"Metal builder"), which as
# of 2026-07 has a widely-reported bug where "npm ci && npm run build"
# fails with "EBUSY: resource busy or locked, rmdir
# '/app/node_modules/.cache'" due to a Docker cache-mount conflict during
# their in-progress migration to a new builder. When Railway detects a
# Dockerfile in the repo root, it uses this instead of auto-detecting a
# build — sidestepping that bug entirely since we control every layer.
#
# No multi-stage / "output: standalone" split here on purpose: this app
# reads .md curriculum content from /content/books via fs at REQUEST
# time (see lib/rag.ts), not at build time, so Next.js's standalone
# output tracing can't be trusted to automatically include those files.
# A single straightforward stage that copies everything is slightly
# larger but guaranteed correct.
FROM node:20-slim

# Prisma's engine-detection heuristic needs the `openssl` binary/libs to
# correctly identify which query-engine build to fetch. The "slim" base
# image strips these out, which silently causes Prisma to guess the
# wrong OpenSSL target (it fell back to "debian-openssl-1.1.x" here,
# which doesn't exist on this image's actual OpenSSL 3.x) and fail at
# runtime with "libssl.so.1.1: cannot open shared object file." ca-
# certificates is needed too, for outbound HTTPS calls to the AI
# provider APIs and Neon/Postgres over TLS.
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first, as its own layer, so a change to source
# code alone (not package.json) doesn't force a full reinstall.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# Now copy everything else and build.
COPY . .
RUN npm run build

ENV NODE_ENV=production
# Railway injects its own PORT at runtime; `next start` reads it
# automatically (already confirmed working — the original GHI project
# deployed successfully on Railway with this exact same start script).
EXPOSE 8080

CMD ["npm", "start"]
