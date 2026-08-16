import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { PrismaModule } from '../database/prisma.module';
import { StudentEvaluationsController } from './student-evaluations.controller';
import { StudentEvaluationsService } from './student-evaluations.service';

@Module({
  imports: [PrismaModule, AuthorizationModule],
  controllers: [StudentEvaluationsController],
  providers: [StudentEvaluationsService],
  exports: [StudentEvaluationsService],
})
export class StudentEvaluationsModule {}
