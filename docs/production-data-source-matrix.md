# Production Data Source Matrix

## 1. Architectural Overview

The Quran Forum platform operates exclusively on a unified multi-tier enterprise architecture:
- **Presentation Layer (Web)**: React Admin SPA (Vite + TypeScript + Tailwind CSS)
- **Presentation Layer (Mobile)**: Flutter (Android / iOS / Web / Desktop)
- **Application Layer**: NestJS Enterprise API (`backend/src/*`)
- **Realtime Layer**: Socket.IO Gateway (`/chat`, `/notifications`)
- **Cache Layer**: Redis Cache & Pub/Sub
- **Persistence Layer**: PostgreSQL 15+ via Prisma ORM

---

## 2. Complete Module & Data Source Mapping

| Functional Module | Frontend Client / Screen | NestJS Endpoint | Prisma Model / PostgreSQL Table | Cache / Realtime Source |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication (Web)** | `LoginModal.tsx` | `POST /auth/web/login`<br>`POST /auth/web/refresh`<br>`POST /auth/web/logout` | `User`, `UserRole`, `Session` | In-Memory Token + HttpOnly Refresh Cookie |
| **Authentication (Mobile)** | `login_screen.dart` | `POST /auth/login`<br>`POST /auth/refresh`<br>`POST /auth/logout` | `User`, `UserRole`, `Session` | `flutter_secure_storage` |
| **Users & Profiles** | `UserManagement.tsx` | `GET/POST/PATCH /users`<br>`POST /users/:id/{activate,suspend}` | `User`, `TeacherProfile`, `StudentProfile`, `ParentProfile` | Redis User Cache |
| **Roles & Permissions** | `RolesManagement.tsx` | `GET/POST/PATCH /roles`<br>`PUT /roles/:id/permissions` | `Role`, `Permission`, `RolePermission` | In-Memory Permission Guard |
| **Halaqat Management** | `HalaqatManagement.tsx` | `GET/POST/PATCH /halaqas` | `Halaqa`, `HalaqaTeacher`, `HalaqaStudent` | PostgreSQL Indexed Views |
| **Attendance Tracking** | `AttendanceManagement.tsx`<br>`student_attendance_screen.dart` | `GET/POST /attendance`<br>`GET /attendance/stats` | `AttendanceRecord`, `HalaqaSession` | Drift SQLite Offline Sync |
| **Quran Memorization Plans** | `StudentPlanManagement.tsx`<br>`student_plan_screen.dart` | `GET/POST/PATCH /educational-plans` | `EducationalPlan`, `EducationalPlanItem` | Drift SQLite Offline Sync |
| **Recitation Logs** | `RecitationScreen.tsx`<br>`student_recitation_screen.dart` | `GET/POST /recitations` | `RecitationRecord` | Drift SQLite Offline Sync |
| **Supervisor Field Visits** | `FieldVisitsManagement.tsx` | `GET/POST/PATCH /field-visits`<br>`POST /field-visits/:id/evaluate` | `FieldVisit`, `EvaluationReport`, `Recommendation` | PostgreSQL Transaction |
| **Exams, Grades & Evaluations**| `GradesManagement.tsx`<br>`student_exams_screen.dart` | `GET/POST /exams`<br>`POST /exams/:id/grade`<br>`POST /evaluations` | `Exam`, `StudentExamGrade`, `StudentEvaluation` | PostgreSQL Strict Scopes |
| **Administrative Approvals** | `ApprovalsCenter.tsx` | `GET/POST /admin-requests`<br>`POST /admin-requests/:id/review` | `AdminRequest`, `ApprovalAction` | PostgreSQL Transaction |
| **Administrative Decisions** | `AdminDecisions.tsx` | `GET/POST/PATCH /admin-decisions` | `AdminDecision`, `AdminDecisionAcknowledgment` | PostgreSQL Full-text Index |
| **Critical System Alerts** | `CriticalAlerts.tsx`<br>`TrackingAlertsHub.tsx` | `GET/POST /admin-alerts`<br>`POST /admin-alerts/:id/{acknowledge,resolve}` | `AdminAlert` | Redis Queue + Socket.IO Broadcast |
| **Realtime Chat & Messaging** | `ChatSystem.tsx` | `GET /chat/conversations`<br>`GET /chat/messages/:id`<br>`POST /chat/messages` | `ChatConversation`, `ChatMessage`, `ChatParticipant` | Socket.IO Gateway (`/chat`) |
| **Notifications & FCM** | Notification Bell Component | `GET/PATCH /notifications`<br>`POST /notifications/devices` | `Notification`, `NotificationDevice` | Socket.IO (`/notifications`) + FCM Push |
| **Activities & Competitions** | `ActivitiesAwards.tsx` | `GET/POST /activities`<br>`GET/POST /competitions` | `Activity`, `Competition`, `CompetitionParticipant` | PostgreSQL Indexed Queries |
| **General Shelf & Library** | `GeneralShelf.tsx` | `GET/POST/PATCH /shelf/resources`<br>`GET/POST /shelf/posts` | `ShelfResource`, `ShelfPost`, `ShelfReflection` | PostgreSQL Storage |
| **Reports, Printing & PDF** | `PrintCenter.tsx` | `GET /reports/{dashboard-summary,students,halaqas,attendance,export}`<br>`GET /reports/students/:id/pdf`<br>`GET /reports/halaqas/:id/pdf` | Aggregated Prisma DB Queries | Streamed Arabic PDF & UTF-8 BOM CSV |

---

## 3. Negative Legacy Proof Checklist

- [x] Express Server `server.ts` — **REMOVED** (0 instances)
- [x] Hardcoded in-memory mock databases in web admin — **REMOVED**
- [x] Business records in `localStorage` or `sessionStorage` — **REMOVED** (0 instances)
- [x] Hardcoded tokens or authentication mock bypasses — **REMOVED** (0 instances)
- [x] Direct unauthorized mock fallbacks on network failures — **REMOVED** (graceful error states displayed)
- [x] All 10 NestJS Test Suites (82 tests) — **PASSING**
- [x] All 41 Flutter Test Suites — **PASSING**
- [x] React TypeScript compile & Vite build — **PASSING**
