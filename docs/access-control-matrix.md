# Quran Forum access-control matrix

Authorization is always evaluated as:

```text
authenticated session + permission + resource scope
```

A role or permission never grants access to every record by itself. Forum, branch, Halaqa, student, and guardian relationships are resolved by the backend.

| Role | Primary product areas | Permission baseline | Resource scope |
|---|---|---|---|
| `GENERAL_MANAGER` | Dashboard, users, roles, students, Halaqas, staff, reports, settings, audit | Current catalog in full | Entire assigned forum |
| `EXECUTIVE_MANAGER` | Operational dashboard, students, Halaqas, teachers, approvals, visits, reports | Broad read/operations; no settings or role management by default | Forum-wide when role assignment has no branch; otherwise assigned branches |
| `TEACHER` | Assigned Halaqas, students, attendance, memorization, grades | Scoped read/write for teaching workflows | Active `HalaqaTeacher` assignments and students with active membership in those Halaqas |
| `TECHNICAL_SUPERVISOR` | Assigned Halaqas, teacher follow-up, field visits, scoped reports | Scoped read plus field-visit write | Active `HalaqaSupervisor` assignments; teacher/student data reached through those Halaqas |
| `STUDENT` | Own plan, attendance, memorization, grades and achievements | Own-data read only | Own `StudentProfile` only |
| `PARENT` | Child progress, attendance, grades, notifications and teacher communication | Child-data read only | Students linked through `StudentGuardian` only |

## Scope rules

- `canAccessForum`: the authenticated user's forum must match the resource forum.
- `canAccessBranch`: General Manager is forum-wide; Executive Manager follows `UserRole.branchId`; other roles remain constrained to their own branch context.
- `canAccessHalaqa`: managers follow branch scope; teachers and supervisors require active assignment rows.
- `canAccessStudent`: managers follow forum/branch rules; teacher/supervisor access is derived through active Halaqa membership; students access themselves; parents require `StudentGuardian`.
- `canAccessChatConversation`:
  - `HALAQA`: Active teacher and enrolled active students of the Halaqa only.
  - `STAFF`: Forum staff members (General Manager, Executive Manager, Technical Supervisor, Teacher) only.
  - `PARENT_STUDENT_CHANNEL`: Linked parent of the child and child's active Halaqa teachers only.
  - Global/arbitrary DMs are strictly prohibited.
- `canAccessNotifications`: Users can only read and manage their own notifications (`userId = CurrentUser.id`). Device tokens are strictly tied to authenticated user sessions.
- `canAccessShelf`:
  - `STUDENT`: Read-only access to sections and items targeting `ALL_USERS` or `STUDENTS_ONLY`.
  - `PARENT`: Read-only access to sections and items targeting `ALL_USERS` or `PARENTS_ONLY`.
  - `TEACHER`: Read access to `ALL_USERS`, `TEACHERS_ONLY`, `STAFF_ONLY`. Publishing requires active `ShelfPublisherRule` or manager role.
  - `TECHNICAL_SUPERVISOR`: Read access to `ALL_USERS`, `STAFF_ONLY`. Publishing requires active `ShelfPublisherRule` or manager role.
  - `GENERAL_MANAGER` / `EXECUTIVE_MANAGER`: Full management of sections, publisher rules, and posts.
- `canAccessActivitiesAndCompetitions`: Managers follow branch scope; Teachers/Supervisors follow assigned halaqas/branches; Students see published activities/competitions and their own registrations/results; Parents see their linked children's registrations and results.
- `canGrantAwards`: Managers and authorized Teachers/Supervisors only. Students and Parents cannot grant awards. Historical student awards are permanent and preserved across halaqa transfers.
- `canAccessReports`:
  - `GENERAL_MANAGER`: Full forum-wide reporting access across all branches, halaqas, students, and staff.
  - `EXECUTIVE_MANAGER`: Reporting access scoped by assigned branch.
  - `TECHNICAL_SUPERVISOR`: Scoped reports for supervised halaqat and teachers.
  - `TEACHER`: Scoped reports for assigned halaqat and enrolled students.
  - `PARENT`: Scoped reports for linked children only.
  - `STUDENT`: Scoped report for own student profile only.
  - `reports.export`: Permission required for PDF generation and CSV exports. Formula injection protection enforced on all CSV rows.

Phase 3 business APIs declare permissions with `@RequirePermissions(...)` and resolve forum, branch, Halaqa, student, assignment, and guardian scope server-side. `branches.read` and `branches.manage` are part of the system-controlled permission catalog. Role mutation also applies a no-escalation policy: non-General Managers cannot grant a permission they do not hold or assign `GENERAL_MANAGER`.

Suspending an account revokes active sessions in the same transaction. Business changes are written to `AuditLog`; authentication and session security events remain in the separate `SecurityAuditLog`.


