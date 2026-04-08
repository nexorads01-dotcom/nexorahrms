# ============================================
# Nexora HRMS — Backend Dockerfile
# Multi-stage build for smaller production image
# ============================================

# ---------- Stage 1: Install & Build ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
RUN npm install prisma@^7.6.0 --no-save --ignore-scripts --no-audit --no-fund

# Copy prisma schema and generate client
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npx prisma generate

# Copy source and build
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src/
RUN npm run build

# ---------- Stage 2: Production ----------
FROM node:20-alpine AS production

WORKDIR /app

# Copy built output and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/package*.json ./

# Expose port
EXPOSE 3000

# Start: run safe migrations, optionally seed in dev, then run app
CMD ["sh", "-c", "npx prisma migrate deploy && if [ \"$RUN_DB_SEED\" = \"true\" ]; then npx ts-node prisma/seed.ts; fi && node dist/main"]
