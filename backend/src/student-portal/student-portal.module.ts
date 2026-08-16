import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { PrismaModule } from '../database/prisma.module';
import { StudentPortalController } from './student-portal.controller';
import { StudentPortalService } from './student-portal.service';

@Module({
  imports: [PrismaModule, AuthorizationModule],
  controllers: [StudentPortalController],
  providers: [StudentPortalService],
  exports: [StudentPortalService],
})
export class StudentPortalModule {}
