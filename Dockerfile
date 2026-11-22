# ==============================================================================
# Production Dockerfile for Engrew Backend API
# ==============================================================================

# Stage 1: Build Backend
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl

COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci

COPY backend/ ./
RUN npx prisma generate
RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN apk add --no-cache openssl

COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci --only=production
RUN npx prisma generate

COPY --from=builder /app/dist ./dist
RUN mkdir -p uploads logs

EXPOSE 5001

CMD ["node", "dist/index.js"]

