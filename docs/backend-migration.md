# Backend migration plan

## Current state — Phase 6 Complete (Flutter Foundation + Teacher Mobile App)

The platform consists of:
1. A production-ready NestJS API backend (`backend/`) backed by PostgreSQL & Redis.
2. A React 19 Admin Web Dashboard (Vite) for General Managers and Executive Managers.
3. A unified Flutter Mobile App (`mobile/`) with Arabic RTL support, Riverpod state management, Drift offline queue, GoRouter role-based routing, and a complete **Teacher Mobile Experience** (`TEACHER`).

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
| **Parents Management** | `MIGRATED` | `GET /parents`, `POST /parents`, `POST /parents/:id/students/:studentId` | Backend and API client ready; parents account provisioning handled via User Management UI. |
| **Technical Supervisors** | `MIGRATED` | `GET /supervisors`, `POST /supervisors`, `POST /halaqas/:id/supervisors` | Backend and API client ready; supervisor account provisioning handled via User Management UI. |
| **Academic Years & Terms** | `MIGRATED` | `GET /academic-years`, `POST /academic-years`, `PATCH /academic-years/:id`, `POST /academic-years/:id/activate`, `POST /academic-years/:id/terms`, `PATCH /academic-years/terms/:termId` | Single active year enforced transactionally, term date boundary validation, audit logged. |
| **Educational Plans** | `MIGRATED` | `GET /educational-plans`, `POST /educational-plans`, `PATCH /educational-plans/:id`, `POST /educational-plans/:id/activate`, `POST /educational-plans/:id/archive`, `POST /educational-plans/:id/items`, `PATCH /educational-plans/items/:itemId`, `DELETE /educational-plans/items/:itemId` | Supports HIFZ, MURAJAAH, and CUSTOM templates, scoped by forum/branch/halaqa/student, items ordering and targets. |
| **Attendance Sessions & Records** | `MIGRATED` | `POST /halaqas/:halaqaId/attendance/sessions`, `PUT /attendance/sessions/:sessionId/records`, `GET /halaqas/:halaqaId/attendance`, `GET /students/:studentId/attendance`, `GET /halaqas/:halaqaId/attendance/summary` | Bulk record upserting, IDOR security checks, attendance metrics and rate calculations. |
| **Memorization & Revision** | `MIGRATED` | `POST /memorization`, `GET /memorization`, `POST /revision`, `GET /revision` | Surah/Ayah/Page ranges, evaluation score, rating enum, mistake count, idempotent submission via `clientMutationId`. |
| **Student Progress & Indicators** | `MIGRATED` | `GET /students/:studentId/progress` | Dynamically aggregates attendance rate, total recitation sessions, avg scores, active educational plan progress. |
| **Teacher Workspace (Mobile-Ready)**| `MIGRATED` | `GET /teacher/me/halaqas`, `GET /teacher/me/halaqas/:halaqaId/today` | Dedicated endpoint returning today's snapshot (session, plan, recitations, enrolled students). |
| **Exams, Final Grades & Certificates** | `RESERVED` | — | Reserved for subsequent phase. |
| **Field Visits & Supervision Notes** | `RESERVED` | — | Reserved for subsequent phase. |
| **Realtime Chat & Notifications**| `RESERVED` | — | Reserved for subsequent phase. |

## Verified Integration Points

1. **Security & In-Memory Tokens**:
   - Access tokens are strictly stored in JavaScript module memory (`src/lib/api/client.ts`).
   - No sensitive token material persisted in `localStorage` or `sessionStorage`.
   - Refresh tokens are delivered and refreshed via HttpOnly Cookies with strict CORS origin verification.
2. **Transactional Invariants & Exclusivity**:
   - AcademicYear activation transactionally deactivates all other years for the same forum.
   - Attendance sessions enforce unique `(halaqaId, sessionDate)` compound index.
   - Memorization and Revision records enforce unique `clientMutationId` for idempotent submissions.
3. **Auditing & IDOR Protection**:
   - All Phase 5 write operations write detailed entries to `AuditLog`.
   - Teachers cannot record attendance or recitations for halaqas/students they do not teach.
4. **Zero Mock Fallbacks**:
   - UI components (`EducationalPlanning.tsx`, `StudentPlanManagement.tsx`, `StudentMeasurementCenter.tsx`) fetch directly from the real NestJS API and throw standard `ApiError` instances rather than silently falling back to mock or demo data on failure.
