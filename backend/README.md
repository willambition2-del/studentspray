# Quran Forum API — Phase 1 Foundation

This directory contains the new NestJS API. The existing React/Vite application and its legacy Express server remain unchanged and continue to run independently.

## Requirements

- Node.js 20.19 or newer (Node 24 is supported)
- npm
- Docker Desktop with Compose, or local PostgreSQL and Redis instances

## Installation

```bash
cd backend
npm install
Copy-Item .env.example .env
```

On macOS/Linux, replace the last command with `cp .env.example .env`.

## Development infrastructure

The included credentials are local-development defaults only.
PostgreSQL is exposed on `127.0.0.1:55432` and Redis on `127.0.0.1:56379` to avoid common local port collisions.

```bash
docker compose up -d postgres redis
docker compose ps
```

## Database

Generate the Prisma Client and apply the committed migrations:

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
```

For a new development migration after changing `prisma/schema.prisma`:

```bash
npm run prisma:migrate -- --name describe_the_change
```

Optional foundation seed (forum, main branch, and system roles; no users or passwords):

```bash
npm run prisma:seed
```

## Start the API

```bash
npm run start:dev
```

- Health: `GET http://localhost:4000/api/v1/health`
- Swagger UI (development only): `http://localhost:4000/api/docs`
- OpenAPI JSON: `http://localhost:4000/api/docs-json`

Production startup:

```bash
npm run build
npm start
```

Swagger requires `SWAGGER_ENABLED=true` and is intentionally unavailable when `NODE_ENV=production`.

## Environment

Copy `.env.example` to `.env` and adjust values locally. `CORS_ORIGINS` is a comma-separated allowlist; wildcard origins are not used. Do not commit `.env` files or production credentials.

## Phase boundary

This phase provides infrastructure only. Authentication, JWT/refresh tokens, authorization guards, business endpoints, Flutter, S3, Firebase, Socket.IO, and migration of React pages from mock/local data are intentionally deferred.
