# Backend migration plan

## Current state — Phase 3

The root application remains a React 19 + Vite product prototype. Its `server.ts` still hosts legacy feature routes and mock data, but it is no longer an authentication source for the admin dashboard. React login, session restoration, role admission, and logout now use the NestJS web-auth endpoints. Access tokens stay in memory and refresh tokens stay in an HttpOnly cookie.

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

## Phase 3 boundary and later migration

The NestJS API now owns Forum, Branch, User, Role, Permission, Student, Parent, Teacher, Technical Supervisor, Halaqa, membership, assignment, transfer, and business-audit data in PostgreSQL. The corresponding React management pages intentionally remain on their legacy routes for this phase. Migrate each bounded UI feature only after API integration and regression verification. Remove `server.ts` only after no UI route depends on it.

## Legacy authentication warning

The Express prototype's demo identities, role headers, and in-memory records are not production authentication sources. The admin login has no demo-user fallback or quick-login path and does not persist identity or tokens in browser storage. Only `GENERAL_MANAGER` and `EXECUTIVE_MANAGER` are admitted to the current web dashboard.
