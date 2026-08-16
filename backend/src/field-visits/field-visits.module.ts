import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AuditModule } from '../audit/audit.module';
import { FieldVisitsController } from './field-visits.controller';
import { FieldVisitsService } from './field-visits.service';

@Module({
  imports: [PrismaModule, AuthorizationModule, AuditModule],
  controllers: [FieldVisitsController],
  providers: [FieldVisitsService],
  exports: [FieldVisitsService],
})
export class FieldVisitsModule {}
