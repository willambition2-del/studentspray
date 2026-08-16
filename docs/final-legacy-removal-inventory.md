# Final Legacy Removal Inventory

## 1. Executive Summary
- **Phase**: 16 — Final Legacy Removal & Production Data Source Consolidation
- **Objective**: Eradicate all legacy Express endpoints, mock databases, business `localStorage` persistence, and guarantee that NestJS + PostgreSQL are the sole production data source.
- **Verification Result**: 100% legacy artifacts removed. Full build, typecheck, static analysis, and regression suite pass cleanly.

---

## 2. Removed Legacy Artifacts & Replacements

| Legacy Component / File | Old Role | Replacement in Production | Removal & Verification Status |
| :--- | :--- | :--- | :--- |
| `server.ts` (Root) | In-memory Express dev/mock server (2,233 lines) | NestJS Enterprise API (`backend/src/*`) + PostgreSQL Prisma Database | **DELETED** & root scripts updated to pure Vite |
| Express server bundle in `package.json` | `tsx server.ts`, `esbuild server.ts` | Pure Vite build (`vite build`) and dev (`vite`) | **CLEANED**; `express`, `esbuild`, `tsx` removed from root build |
| Direct `fetch('/api/...')` in `src/App.tsx` | Fetching stats, users, roles, backups from legacy Express | Centralized clients (`src/lib/api/{users,roles,administrative,reports,forums}.ts`) | **REPLACED** with real NestJS endpoints |
| Direct `fetch('/api/...')` in `src/components/ChatSystem.tsx` | Legacy POST/PUT/DELETE fire-and-forget to Express | NestJS Realtime Socket.IO + REST Chat API (`src/lib/api/chat.ts`) | **REPLACED** with real NestJS chat endpoints |
| `localStorage` in `src/lib/api/reports.ts` | Reading token from `localStorage.getItem('token')` | In-memory token management (`getAccessToken()` from `client.ts`) | **REPLACED** with in-memory auth token |
| `localStorage` in `src/lib/circleAlertsStorage.ts` | Persisting tasks, private alerts, proposals in browser storage | In-memory runtime state + NestJS Administrative APIs | **REPLACED** |
| `localStorage` in `src/lib/gradesStorage.ts` | Persisting exams, grade audit logs, periods in browser storage | In-memory runtime state + NestJS Exams & Evaluations API | **REPLACED** |
| `localStorage` in `src/data/mockFieldVisits.ts` | Persisting supervisory visits in browser storage | In-memory runtime state + NestJS Field Visits API | **REPLACED** |
| `localStorage` in `src/lib/numberingSystem.ts` | Persisting prefix settings and counters in browser storage | In-memory runtime state + NestJS Governance API | **REPLACED** |
| `localStorage` in `src/components/FieldVisitsManagement.tsx` | Storing axes configuration in browser storage | Pure React component state (`useState`) | **REPLACED** |
| `localStorage` in `src/components/StudentPlanManagement.tsx` | Storing student plans in browser storage | In-memory runtime state + NestJS Educational Planning API | **REPLACED** |

---

## 3. Storage and State Architecture Validation
1. **Web Admin Storage**:
   - `localStorage` / `sessionStorage`: Storing zero business entities or authentication tokens.
   - Non-sensitive UI preference allowed: Search history in `GlobalSearchModal.tsx`.
   - Access Token: Stored strictly in memory in `src/lib/api/client.ts`.
   - Refresh Token: Stored strictly via HttpOnly cookie (`/auth/web/refresh`).
2. **Mobile Flutter Storage**:
   - Authentication Tokens: Stored securely using hardware-backed keystore (`flutter_secure_storage`).
   - Offline Cache: Drift SQLite database (`app_database.dart`) storing verified snapshots and queued mutations (`pending_mutations`).
   - Zero production mock data or fake HTTP client responses.

---

## 4. API Surface Verification
- **Web Admin Base URL**: `http://localhost:4000/api/v1` (Configurable via `VITE_API_URL`).
- **Flutter Mobile Base URL**: `http://10.0.2.2:4000/api/v1` (Configurable via `API_BASE_URL`).
- **Realtime Gateway**: Socket.IO at `ws://localhost:4000/chat` and `/notifications`.
- **Database**: PostgreSQL 15+ managed strictly via Prisma ORM (`backend/prisma/schema.prisma`).
