import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AuditModule } from '../audit/audit.module';
import { EvaluationTemplatesModule } from '../evaluation-templates/evaluation-templates.module';
import { FieldVisitsModule } from '../field-visits/field-visits.module';
import { SupervisorWorkspaceController } from './supervisor-workspace.controller';
import { SupervisorWorkspaceService } from './supervisor-workspace.service';

@Module({
  imports: [
    PrismaModule,
    AuthorizationModule,
    AuditModule,
    EvaluationTemplatesModule,
    FieldVisitsModule,
  ],
  controllers: [SupervisorWorkspaceController],
  providers: [SupervisorWorkspaceService],
  exports: [SupervisorWorkspaceService],
})
export class SupervisorWorkspaceModule {}
