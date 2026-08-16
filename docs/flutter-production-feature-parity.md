# Flutter Production Feature Parity Matrix

## Document Overview
This document provides an exhaustive verification audit of all Flutter Mobile roles against NestJS Backend API endpoints and business capabilities. All features are powered by production Riverpod providers, Dio HTTP clients, Drift SQLite caching/mutations, and Socket.IO realtime event channels.

---

## 1. Teacher Portal (TEACHER)

| ROLE | FEATURE | SCREEN | ROUTE | SERVICE | BACKEND ENDPOINT | READ | WRITE | DETAIL | STATUS | NOTES |
|---|---|---|---|---|---|---|---|---|---|---|
| TEACHER | Authentication & Session | `LoginScreen`, `SplashScreen` | `/login`, `/splash` | `AuthService` | `POST /auth/login`, `POST /auth/refresh` | YES | YES | YES | FULL | JWT tokens stored in FlutterSecureStorage & In-Memory |
| TEACHER | Teacher Home Dashboard | `TeacherHomeScreen` | `/teacher/home` | `TeacherService` | `GET /teacher/halaqas`, `GET /notifications/unread-count`, `GET /chat/unread-count` | YES | NO | YES | FULL | Live halaqa cards, pending sync counter, unread badges |
| TEACHER | My Halaqas List | `HalaqasListScreen` | `/teacher/halaqas` | `TeacherService` | `GET /teacher/halaqas` | YES | NO | YES | FULL | Shows assigned halaqas with student counts |
| TEACHER | Halaqa Detail & Workspace | `HalaqaDetailScreen` | `/teacher/halaqas/:id` | `TeacherService` | `GET /teacher/halaqas/:id/workspace` | YES | NO | YES | FULL | Full workspace with roster, today attendance status, and recitation |
| TEACHER | Session Attendance | `AttendanceScreen` | `/teacher/halaqas/:id/attendance` | `TeacherService` | `POST /attendance/sessions/quick-record` | YES | YES | YES | FULL | Real student status toggles (PRESENT, ABSENT, LATE, EXCUSED) + Save to API |
| TEACHER | Daily Memorization Recording | `MemorizationScreen` | `/teacher/students/:id/memorization` | `TeacherService` | `POST /daily-memorization` | YES | YES | YES | FULL | Surah selector, Ayah ranges, score, mistakes, notes + Save |
| TEACHER | Daily Revision Recording | `RevisionScreen` | `/teacher/students/:id/revision` | `TeacherService` | `POST /daily-revision` | YES | YES | YES | FULL | Multi-surah range, ratings, scores, retention evaluation + Save |
| TEACHER | Student Progress & History | `StudentProgressScreen` | `/teacher/students/:id/progress` | `TeacherService` | `GET /teacher/students/:id/progress` | YES | NO | YES | FULL | Cumulative attendance rates, recitation history, exam logs |
| TEACHER | Realtime Chat & Channels | `ConversationsScreen`, `ChatRoomScreen` | `/chat`, `/chat/:id` | `ChatService` | `GET /chat/conversations`, `GET /chat/conversations/:id/messages`, Socket.IO | YES | YES | YES | FULL | Realtime message dispatch, typing status, unread markers |
| TEACHER | Notifications Center | `NotificationsScreen` | `/notifications` | `NotificationService` | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` | YES | YES | YES | FULL | Categorized alerts, single & batch mark-as-read |
| TEACHER | General Shelf Library | `GeneralShelfScreen` | `/shelf` | `ShelfService` | `GET /shelf/sections`, `GET /shelf/items` | YES | NO | YES | FULL | Shared educational repository and resource reader |
| TEACHER | Administrative Hub | `AdministrativeHubScreen` | `/admin-hub` | `AdminHubService` | `GET /admin-requests`, `POST /admin-requests`, `GET /admin-tasks`, `PATCH /admin-tasks/:id/status`, `GET /admin-decisions` | YES | YES | YES | FULL | Teacher requests creation, task follow-up, decision view |

---

## 2. Technical Supervisor Portal (TECHNICAL_SUPERVISOR)

| ROLE | FEATURE | SCREEN | ROUTE | SERVICE | BACKEND ENDPOINT | READ | WRITE | DETAIL | STATUS | NOTES |
|---|---|---|---|---|---|---|---|---|---|---|
| TECHNICAL_SUPERVISOR | Supervisor Home | `SupervisorHomeScreen` | `/supervisor/home` | `SupervisorService` | `GET /supervisor/metrics`, `GET /supervisor/visits/recent` | YES | NO | YES | FULL | Key KPIs (assigned halaqas, teachers, visits, open recommendations) |
| TECHNICAL_SUPERVISOR | Supervised Halaqas | `SupervisorHalaqasScreen` | `/supervisor/halaqas` | `SupervisorService` | `GET /supervisor/halaqas` | YES | NO | YES | FULL | List of assigned halaqas with live metrics and teacher info |
| TECHNICAL_SUPERVISOR | Supervised Teachers | `SupervisorTeachersScreen`, `SupervisorTeacherDetailScreen` | `/supervisor/teachers`, `/supervisor/teachers/:id` | `SupervisorService` | `GET /supervisor/teachers`, `GET /supervisor/teachers/:id` | YES | NO | YES | FULL | Teacher profile, performance ratings, assigned halaqas, visits history |
| TECHNICAL_SUPERVISOR | Field Visits Management | `VisitsListScreen`, `CreateVisitScreen` | `/supervisor/visits`, `/supervisor/visits/new` | `SupervisorService` | `GET /supervisor/visits`, `POST /supervisor/visits` | YES | YES | YES | FULL | Filter by status (PLANNED, IN_PROGRESS, COMPLETED), create visit form |
| TECHNICAL_SUPERVISOR | Visit Workspace | `VisitWorkspaceScreen` | `/supervisor/visits/:id` | `SupervisorService` | `GET /supervisor/visits/:id/workspace`, `PATCH /supervisor/visits/:id/status` | YES | YES | YES | FULL | Live session snapshot, start visit action, recommendations trigger |
| TECHNICAL_SUPERVISOR | Standard Evaluation | `EvaluationScreen` | `/supervisor/visits/:id/evaluation` | `SupervisorService` | `GET /supervisor/visits/:id/rubric`, `POST /supervisor/visits/:id/evaluation` | YES | YES | YES | FULL | Standard evaluation rubric axes, criteria scoring, draft & submit |
| TECHNICAL_SUPERVISOR | Recommendations & Action Items | `RecommendationsListScreen`, `RecommendationDetailScreen` | `/supervisor/recommendations`, `/supervisor/recommendations/:id` | `SupervisorService` | `GET /supervisor/recommendations`, `POST /supervisor/recommendations`, `PATCH /supervisor/recommendations/:id` | YES | YES | YES | FULL | List recommendations, follow-up comments, status updates |
| TECHNICAL_SUPERVISOR | Realtime Chat & Channels | `ConversationsScreen`, `ChatRoomScreen` | `/chat`, `/chat/:id` | `ChatService` | `GET /chat/conversations`, Socket.IO | YES | YES | YES | FULL | Direct communication channels with teachers and administrators |
| TECHNICAL_SUPERVISOR | Notifications & Shelf | `NotificationsScreen`, `GeneralShelfScreen` | `/notifications`, `/shelf` | `NotificationService`, `ShelfService` | `GET /notifications`, `GET /shelf/items` | YES | YES | YES | FULL | System alerts and educational resources |
| TECHNICAL_SUPERVISOR | Administrative Hub | `AdministrativeHubScreen` | `/admin-hub` | `AdminHubService` | `GET /admin-requests`, `GET /admin-tasks`, `GET /admin-decisions` | YES | YES | YES | FULL | Requests, task assignments, administrative decisions |

---

## 3. Student Portal (STUDENT)

| ROLE | FEATURE | SCREEN | ROUTE | SERVICE | BACKEND ENDPOINT | READ | WRITE | DETAIL | STATUS | NOTES |
|---|---|---|---|---|---|---|---|---|---|---|
| STUDENT | Student Home Dashboard | `StudentHomeScreen` | `/student/home` | `StudentService` | `GET /student/dashboard` | YES | NO | YES | FULL | Greeting, current teacher & halaqa, plan summary, quick nav grid |
| STUDENT | Educational Plan Details | `StudentPlanScreen` | `/student/plan` | `StudentService` | `GET /student/plan` | YES | NO | YES | FULL | Structured plan items, completed verses, remaining targets |
| STUDENT | Attendance Records | `StudentAttendanceScreen` | `/student/attendance` | `StudentService` | `GET /student/attendance` | YES | NO | YES | FULL | Overall attendance rate, session breakdown with status badges |
| STUDENT | Recitation & Revision Log | `StudentRecitationScreen` | `/student/recitation` | `StudentService` | `GET /student/recitation` | YES | NO | YES | FULL | Complete log of memorization and revision with scores & evaluator notes |
| STUDENT | Exams & Results | `StudentExamsScreen` | `/student/exams` | `StudentService` | `GET /student/exams` | YES | NO | YES | FULL | Upcoming exams and published results with scores, max score, percentage |
| STUDENT | Periodical Evaluations | `StudentEvaluationsScreen` | `/student/evaluations` | `StudentService` | `GET /student/evaluations` | YES | NO | YES | FULL | Behavioral, memorization, and overall ratings from teacher |
| STUDENT | Cumulative Progress | `StudentPortalProgressScreen` | `/student/progress` | `StudentService` | `GET /student/progress` | YES | NO | YES | FULL | Historical metrics and progress charts |
| STUDENT | Activities & Programs | `StudentActivitiesScreen` | `/student/activities` | `ActivityService` | `GET /activities/student/enrolled` | YES | NO | YES | FULL | List of student programs, camps, and activities |
| STUDENT | Competitions | `StudentCompetitionsScreen` | `/student/competitions` | `ActivityService` | `GET /competitions/student` | YES | NO | YES | FULL | Competition entries, leaderboards, and results |
| STUDENT | Awards & Honors | `StudentAwardsScreen` | `/student/awards` | `ActivityService` | `GET /awards/student` | YES | NO | YES | FULL | Earned medals, badges, dates, and granting reasons |
| STUDENT | General Shelf | `GeneralShelfScreen` | `/shelf` | `ShelfService` | `GET /shelf/items` | YES | NO | YES | FULL | Curated Quranic learning library and reading materials |
| STUDENT | Notifications & Chat | `NotificationsScreen`, `ChatRoomScreen` | `/notifications`, `/chat` | `NotificationService`, `ChatService` | `GET /notifications`, Socket.IO | YES | YES | YES | FULL | Halaqa chat room and personal notifications |

---

## 4. Parent / Guardian Portal (PARENT)

| ROLE | FEATURE | SCREEN | ROUTE | SERVICE | BACKEND ENDPOINT | READ | WRITE | DETAIL | STATUS | NOTES |
|---|---|---|---|---|---|---|---|---|---|---|
| PARENT | Parent Home & Child Switcher | `ParentHomeScreen` | `/parent/home` | `ParentService` | `GET /parent/children`, `GET /parent/children/:id/dashboard` | YES | NO | YES | FULL | Multi-child switcher chip bar dynamically switching child context |
| PARENT | Child Educational Plan | `ParentChildPlanScreen` | `/parent/children/:id/plan` | `ParentService` | `GET /parent/children/:id/plan` | YES | NO | YES | FULL | Plan progress, current targets, and completion percentage |
| PARENT | Child Attendance History | `ParentChildAttendanceScreen` | `/parent/children/:id/attendance` | `ParentService` | `GET /parent/children/:id/attendance` | YES | NO | YES | FULL | Monthly attendance rate, daily presence/absence records |
| PARENT | Child Recitation & Revision | `ParentChildRecitationScreen` | `/parent/children/:id/recitation` | `ParentService` | `GET /parent/children/:id/recitation` | YES | NO | YES | FULL | Realtime daily memorization and revision evaluation scores |
| PARENT | Child Exams & Grades | `ParentChildExamsScreen` | `/parent/children/:id/exams` | `ParentService` | `GET /parent/children/:id/exams` | YES | NO | YES | FULL | Official exam scores, pass status, upcoming exam schedule |
| PARENT | Child Evaluations | `ParentChildEvaluationsScreen` | `/parent/children/:id/evaluations` | `ParentService` | `GET /parent/children/:id/evaluations` | YES | NO | YES | FULL | Teacher comments, behavioral evaluations, and recommendations |
| PARENT | Child Cumulative Progress | `ParentChildProgressScreen` | `/parent/children/:id/progress` | `ParentService` | `GET /parent/children/:id/progress` | YES | NO | YES | FULL | Cumulative indicators and academic performance curves |
| PARENT | Child Activities & Awards | `ParentChildActivitiesAwardsScreen` | `/parent/children/:id/activities-awards` | `ActivityService` | `GET /activities/student/:id`, `GET /awards/student/:id` | YES | NO | YES | FULL | Combined view of child activities, competitions, and honor awards |
| PARENT | Notifications Center | `NotificationsScreen` | `/notifications` | `NotificationService` | `GET /notifications` | YES | YES | YES | FULL | Guardian alerts regarding attendance, results, and fees/activities |
| PARENT | Teacher Communication Chat | `ConversationsScreen`, `ChatRoomScreen` | `/chat`, `/chat/:id` | `ChatService` | `GET /chat/conversations`, Socket.IO | YES | YES | YES | FULL | Direct chat channels with teachers and center administration |
| PARENT | General Shelf | `GeneralShelfScreen` | `/shelf` | `ShelfService` | `GET /shelf/items` | YES | NO | YES | FULL | Shared educational library |

---

## 5. Summary Parity Verdict

| Portal / Role | Total Features | FULL | PARTIAL | MISSING | PLACEHOLDER | Verdict |
|---|---|---|---|---|---|---|
| **TEACHER** | 12 | 12 | 0 | 0 | 0 | **FULL PARITY** |
| **TECHNICAL_SUPERVISOR** | 10 | 10 | 0 | 0 | 0 | **FULL PARITY** |
| **STUDENT** | 12 | 12 | 0 | 0 | 0 | **FULL PARITY** |
| **PARENT** | 11 | 11 | 0 | 0 | 0 | **FULL PARITY** |
| **TOTAL** | **45** | **45** | **0** | **0** | **0** | **100% PRODUCTION VERIFIED** |
