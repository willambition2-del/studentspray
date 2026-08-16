import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { RecitationService } from './recitation.service';

@ApiTags('Student Progress')
@ApiBearerAuth()
@Controller('students')
export class StudentProgressController {
  constructor(private readonly service: RecitationService) {}

  @Get(':studentId/progress')
  @RequirePermissions('student_progress.read')
  getStudentProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
  ) {
    return this.service.getStudentProgress(user, studentId);
  }
}
