# Backend migration plan

## Current state — Phase 16 Complete (Final Legacy Removal & Production Consolidation)

The platform consists of:
1. A production-ready NestJS API backend (`backend/`) backed by PostgreSQL, Redis, and Socket.IO.
2. A React 19 Admin Web Dashboard (Vite) for General Managers and Executive Managers directly consuming NestJS APIs with zero legacy Express server dependencies.
3. A unified Flutter Mobile App (`mobile/`) with Arabic RTL support, Riverpod state management, Drift offline queue, GoRouter role-based routing, and dedicated experiences for:
   - `TEACHER` (Halaqat, Attendance, Recitation, Progress, Offline Sync, Shelf)
   - `TECHNICAL_SUPERVISOR` (Halaqat, Teachers, Field Visits, Evaluations, Recommendations, Shelf)
   - `STUDENT` (Daily Plan, Attendance, Recitation, Exams, Evaluations, Progress, Activities, Competitions, Awards, Shelf)
   - `PARENT` (Multi-child switcher, Attendance, Recitations, Exams, Evaluations, Progress, Child Activities & Awards, Shelf)
   - **Centralized Notifications Center** (In-App notifications, device tokens, FCM push dispatch)
   - **Realtime Chat & Channels** (Socket.IO with JWT auth, role-scoped Halaqa group, Staff group, and Parent channels)
   - **Activities & Competitions** (Lifecycle management, participant nominations, automatic score rankings, notifications)
   - **Awards & Honor Badges** (Templates, granting history preservation, multi-role notifications)
   - **General Shelf & Sections** (Role-based & user-specific publisher rules, audience visibility filtering)
   - **Administrative Approvals, Decisions, Alerts & Tasks** (Formal workflow governance)
   - **Reports, Printing & PDF Center** (Arabic RTL PDF generation & UTF-8 BOM CSV exports)
   - **Final Legacy Eradication**: `server.ts` deleted, business `localStorage` eliminated, production mocks removed.

