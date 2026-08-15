import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./auth/auth.module";
import { AuthorizationModule } from "./authorization/authorization.module";
import { RequestLoggingInterceptor } from "./common/interceptors/request-logging.interceptor";
import { environmentValidationSchema } from "./config/environment";
import { PrismaModule } from "./database/prisma.module";
import { HealthModule } from "./health/health.module";
import { RedisModule } from "./redis/redis.module";
import { AuditModule } from "./audit/audit.module";
import { BranchesModule } from "./branches/branches.module";
import { ForumsModule } from "./forums/forums.module";
import { HalaqasModule } from "./halaqas/halaqas.module";
import { ParentsModule } from "./parents/parents.module";
import { ProfilesModule } from "./profiles/profiles.module";
import { RolesModule } from "./roles/roles.module";
import { StudentsModule } from "./students/students.module";
import { SupervisorsModule } from "./supervisors/supervisors.module";
import { TeachersModule } from "./teachers/teachers.module";
import { UsersModule } from "./users/users.module";

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
    HealthModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
  ],
})
export class AppModule {}
