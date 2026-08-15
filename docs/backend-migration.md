# Backend migration plan

## Current state

The root application is an existing React 19 + Vite product prototype. Its `server.ts` combines the Vite development middleware, static production hosting, in-memory records, prototype authentication/authorization, and legacy API routes. Several UI areas also persist mock or user-entered data in `localStorage`.

## Phase 1 decision

The production backend foundation lives in `backend/` instead of restructuring the repository into `apps/api/`. This avoids changing the root package scripts, Vite configuration, current routes, or deployment behavior while the legacy server is still required by the UI.

```text
Existing React UI + legacy Express server
                  |
                  | gradual endpoint-by-endpoint migration
                  v
             NestJS API
                  |
          PostgreSQL + Redis
```

The two applications currently run independently:

- Existing prototype: root `npm run dev`
- New API: `cd backend && npm run start:dev`

## Later migration

Future phases should introduce authentication first, then migrate bounded frontend features endpoint by endpoint. Each migration should remove the corresponding in-memory/localStorage dependency only after API integration and regression verification. The legacy `server.ts` should be removed only after no current UI route depends on it.
