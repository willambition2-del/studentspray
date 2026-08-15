# Backend migration plan

## Current state — Phase 4 Complete

The root application is a React 19 + Vite dashboard connected to the NestJS production API in `backend/`. Core admin management modules have been migrated from mock storage/legacy Express endpoints to the real NestJS API backed by PostgreSQL and Redis.

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

## Phase 4 Migrated Core Modules

1. **Centralized API Client Layer (`src/lib/api/`)**:
   - `client.ts`: Core HTTP wrapper with automatic Bearer token injection, single-flight refresh lock on 401 responses, and listener-based session invalidation without infinite redirect loops.
   - `auth.ts`: Authentication routines (`loginWeb`, `restoreWebSession`, `logoutWeb`, `readMe`).
   - `forums.ts`: `getCurrentForum`, `updateCurrentForum`.
   - `branches.ts`: `getBranches`, `getBranch`, `createBranch`, `updateBranch`, `archiveBranch`, `restoreBranch`.
   - `users.ts`: `getUsers`, `getUser`, `createUser`, `updateUser`, `assignUserRole`, `activateUser`, `suspendUser`, `forcePasswordChange`, `revokeUserSessions`.
   - `roles.ts`: `getRoles`, `getRole`, `createRole`, `updateRole`, `setRolePermissions`, `getPermissions`.
   - `students.ts`: `getStudents`, `getStudent`, `createStudent`, `updateStudent`, `archiveStudent`, `restoreStudent`, `transferStudentHalaqa`.
   - `parents.ts`: `getParents`, `getParent`, `createParent`, `updateParent`, `getParentStudents`, `linkStudentToParent`, `updateGuardianLink`, `unlinkStudentFromParent`.
   - `teachers.ts`: `getTeachers`, `getTeacher`, `createTeacher`, `updateTeacher`.
   - `supervisors.ts`: `getSupervisors`, `getSupervisor`, `createSupervisor`, `updateSupervisor`.
   - `halaqas.ts`: `getHalaqas`, `getHalaqa`, `createHalaqa`, `updateHalaqa`, `archiveHalaqa`, `restoreHalaqa`, memberships, teacher assignments, and supervisor assignments.

2. **Core Admin Screens Migrated**:
   - **User Management (`UserManagement.tsx`)**: Real user creation with explicit DTO mapping, dynamic branch and role assignment, server-side search and filtering, activate/suspend status toggles, and mandatory password change protocol.
   - **Roles & Permissions (`RolesManagement.tsx`)**: Dynamic system permissions matrix fetched directly from backend metadata, categorized Arabic display, custom role creation, and live permission assignment.
   - **Forum Settings & Identity (`VisualIdentity.tsx` & `App.tsx`)**: Real forum name and logo persistence via `PATCH /api/v1/forums/current`.
   - **Student Management (`StudentManagement.tsx` & `NewStudentModal.tsx`)**: Server-backed student registration, halaqa membership assignment, and atomic student transfer between halaqas with full database audit logging.
   - **Teacher Management (`TeachersManagement.tsx`)**: Real teacher record creation and profile loading backed by PostgreSQL.
   - **Halaqat Management (`HalaqatManagement.tsx`)**: Real halaqa creation, branch association, soft-archival (closure), and restoration.

## Phase 5 Boundaries

Features reserved for Phase 5 (not migrated in Phase 4):
- Daily Attendance & Memorization/Revision recording
- Exams, Grading & Evaluation sheets
- Field Supervision Visits
- Interactive Chat & Real-time Notifications
- Strategic Plan and Print Center