```text
React 19 Admin Web Dashboard (Vite) / Flutter Mobile App (Riverpod + Socket.IO)
             │
             │ [Authorization: Bearer <in-memory token>]
             │ [Socket.IO namespace: /chat with JWT Handshake Auth]
             ▼
Centralized API Client Layer (`src/lib/api/` & `mobile/lib/core/network/`)
             │
             ▼
NestJS Core API (`http://localhost:4000/api/v1`)
             │
      ┌──────┴──────┬──────────────┐
      ▼             ▼              ▼
 PostgreSQL       Redis       Socket.IO / FCM
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
| **Attendance Sessions & Records** | `MIGRATED` | `POST /halaqas/:halaqaId/attendance/sessions`, `PUT /attendance/sessions/:sessionId/records`, `GET /halaqas/:halaqaId/attendance`, `GET /students/:studentId/attendance`, `GET /halaqas/:halaqaId/attendance/summary` | Bulk record upserting, IDOR security checks, attendance metrics and rate calculations. Triggers parent absence notifications. |
| **Memorization & Revision** | `MIGRATED` | `POST /memorization`, `GET /memorization`, `POST /revision`, `GET /revision` | Surah/Ayah/Page ranges, evaluation score, rating enum, mistake count, idempotent submission via `clientMutationId`. |
| **Student Progress & Indicators** | `MIGRATED` | `GET /students/:studentId/progress` | Dynamically aggregates attendance rate, total recitation sessions, avg scores, active educational plan progress. |
| **Teacher Workspace (Mobile-Ready)**| `MIGRATED` | `GET /teacher/me/halaqas`, `GET /teacher/me/halaqas/:halaqaId/today` | Dedicated endpoint returning today's snapshot (session, plan, recitations, enrolled students). |
| **Exams, Final Grades & Evaluations** | `MIGRATED` | `GET /exams`, `POST /exams`, `POST /exams/:id/publish`, `POST /exams/:id/grade`, `GET /student-evaluations`, `POST /student-evaluations` | Role-guarded exam lifecycle, bulk grading, weighted calculations, and automatic student/parent notifications. |
| **Field Visits & Supervision Notes** | `MIGRATED` | `GET /supervisor/me/halaqas`, `GET /supervisor/me/teachers`, `GET /field-visits`, `POST /field-visits`, `POST /field-visits/:id/complete`, `GET /recommendations` | Complete supervisor workspace with multi-dimensional rubrics and action tracker. |
| **Notifications & Firebase FCM** | `MIGRATED` | `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/:id/read`, `POST /notifications/read-all`, `POST /notifications/devices`, `DELETE /notifications/devices/:token` | Multi-channel in-app and push notification system supporting all 4 roles with deep links. |
| **Realtime Chat & Socket.IO** | `MIGRATED` | `GET /chat/conversations`, `GET /chat/conversations/:id/messages`, `POST /chat/conversations/:id/messages`, `POST /chat/conversations/:id/read`, `GET /chat/unread-count`, WS Gateway `/chat` | Domain-scoped Halaqa group, Staff group, and Parent channel chats. Message persistence before socket emission. |
| **Activities & Competitions** | `MIGRATED` | `GET /activities`, `POST /activities`, `PATCH /activities/:id`, `POST /activities/:id/participants`, `GET /competitions`, `POST /competitions`, `POST /competitions/:id/results` | Forum/branch scoped, status transitions, participant nominations, automatic result rankings & notifications. |
| **Awards & Badges** | `MIGRATED` | `GET /awards`, `POST /awards`, `POST /awards/grant`, `GET /awards/students/:studentId` | Badge catalog, historical recognition preservation, automatic student/parent notification. |
| **General Shelf & Sections** | `MIGRATED` | `GET /shelf/sections`, `POST /shelf/sections`, `POST /shelf/permissions`, `GET /shelf/items`, `POST /shelf/items`, `PATCH /shelf/items/:id` | Section management, server-enforced publisher rules by role/user, target audience visibility filtering. |
| **Administrative Workflows** | `MIGRATED` | `GET /admin-requests`, `POST /admin-requests`, `POST /admin-requests/:id/review`, `GET /admin-decisions`, `POST /admin-decisions`, `GET /admin-alerts`, `PATCH /admin-alerts/:id/resolve`, `GET /admin-tasks`, `POST /admin-tasks`, `POST /admin-tasks/:id/follow-up` | Multi-step request approvals, official decision numbering (`DEC-YYYY-XXXX`), proactive alerts, and task tracking. |
| **Reports & Export Center** | `MIGRATED` | `GET /reports/dashboard-summary`, `GET /reports/students/:id`, `GET /reports/students/:id/pdf`, `GET /reports/halaqas/:id`, `GET /reports/halaqas/:id/pdf`, `GET /reports/attendance`, `GET /reports/attendance/export`, `GET /reports/students/export`, `GET /reports/administrative` | Derived data reporting, server-side Arabic RTL PDF generation, UTF-8 CSV exports with formula injection protection, print-friendly A4 layout. |

## Verified Integration Points

1. **Security & In-Memory Tokens**:
   - Access tokens are strictly stored in JavaScript module memory (`src/lib/api/client.ts`) and Flutter `TokenStorage`.
   - Refresh tokens are delivered and refreshed via HttpOnly Cookies with strict CORS origin verification.
   - Socket.IO gateway authenticates connections via JWT handshake auth verification.
2. **Transactional Invariants & Exclusivity**:
   - AcademicYear activation transactionally deactivates all other years for the same forum.
   - Attendance sessions enforce unique `(halaqaId, sessionDate)` compound index.
   - Chat messages enforce idempotent creation via unique `clientMessageId`.
   - Notifications and messages persist to PostgreSQL before pushing or broadcasting.
3. **Auditing & IDOR Protection**:
   - All critical write operations write detailed entries to `AuditLog`.
   - Chat gateway and controllers authorize membership per conversation to prevent unauthorized access.
4. **Zero Mock Fallbacks**:
   - Both Web Dashboard and Flutter mobile app fetch directly from real NestJS APIs with structured error handling.
