# Backend migration plan

## Current state — Phase 4 Verified

The root application is a React 19 + Vite dashboard connected to the NestJS production API in `backend/`. Core admin management modules are migrated from mock storage/legacy Express endpoints to the real NestJS API backed by PostgreSQL and Redis.

```text
React 19 Admin Web Dashboard (Vite)
             │
             │ [Authorization: Bearer <in-memory token>]
             │ [Transparent 401 Refresh via HttpOnly cookie]
             ▼
  Centralized API Client Layer (`src/lib/api/`)
             │
             ▼
NestJS Core API (`http://localhost:4000/api/v1`)
             │
      ┌──────┴──────┐
      ▼             ▼
 PostgreSQL       Redis
```

## Module Status Matrix

| Domain Module | Migration Status | Backend Endpoints | Notes |
| :--- | :--- | :--- | :--- |
| **Authentication & Session** | `MIGRATED` | `POST /auth/web/login`, `POST /auth/web/refresh`, `POST /auth/web/logout`, `GET /auth/me` | In-memory access token, HttpOnly refresh cookie (`qf_refresh`), automatic 401 retry queue. |
| **Forum Identity** | `MIGRATED` | `GET /forums/current`, `PATCH /forums/current` | Forum name and logo persisted in PostgreSQL; local UI cosmetic theme state preserved. |
| **Branches** | `MIGRATED` | `GET /branches`, `POST /branches`, `PATCH /branches/:id`, `POST /branches/:id/archive` | Scoped by current forum. |
| **Users Management** | `MIGRATED` | `GET /users`, `POST /users`, `PATCH /users/:id`, `POST /users/:id/suspend`, `POST /users/:id/activate`, `POST /users/:id/force-password-change`, `POST /users/:id/revoke-sessions` | Full server pagination, search, branch & role assignment, security status management. |
| **Roles & Permissions** | `MIGRATED` | `GET /roles`, `POST /roles`, `PATCH /roles/:id`, `PUT /roles/:id/permissions`, `GET /permissions` | Dynamic backend permission catalog, live assignment, system role protection. |
| **Student Management** | `MIGRATED` | `GET /students`, `POST /students`, `PATCH /students/:id`, `POST /students/:id/archive`, `POST /students/:id/transfer-halaqa`, `POST /halaqas/:id/students` | Real student profile creation, multi-tab modal integration, atomic halaqa transfers. |
| **Teachers Management** | `MIGRATED` | `GET /teachers`, `POST /teachers`, `PATCH /teachers/:id`, `POST /halaqas/:id/teachers` | Profile registration and halaqa assignment. |
| **Halaqat Management** | `MIGRATED` | `GET /halaqas`, `POST /halaqas`, `PATCH /halaqas/:id`, `POST /halaqas/:id/archive`, `POST /halaqas/:id/restore` | Real halaqa creation, branch association, soft-archival and restore. |
| **Parents Management** | `BACKEND READY / ADMIN USER UI MIGRATED` | `GET /parents`, `POST /parents`, `POST /parents/:id/students/:studentId` | Backend and API client ready; parents account provisioning handled via User Management UI (`PARENT` role). Standalone parent admin UI not present in original dashboard. |
| **Technical Supervisors** | `BACKEND READY / ADMIN USER UI MIGRATED` | `GET /supervisors`, `POST /supervisors`, `POST /halaqas/:id/supervisors` | Backend and API client ready; supervisor account provisioning handled via User Management UI (`TECHNICAL_SUPERVISOR` role). Standalone supervisor admin UI not present in original dashboard. |
| **Attendance & Memorization** | `LEGACY / PHASE 5 RESERVED` | Legacy `server.ts` | Reserved for Phase 5. |
| **Exams, Grades & Reports** | `LEGACY / PHASE 5 RESERVED` | Legacy `server.ts` | Reserved for Phase 5. |
| **Field Visits & Supervision** | `LEGACY / PHASE 5 RESERVED` | Legacy `server.ts` | Reserved for Phase 5. |
| **Realtime Chat & Notifications**| `LEGACY / PHASE 5 RESERVED` | Legacy `server.ts` | Reserved for Phase 5. |
| **Print Center & Strategic Plan**| `LEGACY / PHASE 5 RESERVED` | Legacy `server.ts` | Reserved for Phase 5. |

## Verified Integration Points

1. **Security & In-Memory Tokens**:
   - Access tokens are strictly stored in JavaScript module memory (`src/lib/api/client.ts`).
   - No sensitive token material persisted in `localStorage` or `sessionStorage`.
   - Refresh tokens are delivered and refreshed via HttpOnly Cookies with strict CORS origin verification.
2. **Atomic Student Transfers**:
   - Transferred via atomic `POST /api/v1/students/:id/transfer-halaqa` endpoint rather than multi-request delete/create cycles.
3. **Zero Mock Fallbacks**:
   - Migrated modules throw standard `ApiError` instances rather than silently falling back to mock or demo data on failure.
