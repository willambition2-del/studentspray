import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { RequireRoles } from '../auth/decorators/require-roles.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ParentPortalService } from './parent-portal.service';

@ApiTags('Parent Portal (Mobile & Web)')
@ApiBearerAuth()
@Controller('parent/me')
export class ParentPortalController {
  constructor(private readonly service: ParentPortalService) {}

  @Get('mobile-home')
  @RequireRoles('PARENT')
  @RequirePermissions('students.read')
  @ApiOperation({ summary: 'Get unified mobile home payload for parent' })
  getMobileHome(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getMobileHome(user);
  }

  @Get('children')
  @RequirePermissions('students.read')
  @ApiOperation({ summary: 'List linked children for authenticated parent' })
  getChildren(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getChildren(user);
  }

  @Get('children/:studentId/dashboard')
  @RequirePermissions('student_progress.read')
  @ApiOperation({ summary: 'Get full child dashboard overview' })
  getChildDashboard(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
  ) {
    return this.service.getChildDashboard(user, studentId);
  }

  @Get('children/:studentId/plan')
  @RequirePermissions('educational_plans.read')
  @ApiOperation({ summary: 'Get active educational plan for child' })
  getChildPlan(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
  ) {
    return this.service.getChildPlan(user, studentId);
  }

  @Get('children/:studentId/attendance')
  @RequirePermissions('attendance.read')
  @ApiOperation({ summary: 'Get attendance history for child' })
  getChildAttendance(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
  ) {
    return this.service.getChildAttendance(user, studentId);
  }

  @Get('children/:studentId/memorization')
  @RequirePermissions('memorization.read')
  @ApiOperation({ summary: 'Get memorization records for child' })
  getChildMemorization(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
  ) {
    return this.service.getChildMemorization(user, studentId);
  }

  @Get('children/:studentId/revision')
  @RequirePermissions('revision.read')
  @ApiOperation({ summary: 'Get revision records for child' })
  getChildRevision(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
  ) {
    return this.service.getChildRevision(user, studentId);
  }

  @Get('children/:studentId/exams')
  @RequirePermissions('exams.read')
  @ApiOperation({ summary: 'Get upcoming exams and published results for child' })
  getChildExams(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
  ) {
    return this.service.getChildExams(user, studentId);
  }

  @Get('children/:studentId/evaluations')
  @RequirePermissions('student_evaluations.read')
  @ApiOperation({ summary: 'Get periodic evaluations for child' })
  getChildEvaluations(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
  ) {
    return this.service.getChildEvaluations(user, studentId);
  }

  @Get('children/:studentId/progress')
  @RequirePermissions('student_progress.read')
  @ApiOperation({ summary: 'Get progress indicators for child' })
  getChildProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
  ) {
    return this.service.getChildProgress(user, studentId);
  }

  @Get('children/:studentId/activities')
  @RequirePermissions('activities.read')
  @ApiOperation({ summary: 'Get activities and participation for child' })
  getChildActivities(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
  ) {
    return this.service.getChildActivities(user, studentId);
  }

  @Get('children/:studentId/competitions')
  @RequirePermissions('competitions.read')
  @ApiOperation({ summary: 'Get competitions and published results for child' })
  getChildCompetitions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
  ) {
    return this.service.getChildCompetitions(user, studentId);
  }

  @Get('children/:studentId/awards')
  @RequirePermissions('awards.read')
  @ApiOperation({ summary: 'Get awards and achievements for child' })
  getChildAwards(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
  ) {
    return this.service.getChildAwards(user, studentId);
  }
}
