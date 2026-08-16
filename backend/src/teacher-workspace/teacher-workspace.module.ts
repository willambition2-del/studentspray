import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { TeacherWorkspaceController } from './teacher-workspace.controller';
import { TeacherWorkspaceService } from './teacher-workspace.service';

@Module({
  imports: [AuthorizationModule],
  controllers: [TeacherWorkspaceController],
  providers: [TeacherWorkspaceService],
  exports: [TeacherWorkspaceService],
})
export class TeacherWorkspaceModule {}
