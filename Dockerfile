# Base image
FROM node:22-slim AS base

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install

# Build stage
FROM deps AS builder
COPY . .
# Generates Prisma client and builds Vite frontend
RUN npm run build

# Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/prisma ./prisma

# Use tsx to run server.ts in production as it handles ESM/TS reliably
# In a bigger app, you might compile server.ts to JS, but tsx is fine for this demo.
EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]
