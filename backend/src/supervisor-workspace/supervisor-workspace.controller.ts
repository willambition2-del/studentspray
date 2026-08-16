import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { authContext } from '../auth/http-auth-context';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { RequestWithId } from '../common/types/request-with-id';
import {
  CreateFieldVisitDto,
  CreateRecommendationDto,
  CreateRecommendationFollowUpDto,
  RecommendationQueryDto,
  SaveFieldVisitEvaluationDto,
  UpdateFieldVisitStatusDto,
  UpdateRecommendationDto,
} from '../field-visits/dto/field-visit.dto';
import { SupervisorVisitsQueryDto } from './dto/supervisor-workspace.dto';
import { SupervisorWorkspaceService } from './supervisor-workspace.service';

@ApiTags('Supervisor Workspace')
@ApiBearerAuth()
@Controller('supervisor/me')
export class SupervisorWorkspaceController {
  constructor(private readonly service: SupervisorWorkspaceService) {}

  @Get('dashboard')
  @RequirePermissions('supervisor_reports.read')
  @ApiOperation({ summary: 'Get supervisor personal dashboard metrics and recent items' })
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getDashboard(user);
  }

  @Get('halaqas')
  @RequirePermissions('halaqas.read')
  @ApiOperation({ summary: 'Get assigned halaqas under supervision' })
  getHalaqas(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getHalaqas(user);
  }

  @Get('teachers')
  @RequirePermissions('students.read')
  @ApiOperation({ summary: 'Get assigned teachers under supervision' })
  getTeachers(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getTeachers(user);
  }

  @Get('teachers/:teacherId')
  @RequirePermissions('students.read')
  @ApiOperation({ summary: 'Get teacher profile, history and recommendations' })
  getTeacherDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('teacherId') teacherId: string,
  ) {
    return this.service.getTeacherDetail(user, teacherId);
  }

  @Get('visits')
  @RequirePermissions('field_visits.read')
  @ApiOperation({ summary: 'List visits assigned to current supervisor' })
  getVisits(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SupervisorVisitsQueryDto,
  ) {
    return this.service.getVisits(user, query);
  }

  @Get('visits/:id')
  @RequirePermissions('field_visits.read')
  @ApiOperation({ summary: 'Get details of a field visit' })
  getVisitDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.service.getVisitDetail(user, id);
  }

  @Get('visits/:id/workspace')
  @RequirePermissions('field_visits.read')
  @ApiOperation({ summary: 'Get visit preparation workspace context and live stats' })
  getVisitWorkspace(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.service.getVisitWorkspace(user, id);
  }

  @Post('visits')
  @RequirePermissions('field_visits.write')
  @ApiOperation({ summary: 'Create a new visit as supervisor' })
  createVisit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFieldVisitDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.createVisit(user, dto, authContext(req));
  }

  @Patch('visits/:id/status')
  @RequirePermissions('field_visits.write')
  @ApiOperation({ summary: 'Update visit status (start or complete)' })
  updateVisitStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateFieldVisitStatusDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.updateVisitStatus(user, id, dto, authContext(req));
  }

  @Get('visits/:id/evaluation')
  @RequirePermissions('evaluations.read')
  @ApiOperation({ summary: 'Get evaluation report or template for a visit' })
  getVisitEvaluation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.service.getVisitEvaluation(user, id);
  }

  @Put('visits/:id/evaluation')
  @RequirePermissions('evaluations.write')
  @ApiOperation({ summary: 'Save evaluation draft for a visit' })
  saveVisitEvaluation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SaveFieldVisitEvaluationDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.saveVisitEvaluation(user, id, dto, authContext(req));
  }

  @Post('visits/:id/evaluation/submit')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('evaluations.write')
  @ApiOperation({ summary: 'Submit final evaluation report for a visit' })
  submitVisitEvaluation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SaveFieldVisitEvaluationDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.submitVisitEvaluation(user, id, dto, authContext(req));
  }

  @Get('recommendations')
  @RequirePermissions('recommendations.read')
  @ApiOperation({ summary: 'Get recommendations assigned to supervisor halaqas' })
  getRecommendations(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: RecommendationQueryDto,
  ) {
    return this.service.getRecommendations(user, query);
  }

  @Post('visits/:id/recommendations')
  @RequirePermissions('recommendations.write')
  @ApiOperation({ summary: 'Add a recommendation to a visit' })
  createRecommendation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateRecommendationDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.createRecommendation(user, id, dto, authContext(req));
  }

  @Patch('recommendations/:id')
  @RequirePermissions('recommendations.write')
  @ApiOperation({ summary: 'Update recommendation status or details' })
  updateRecommendation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateRecommendationDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.updateRecommendation(user, id, dto, authContext(req));
  }

  @Post('recommendations/:id/follow-ups')
  @RequirePermissions('recommendations.write')
  @ApiOperation({ summary: 'Add follow-up note and status change to recommendation' })
  addRecommendationFollowUp(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateRecommendationFollowUpDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.addRecommendationFollowUp(user, id, dto, authContext(req));
  }
}
