import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { AcademicYearsModule } from "./academic-years/academic-years.module";
import { AttendanceModule } from "./attendance/attendance.module";
import { AuthModule } from "./auth/auth.module";
import { AuthorizationModule } from "./authorization/authorization.module";
import { RequestLoggingInterceptor } from "./common/interceptors/request-logging.interceptor";
import { environmentValidationSchema } from "./config/environment";
import { PrismaModule } from "./database/prisma.module";
import { EducationalPlansModule } from "./educational-plans/educational-plans.module";
import { EvaluationTemplatesModule } from "./evaluation-templates/evaluation-templates.module";
import { ExamsModule } from "./exams/exams.module";
import { FieldVisitsModule } from "./field-visits/field-visits.module";
import { ForumsModule } from "./forums/forums.module";
import { HalaqasModule } from "./halaqas/halaqas.module";
import { HealthModule } from "./health/health.module";
import { ParentPortalModule } from "./parent-portal/parent-portal.module";
import { ParentsModule } from "./parents/parents.module";
import { ProfilesModule } from "./profiles/profiles.module";
import { RecitationModule } from "./recitation/recitation.module";
import { RedisModule } from "./redis/redis.module";
import { RolesModule } from "./roles/roles.module";
import { StudentEvaluationsModule } from "./student-evaluations/student-evaluations.module";
import { StudentPortalModule } from "./student-portal/student-portal.module";
import { StudentsModule } from "./students/students.module";
import { SupervisorsModule } from "./supervisors/supervisors.module";
import { SupervisorWorkspaceModule } from "./supervisor-workspace/supervisor-workspace.module";
import { TeachersModule } from "./teachers/teachers.module";
import { TeacherWorkspaceModule } from "./teacher-workspace/teacher-workspace.module";
import { UsersModule } from "./users/users.module";
import { AuditModule } from "./audit/audit.module";
import { BranchesModule } from "./branches/branches.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { ChatModule } from "./chat/chat.module";
import { ActivitiesModule } from "./activities/activities.module";
import { CompetitionsModule } from "./competitions/competitions.module";
import { AwardsModule } from "./awards/awards.module";
import { ShelfModule } from "./shelf/shelf.module";
import { AdministrativeModule } from "./administrative/administrative.module";
import { ReportsModule } from "./reports/reports.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: environmentValidationSchema,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    RedisModule,
    AuditModule,
    NotificationsModule,
    ChatModule,
    ActivitiesModule,
    CompetitionsModule,
    AwardsModule,
    ShelfModule,
    AdministrativeModule,
    ReportsModule,
    ProfilesModule,
    AuthorizationModule,
    AuthModule,
    ForumsModule,
    BranchesModule,
    UsersModule,
    RolesModule,
    StudentsModule,
    ParentsModule,
    TeachersModule,
    SupervisorsModule,
    HalaqasModule,
    AcademicYearsModule,
    EducationalPlansModule,
    AttendanceModule,
    RecitationModule,
    EvaluationTemplatesModule,
    FieldVisitsModule,
    ExamsModule,
    StudentEvaluationsModule,
    StudentPortalModule,
    ParentPortalModule,
    TeacherWorkspaceModule,
    SupervisorWorkspaceModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
  ],
})
export class AppModule {}
