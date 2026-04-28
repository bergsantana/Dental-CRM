# syntax=docker/dockerfile:1.7

# `onnxruntime-node` (loaded by @xenova/transformers for the BGE reranker)
# ships precompiled glibc binaries, so we use the Debian-slim image instead
# of Alpine — musl can't load the bundled .so files.

# ---------- builder ----------
FROM node:20-slim AS builder
WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable

COPY package.json ./
# Generate a lockfile inside the build (no host lockfile is committed).
RUN pnpm install --no-frozen-lockfile

COPY tsconfig.json ./
COPY src ./src

RUN pnpm build && pnpm prune --prod

# ---------- runtime ----------
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./
# Copy sources too so we can also run CLIs via tsx if desired.
COPY tsconfig.json ./
COPY src ./src

EXPOSE 3000
CMD ["node", "dist/server.js"]
