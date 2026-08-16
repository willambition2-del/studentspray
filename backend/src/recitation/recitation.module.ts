import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { MemorizationController } from './memorization.controller';
import { RecitationService } from './recitation.service';
import { RevisionController } from './revision.controller';
import { StudentProgressController } from './student-progress.controller';

@Module({
  imports: [AuthorizationModule],
  controllers: [
    MemorizationController,
    RevisionController,
    StudentProgressController,
  ],
  providers: [RecitationService],
  exports: [RecitationService],
})
export class RecitationModule {}
