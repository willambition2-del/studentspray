# Multi-Stage Production Dockerfile for Quran Forum Backend

# 1. Build Stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY prisma.config.ts ./

# Install all dependencies including devDependencies for build
RUN npm ci

# Copy source and prisma schema
COPY prisma ./prisma/
COPY src ./src/
COPY assets ./assets/

# Generate Prisma client and compile NestJS
RUN npm run prisma:generate
RUN npm run build

# Remove development dependencies to keep production footprint minimal
RUN npm prune --production

# 2. Production Runtime Stage
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Security: run as non-root user
USER node

# Copy built application and production dependencies
COPY --chown=node:node --from=builder /usr/src/app/package*.json ./
COPY --chown=node:node --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist
COPY --chown=node:node --from=builder /usr/src/app/prisma ./prisma
COPY --chown=node:node --from=builder /usr/src/app/assets ./assets

# Environment defaults (overridden at runtime by orchestrator/docker-compose)
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Healthcheck configuration
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:4000/api/v1/health || exit 1

# Production startup using compiled JS
CMD ["node", "dist/main.js"]
