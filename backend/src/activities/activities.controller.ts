import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import {
  ActivityQueryDto,
  CreateActivityDto,
  NominateParticipantDto,
  UpdateActivityDto,
  UpdateParticipantStatusDto,
} from './dto/activity.dto';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @RequirePermissions('activities.manage')
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateActivityDto,
  ) {
    return this.activitiesService.create(user, dto);
  }

  @Get()
  @RequirePermissions('activities.read')
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ActivityQueryDto,
  ) {
    return this.activitiesService.findAll(user, query);
  }

  @Get(':id')
  @RequirePermissions('activities.read')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.activitiesService.findOne(user, id);
  }

  @Patch(':id')
  @RequirePermissions('activities.manage')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(user, id, dto);
  }

  @Post(':id/participants')
  @RequirePermissions('activities.manage')
  async nominateParticipant(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: NominateParticipantDto,
  ) {
    return this.activitiesService.nominateParticipant(user, id, dto);
  }

  @Patch(':id/participants/:studentId')
  @RequirePermissions('activities.manage')
  async updateParticipantStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Body() dto: UpdateParticipantStatusDto,
  ) {
    return this.activitiesService.updateParticipantStatus(user, id, studentId, dto);
  }
}
