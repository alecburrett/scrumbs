FROM node:22-slim AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/db/package.json packages/db/
COPY packages/types/package.json packages/types/
COPY packages/personas/package.json packages/personas/
COPY apps/agent/package.json apps/agent/
RUN npm ci

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build -w @scrumbs/types && \
    npm run build -w @scrumbs/db && \
    npm run build -w @scrumbs/personas && \
    npm run build -w @scrumbs/agent

# Production
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/agent/dist ./apps/agent/dist
COPY --from=builder /app/apps/agent/package.json ./apps/agent/

EXPOSE 8080
ENV PORT=8080
CMD ["node", "apps/agent/dist/index.js"]
