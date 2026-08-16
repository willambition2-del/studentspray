import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { EducationalPlansController } from './educational-plans.controller';
import { EducationalPlansService } from './educational-plans.service';

@Module({
  imports: [AuthorizationModule],
  controllers: [EducationalPlansController],
  providers: [EducationalPlansService],
  exports: [EducationalPlansService],
})
export class EducationalPlansModule {}
