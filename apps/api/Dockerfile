# syntax=docker/dockerfile:1

# ── Stage 1: prune workspace ──────────────────────────────────────────────────
FROM node:20-alpine AS pruner
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
RUN pnpm add -g turbo@^2
COPY . .
RUN turbo prune @flowiq/api --docker

# ── Stage 2: install deps (cached layer) ──────────────────────────────────────
FROM node:20-alpine AS installer
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# ── Stage 3: build ────────────────────────────────────────────────────────────
FROM installer AS builder
WORKDIR /app
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=@flowiq/api...

# ── Stage 4: production deploy dir ───────────────────────────────────────────
FROM installer AS deployer
WORKDIR /app
COPY --from=pruner /app/out/full/ .
RUN pnpm deploy --filter=@flowiq/api --prod /deploy/api

# ── Stage 5: minimal runtime image ───────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nodejs
COPY --from=deployer --chown=nodejs:nodejs /deploy/api/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./dist
USER nodejs
EXPOSE 3000
CMD ["node", "dist/index.js"]
