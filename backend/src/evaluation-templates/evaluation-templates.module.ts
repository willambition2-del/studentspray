import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { EvaluationTemplatesController } from './evaluation-templates.controller';
import { EvaluationTemplatesService } from './evaluation-templates.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [EvaluationTemplatesController],
  providers: [EvaluationTemplatesService],
  exports: [EvaluationTemplatesService],
})
export class EvaluationTemplatesModule {}
