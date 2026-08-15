# Quran Forum API — Phase 3 Core Management Foundation

This directory contains the NestJS production API. React admin authentication now uses this API; legacy feature pages and `server.ts` remain during incremental migration.

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

### Authentication contracts

- `POST /api/v1/auth/web/login`
- `POST /api/v1/auth/web/refresh` — HttpOnly cookie and trusted `Origin` required
- `POST /api/v1/auth/web/logout` — HttpOnly cookie and trusted `Origin` required
- `POST /api/v1/auth/mobile/login`
- `POST /api/v1/auth/mobile/refresh`
- `POST /api/v1/auth/mobile/logout`
- `GET /api/v1/auth/me` — Bearer access token
- `POST /api/v1/auth/change-password` — Bearer access token
- `POST /api/v1/auth/logout-all` — revokes every session including the caller

Mobile refresh tokens must be stored in platform secure storage. Web refresh tokens are never returned to JavaScript and are stored only in an HttpOnly cookie. Access tokens contain only `sub` and `sid`; roles and permissions are resolved from the database for protected requests.

Refresh tokens rotate once. Reuse of a rotated token revokes its entire token family; a concurrent loser is treated conservatively as reuse, so two valid successor tokens cannot be created. `change-password` keeps the authenticated session and revokes the user's other sessions, while `logout-all` revokes every session including the caller.

### First General Manager

Run the seed first, provide the `BOOTSTRAP_*` environment variables locally, then execute:

```bash
npm run bootstrap:general-manager
```

The command refuses to create another active General Manager in the same forum, hashes the password with Argon2id, and never logs it.

### Core management contracts

- `/api/v1/forums/current`
- `/api/v1/branches`
- `/api/v1/users`
- `/api/v1/roles` and `/api/v1/permissions`
- `/api/v1/students`, `/api/v1/parents`, `/api/v1/teachers`, `/api/v1/supervisors`
- `/api/v1/halaqas` including historical memberships and teacher/supervisor assignments
- `POST /api/v1/students/:id/transfer-halaqa`

Lists use server-side `page`/`limit` pagination (maximum 100), search, and scoped filters. Archive operations preserve history. Compound mutations and business audit writes use Prisma transactions. Swagger contains the complete DTO and route inventory in development.

Production startup:

```bash
npm run build
npm start
```

Swagger requires `SWAGGER_ENABLED=true` and is intentionally unavailable when `NODE_ENV=production`.

## Environment

Copy `.env.example` to `.env` and adjust values locally. `CORS_ORIGINS` is a comma-separated allowlist; wildcard origins are not used. Do not commit `.env` files or production credentials.

## Phase boundary

Phase 3 implements the core management APIs and real React admin login. Attendance, memorization, grades, Flutter, S3, Firebase, Socket.IO, and migration of the management page data sources remain deferred.
