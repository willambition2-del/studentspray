import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { StudentPortalService } from './student-portal.service';

@ApiTags('Student Portal (Mobile & Web)')
@ApiBearerAuth()
@Controller('student/me')
export class StudentPortalController {
  constructor(private readonly service: StudentPortalService) {}

  @Get('dashboard')
  @RequirePermissions('student_progress.read')
  @ApiOperation({ summary: 'Get current student dashboard overview' })
  async getDashboard(@CurrentUser() user: AuthenticatedUser) {
    const student = await this.service.requireStudentProfile(user);
    return this.service.getDashboardForStudent(student.id);
  }

  @Get('plan')
  @RequirePermissions('educational_plans.read')
  @ApiOperation({ summary: 'Get active educational plan for current student' })
  async getPlan(@CurrentUser() user: AuthenticatedUser) {
    const student = await this.service.requireStudentProfile(user);
    return this.service.getPlanForStudent(student.id);
  }

  @Get('attendance')
  @RequirePermissions('attendance.read')
  @ApiOperation({ summary: 'Get attendance history for current student' })
  async getAttendance(@CurrentUser() user: AuthenticatedUser) {
    const student = await this.service.requireStudentProfile(user);
    return this.service.getAttendanceForStudent(student.id);
  }

  @Get('memorization')
  @RequirePermissions('memorization.read')
  @ApiOperation({ summary: 'Get memorization records for current student' })
  async getMemorization(@CurrentUser() user: AuthenticatedUser) {
    const student = await this.service.requireStudentProfile(user);
    return this.service.getMemorizationForStudent(student.id);
  }

  @Get('revision')
  @RequirePermissions('revision.read')
  @ApiOperation({ summary: 'Get revision records for current student' })
  async getRevision(@CurrentUser() user: AuthenticatedUser) {
    const student = await this.service.requireStudentProfile(user);
    return this.service.getRevisionForStudent(student.id);
  }

  @Get('exams')
  @RequirePermissions('exams.read')
  @ApiOperation({ summary: 'Get upcoming exams and results for current student' })
  async getExams(@CurrentUser() user: AuthenticatedUser) {
    const student = await this.service.requireStudentProfile(user);
    return this.service.getExamsForStudent(student.id);
  }

  @Get('evaluations')
  @RequirePermissions('student_evaluations.read')
  @ApiOperation({ summary: 'Get periodic evaluations for current student' })
  async getEvaluations(@CurrentUser() user: AuthenticatedUser) {
    const student = await this.service.requireStudentProfile(user);
    return this.service.getEvaluationsForStudent(student.id);
  }

  @Get('progress')
  @RequirePermissions('student_progress.read')
  @ApiOperation({ summary: 'Get aggregated progress indicators for current student' })
  async getProgress(@CurrentUser() user: AuthenticatedUser) {
    const student = await this.service.requireStudentProfile(user);
    return this.service.getProgressForStudent(student.id);
  }
}
