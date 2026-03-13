FROM node:22-slim AS base
WORKDIR /app

# Install all dependencies (including dev for build)
# All workspace package.json files must be present for npm ci to resolve
FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/db/package.json packages/db/
COPY packages/types/package.json packages/types/
COPY packages/personas/package.json packages/personas/
COPY apps/agent/package.json apps/agent/
COPY apps/web/package.json apps/web/
RUN npm ci

# Build all packages
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build -w @scrumbs/types && \
    npm run build -w @scrumbs/db && \
    npm run build -w @scrumbs/personas && \
    npm run build -w @scrumbs/agent

# Production dependencies only
FROM base AS prod-deps
COPY package.json package-lock.json ./
COPY packages/db/package.json packages/db/
COPY packages/types/package.json packages/types/
COPY packages/personas/package.json packages/personas/
COPY apps/agent/package.json apps/agent/
COPY apps/web/package.json apps/web/
RUN npm ci --omit=dev

# Production
FROM base AS runner
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/package.json ./packages/db/
COPY --from=builder /app/packages/db/drizzle ./packages/db/drizzle
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/personas/dist ./packages/personas/dist
COPY --from=builder /app/packages/personas/package.json ./packages/personas/
COPY --from=builder /app/apps/agent/dist ./apps/agent/dist
COPY --from=builder /app/apps/agent/package.json ./apps/agent/

EXPOSE 8080
ENV PORT=8080
CMD ["node", "apps/agent/dist/index.js"]
