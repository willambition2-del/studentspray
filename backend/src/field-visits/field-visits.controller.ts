import {
  Body,
  Controller,
  Get,
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
  FieldVisitQueryDto,
  RecommendationQueryDto,
  SaveFieldVisitEvaluationDto,
  UpdateFieldVisitStatusDto,
  UpdateRecommendationDto,
} from './dto/field-visit.dto';
import { FieldVisitsService } from './field-visits.service';

@ApiTags('Field Visits')
@ApiBearerAuth()
@Controller('field-visits')
export class FieldVisitsController {
  constructor(private readonly service: FieldVisitsService) {}

  @Get()
  @RequirePermissions('field_visits.read')
  @ApiOperation({ summary: 'List field visits within authorized scope' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: FieldVisitQueryDto) {
    return this.service.list(user, query);
  }

  @Get('recommendations')
  @RequirePermissions('recommendations.read')
  @ApiOperation({ summary: 'List recommendations within authorized scope' })
  listRecommendations(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: RecommendationQueryDto,
  ) {
    return this.service.listRecommendations(user, query);
  }

  @Get(':id')
  @RequirePermissions('field_visits.read')
  @ApiOperation({ summary: 'Get field visit details' })
  getById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.getById(user, id);
  }

  @Post()
  @RequirePermissions('field_visits.write')
  @ApiOperation({ summary: 'Create a planned field visit' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFieldVisitDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.create(user, dto, authContext(req));
  }

  @Patch(':id/status')
  @RequirePermissions('field_visits.write')
  @ApiOperation({ summary: 'Update field visit status' })
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateFieldVisitStatusDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.updateStatus(user, id, dto, authContext(req));
  }

  @Put(':id/evaluation')
  @RequirePermissions('evaluations.write')
  @ApiOperation({ summary: 'Save evaluation draft or submit final evaluation for a field visit' })
  saveEvaluation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SaveFieldVisitEvaluationDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.saveEvaluation(user, id, dto, authContext(req));
  }

  @Post('recommendations')
  @RequirePermissions('recommendations.write')
  @ApiOperation({ summary: 'Create recommendation' })
  createRecommendation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRecommendationDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.createRecommendation(user, dto, authContext(req));
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
  @ApiOperation({ summary: 'Add follow-up to recommendation' })
  addFollowUp(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateRecommendationFollowUpDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.addFollowUp(user, id, dto, authContext(req));
  }
}
