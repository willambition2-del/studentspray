import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CompetitionsService } from './competitions.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import {
  BulkRecordResultsDto,
  CompetitionQueryDto,
  CreateCompetitionDto,
  RegisterCompetitionParticipantDto,
  UpdateCompetitionDto,
} from './dto/competition.dto';

@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  @Post()
  @RequirePermissions('competitions.manage')
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCompetitionDto,
  ) {
    return this.competitionsService.create(user, dto);
  }

  @Get()
  @RequirePermissions('competitions.read')
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CompetitionQueryDto,
  ) {
    return this.competitionsService.findAll(user, query);
  }

  @Get(':id')
  @RequirePermissions('competitions.read')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.competitionsService.findOne(user, id);
  }

  @Patch(':id')
  @RequirePermissions('competitions.manage')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCompetitionDto,
  ) {
    return this.competitionsService.update(user, id, dto);
  }

  @Post(':id/participants')
  @RequirePermissions('competitions.manage')
  async registerParticipant(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RegisterCompetitionParticipantDto,
  ) {
    return this.competitionsService.registerParticipant(user, id, dto);
  }

  @Post(':id/results')
  @RequirePermissions('competition_results.manage')
  async recordResults(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: BulkRecordResultsDto,
  ) {
    return this.competitionsService.recordResults(user, id, dto);
  }
}
