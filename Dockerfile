# 1. Base image with necessary system dependencies
FROM node:22-slim AS base
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# 2. Dependencies stage
FROM base AS deps
# Copy package files and prisma schema first to fix the build error
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
# Install all dependencies and clean cache to save disk space
RUN npm ci && npm cache clean --force

# 3. Build stage
FROM deps AS builder
COPY . .
# Generates Prisma client and builds Vite frontend
RUN npm run build

# 4. Production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/prisma ./prisma

# Security: Run as non-root user
USER node

EXPOSE 3000
# Running with tsx handles TS/ESM reliably for the demo
CMD ["npx", "tsx", "server.ts"]
