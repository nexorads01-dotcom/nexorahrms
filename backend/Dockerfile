FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma/

# Copy source
COPY . .

# Generate Prisma client for PostgreSQL
RUN npx prisma generate

# Build
RUN npm run build

# Expose port
EXPOSE 3000

# Start script: migrate + seed + start
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx ts-node prisma/seed.ts 2>/dev/null; node dist/main"]
