# ==============================================================================
# Multi-Stage Dockerfile for Engrew Platform
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Backend
# ------------------------------------------------------------------------------
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci

COPY backend/ ./
RUN npx prisma generate
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Build Frontend
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 3: Production Backend Runner
# ------------------------------------------------------------------------------
FROM node:20-alpine AS backend-prod
WORKDIR /app

ENV NODE_ENV=production
RUN apk add --no-cache openssl

COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci --only=production
RUN npx prisma generate

COPY --from=backend-builder /app/backend/dist ./dist
RUN mkdir -p uploads logs

EXPOSE 5001

CMD ["node", "dist/index.js"]
