import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { ReportsService } from './services/reports.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ReportsController],
  providers: [ReportsService, PdfGeneratorService],
  exports: [ReportsService, PdfGeneratorService],
})
export class ReportsModule {}
