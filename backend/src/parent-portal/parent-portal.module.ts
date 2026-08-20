import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { ChatModule } from '../chat/chat.module';
import { PrismaModule } from '../database/prisma.module';
import { StudentPortalModule } from '../student-portal/student-portal.module';
import { ParentPortalController } from './parent-portal.controller';
import { ParentPortalService } from './parent-portal.service';

@Module({
  imports: [PrismaModule, AuthorizationModule, StudentPortalModule, ChatModule],
  controllers: [ParentPortalController],
  providers: [ParentPortalService],
  exports: [ParentPortalService],
})
export class ParentPortalModule {}
