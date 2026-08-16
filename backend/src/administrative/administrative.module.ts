import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdministrativeRequestsService } from './administrative-requests.service';
import { AdministrativeDecisionsService } from './administrative-decisions.service';
import { AdministrativeAlertsService } from './administrative-alerts.service';
import { AdministrativeTasksService } from './administrative-tasks.service';
import { AdministrativeController } from './administrative.controller';

@Module({
  imports: [PrismaModule, AuditModule, NotificationsModule],
  controllers: [AdministrativeController],
  providers: [
    AdministrativeRequestsService,
    AdministrativeDecisionsService,
    AdministrativeAlertsService,
    AdministrativeTasksService,
  ],
  exports: [
    AdministrativeRequestsService,
    AdministrativeDecisionsService,
    AdministrativeAlertsService,
    AdministrativeTasksService,
  ],
})
export class AdministrativeModule {}
