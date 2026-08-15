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
- IDs supplied by React or future Flutter clients are treated only as requested resource identifiers and are always re-authorized server-side.

Business APIs added later must declare permissions with `@RequirePermissions(...)` and call `AccessScopeService` for the target resource.
